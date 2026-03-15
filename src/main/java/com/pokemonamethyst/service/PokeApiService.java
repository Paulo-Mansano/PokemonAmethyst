package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.CategoriaMovimento;
import com.pokemonamethyst.domain.Habilidade;
import com.pokemonamethyst.domain.Movimento;
import com.pokemonamethyst.domain.Item;
import com.pokemonamethyst.domain.Tipagem;
import com.pokemonamethyst.repository.HabilidadeRepository;
import com.pokemonamethyst.repository.MovimentoRepository;
import com.pokemonamethyst.repository.ItemRepository;
import com.pokemonamethyst.exception.RecursoNaoEncontradoException;
import com.pokemonamethyst.web.dto.PokeApiItemBuscaResponseDto;
import com.pokemonamethyst.web.dto.PokeApiItemResumoDto;
import com.pokemonamethyst.web.dto.PokeApiPokemonDetailDto;
import com.pokemonamethyst.web.dto.PokeApiPokemonSummaryDto;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PokeApiService {

    private record ItemDados(int pokeapiId, String nome, String nomeEn, String descricao, double peso, int preco, String imagemUrl) {}

    private static final String BASE_URL = "https://pokeapi.co/api/v2";
    private static final String SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/%d.png";
    private static final int IMPORTAR_MOVIMENTOS_LIMITE = 2500;
    private static final int IMPORTAR_HABILIDADES_LIMITE = 500;

    private static final Map<String, CategoriaMovimento> DAMAGE_CLASS_MAP = Map.of(
            "physical", CategoriaMovimento.FISICO,
            "special", CategoriaMovimento.ESPECIAL,
            "status", CategoriaMovimento.STATUS
    );

    private static final Map<String, Tipagem> TYPE_MAP = Map.ofEntries(
            Map.entry("normal", Tipagem.NORMAL),
            Map.entry("fire", Tipagem.FOGO),
            Map.entry("water", Tipagem.AGUA),
            Map.entry("electric", Tipagem.ELETRICO),
            Map.entry("grass", Tipagem.GRAMA),
            Map.entry("ice", Tipagem.GELO),
            Map.entry("fighting", Tipagem.LUTADOR),
            Map.entry("poison", Tipagem.VENENOSO),
            Map.entry("ground", Tipagem.TERRA),
            Map.entry("flying", Tipagem.VOADOR),
            Map.entry("psychic", Tipagem.PSIQUICO),
            Map.entry("bug", Tipagem.INSETO),
            Map.entry("rock", Tipagem.PEDRA),
            Map.entry("ghost", Tipagem.FANTASMA),
            Map.entry("dragon", Tipagem.DRAGAO),
            Map.entry("dark", Tipagem.SOMBRIO),
            Map.entry("steel", Tipagem.METAL),
            Map.entry("fairy", Tipagem.FADA)
    );

    private final RestTemplate restTemplate;
    private final MovimentoRepository movimentoRepository;
    private final ItemRepository itemRepository;
    private final HabilidadeRepository habilidadeRepository;

    public PokeApiService(RestTemplate restTemplate, MovimentoRepository movimentoRepository, ItemRepository itemRepository,
                          HabilidadeRepository habilidadeRepository) {
        this.restTemplate = restTemplate;
        this.movimentoRepository = movimentoRepository;
        this.itemRepository = itemRepository;
        this.habilidadeRepository = habilidadeRepository;
    }

    private static final int FETCH_SIZE_COM_FILTRO = 2000;

    public List<PokeApiPokemonSummaryDto> listar(int limit, int offset) {
        String url = BASE_URL + "/pokemon?limit=" + limit + "&offset=" + offset;
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response == null || !response.containsKey("results")) {
            return List.of();
        }
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
        return results.stream()
                .map(this::toSummary)
                .collect(Collectors.toList());
    }

    public List<PokeApiPokemonSummaryDto> listarComFiltro(int limit, int offset, String nome, Integer pokedexId) {
        boolean temFiltro = (nome != null && !nome.isBlank()) || (pokedexId != null);
        if (!temFiltro) {
            return listar(limit, offset);
        }
        String url = BASE_URL + "/pokemon?limit=" + FETCH_SIZE_COM_FILTRO + "&offset=0";
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response == null || !response.containsKey("results")) {
            return List.of();
        }
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
        List<PokeApiPokemonSummaryDto> todos = results.stream()
                .map(this::toSummary)
                .filter(s -> matchesFilter(s, nome, pokedexId))
                .collect(Collectors.toList());
        int from = Math.min(offset, todos.size());
        int to = Math.min(offset + limit, todos.size());
        return new ArrayList<>(todos.subList(from, to));
    }

    private boolean matchesFilter(PokeApiPokemonSummaryDto s, String nome, Integer pokedexId) {
        if (pokedexId != null && s.getId() == pokedexId) return true;
        if (nome != null && !nome.isBlank() && s.getName() != null
                && s.getName().toLowerCase().contains(nome.trim().toLowerCase())) {
            return true;
        }
        return false;
    }

    public PokeApiPokemonDetailDto buscarPorIdOuNome(String idOuNome) {
        String url = BASE_URL + "/pokemon/" + idOuNome;
        try {
            Map<String, Object> data = restTemplate.getForObject(url, Map.class);
            return toDetail(data);
        } catch (HttpClientErrorException.NotFound e) {
            throw new RecursoNaoEncontradoException("Pokémon não encontrado na PokéAPI: " + idOuNome);
        }
    }

    private PokeApiPokemonSummaryDto toSummary(Map<String, Object> item) {
        String urlStr = (String) item.get("url");
        int id = extrairIdDaUrl(urlStr);
        String name = (String) item.get("name");
        String imageUrl = String.format(SPRITE_BASE, id);
        return new PokeApiPokemonSummaryDto(id, name, imageUrl);
    }

    private int extrairIdDaUrl(String url) {
        if (url == null || url.isEmpty()) return 0;
        String trimmed = url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
        int lastSlash = trimmed.lastIndexOf('/');
        String segment = lastSlash >= 0 ? trimmed.substring(lastSlash + 1) : trimmed;
        try {
            return Integer.parseInt(segment);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    @SuppressWarnings("unchecked")
    private PokeApiPokemonDetailDto toDetail(Map<String, Object> data) {
        if (data == null) return null;
        int id = ((Number) data.getOrDefault("id", 0)).intValue();
        String name = (String) data.getOrDefault("name", "");
        String imageUrl = extrairImageUrl(data);
        Tipagem tipoPrimario = Tipagem.NORMAL;
        Tipagem tipoSecundario = null;

        List<Map<String, Object>> types = (List<Map<String, Object>>) data.get("types");
        if (types != null && !types.isEmpty()) {
            tipoPrimario = nomeParaTipagem(types.get(0));
            tipoSecundario = types.size() > 1 ? nomeParaTipagem(types.get(1)) : null;
        }

        return new PokeApiPokemonDetailDto(
                id,
                name,
                imageUrl,
                tipoPrimario.name(),
                tipoSecundario != null ? tipoSecundario.name() : null
        );
    }

    @SuppressWarnings("unchecked")
    private String extrairImageUrl(Map<String, Object> data) {
        Object sprites = data.get("sprites");
        if (sprites instanceof Map) {
            Map<String, Object> sp = (Map<String, Object>) sprites;
            String front = (String) sp.get("front_default");
            if (front != null && !front.isEmpty()) return front;
        }
        int id = ((Number) data.getOrDefault("id", 0)).intValue();
        return String.format(SPRITE_BASE, id);
    }

    @SuppressWarnings("unchecked")
    private Tipagem nomeParaTipagem(Map<String, Object> typeEntry) {
        Object type = typeEntry.get("type");
        if (type instanceof Map) {
            String name = (String) ((Map<String, Object>) type).get("name");
            if (name != null && TYPE_MAP.containsKey(name)) {
                return TYPE_MAP.get(name);
            }
        }
        return Tipagem.NORMAL;
    }

    /**
     * Importa movimentos da PokéAPI com nomes e descrição em PT/EN (prioriza PT).
     * Usa pokeapi_id para idempotência.
     */
    @SuppressWarnings("unchecked")
    public int importarMovimentos() {
        int total = 0;
        int offset = 0;
        int limit = 500;
        while (true) {
            String url = BASE_URL + "/move?limit=" + limit + "&offset=" + offset;
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            if (response == null || !response.containsKey("results")) break;
            List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
            if (results.isEmpty()) break;
            for (Map<String, Object> item : results) {
                String urlStr = (String) item.get("url");
                int id = extrairIdDaUrl(urlStr);
                if (id <= 0) continue;
                try {
                    Map<String, Object> detail = restTemplate.getForObject(BASE_URL + "/move/" + id, Map.class);
                    if (detail == null) continue;
                    String nomePt = extrairNomeMovePt(detail);
                    String nomeEn = extrairNomeMoveEn(detail);
                    String nomeFinal = nomePt != null && !nomePt.isBlank() ? nomePt : (nomeEn != null ? capitalizarNomeMove(nomeEn) : null);
                    if (nomeFinal == null || nomeFinal.isBlank()) {
                        Object raw = detail.get("name");
                        nomeFinal = raw instanceof String ? capitalizarNomeMove((String) raw) : "";
                    }
                    if (nomeFinal.isBlank()) continue;
                    String descricao = extrairDescricaoMovePt(detail);
                    if (descricao == null || descricao.isBlank()) descricao = extrairDescricaoMoveEn(detail);
                    Tipagem tipo = extrairTipoMove(detail);
                    CategoriaMovimento categoria = extrairCategoriaMove(detail);
                    Movimento m = movimentoRepository.findByPokeapiId(id).orElse(null);
                    if (m == null) m = new Movimento();
                    m.setPokeapiId(id);
                    m.setNome(nomeFinal);
                    m.setNomeEn(nomeEn != null && !nomeEn.isBlank() ? capitalizarNomeMove(nomeEn) : null);
                    m.setTipo(tipo != null ? tipo : Tipagem.NORMAL);
                    m.setCategoria(categoria);
                    m.setCustoStamina(m.getCustoStamina());
                    if (descricao != null && !descricao.isBlank()) m.setDescricaoEfeito(descricao);
                    movimentoRepository.save(m);
                    total++;
                } catch (Exception ignored) {
                }
            }
            if (results.size() < limit) break;
            offset += limit;
        }
        return total;
    }

    @SuppressWarnings("unchecked")
    private String extrairNomeMovePt(Map<String, Object> detail) {
        List<Map<String, Object>> names = (List<Map<String, Object>>) detail.get("names");
        if (names == null) return null;
        for (Map<String, Object> n : names) {
            Object lang = n.get("language");
            if (lang instanceof Map && "pt-br".equalsIgnoreCase((String) ((Map<?, ?>) lang).get("name"))) {
                String v = (String) n.get("name");
                if (v != null && !v.isBlank()) return v;
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private String extrairNomeMoveEn(Map<String, Object> detail) {
        List<Map<String, Object>> names = (List<Map<String, Object>>) detail.get("names");
        if (names == null) return null;
        for (Map<String, Object> n : names) {
            Object lang = n.get("language");
            if (lang instanceof Map && "en".equalsIgnoreCase((String) ((Map<?, ?>) lang).get("name"))) {
                String v = (String) n.get("name");
                if (v != null && !v.isBlank()) return v;
            }
        }
        return (String) detail.get("name");
    }

    @SuppressWarnings("unchecked")
    private String extrairDescricaoMovePt(Map<String, Object> detail) {
        List<Map<String, Object>> entries = (List<Map<String, Object>>) detail.get("effect_entries");
        if (entries != null) {
            for (Map<String, Object> e : entries) {
                Object lang = e.get("language");
                if (lang instanceof Map && "pt-br".equalsIgnoreCase((String) ((Map<?, ?>) lang).get("name"))) {
                    String v = (String) e.get("effect");
                    if (v != null && !v.isBlank()) return v.replace('\n', ' ').trim();
                }
            }
        }
        List<Map<String, Object>> flavor = (List<Map<String, Object>>) detail.get("flavor_text_entries");
        if (flavor != null) {
            for (Map<String, Object> f : flavor) {
                Object lang = f.get("language");
                if (lang instanceof Map && "pt-br".equalsIgnoreCase((String) ((Map<?, ?>) lang).get("name"))) {
                    String v = (String) f.get("flavor_text");
                    if (v != null && !v.isBlank()) return v.replace('\n', ' ').replace('\f', ' ').trim();
                }
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private String extrairDescricaoMoveEn(Map<String, Object> detail) {
        List<Map<String, Object>> entries = (List<Map<String, Object>>) detail.get("effect_entries");
        if (entries != null) {
            for (Map<String, Object> e : entries) {
                Object lang = e.get("language");
                if (lang instanceof Map && "en".equalsIgnoreCase((String) ((Map<?, ?>) lang).get("name"))) {
                    String v = (String) e.get("effect");
                    if (v != null && !v.isBlank()) return v.replace('\n', ' ').trim();
                }
            }
        }
        List<Map<String, Object>> flavor = (List<Map<String, Object>>) detail.get("flavor_text_entries");
        if (flavor != null) {
            for (Map<String, Object> f : flavor) {
                Object lang = f.get("language");
                if (lang instanceof Map && "en".equalsIgnoreCase((String) ((Map<?, ?>) lang).get("name"))) {
                    String v = (String) f.get("flavor_text");
                    if (v != null && !v.isBlank()) return v.replace('\n', ' ').replace('\f', ' ').trim();
                }
            }
        }
        return null;
    }

    /**
     * Importa habilidades da PokéAPI com nomes em PT e EN e descrição (PT preferida, senão EN).
     */
    @SuppressWarnings("unchecked")
    public int importarHabilidades() {
        String url = BASE_URL + "/ability?limit=" + IMPORTAR_HABILIDADES_LIMITE + "&offset=0";
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response == null || !response.containsKey("results")) return 0;
        List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
        int total = 0;
        for (Map<String, Object> item : results) {
            String urlStr = (String) item.get("url");
            int id = extrairIdDaUrl(urlStr);
            if (id <= 0) continue;
            try {
                Map<String, Object> detail = restTemplate.getForObject(BASE_URL + "/ability/" + id, Map.class);
                if (detail == null) continue;
                String nomePt = extrairNomeHabilidadePt(detail);
                String nomeEn = extrairNomeHabilidadeEn(detail);
                String nomeFinal = nomePt != null && !nomePt.isBlank() ? nomePt : (nomeEn != null ? capitalizarNomeMove(nomeEn) : null);
                if (nomeFinal == null || nomeFinal.isBlank()) {
                    Object raw = detail.get("name");
                    nomeFinal = raw instanceof String ? capitalizarNomeMove((String) raw) : "";
                }
                if (nomeFinal.isBlank()) continue;
                String descricao = extrairDescricaoHabilidadePt(detail);
                if (descricao == null || descricao.isBlank()) descricao = extrairDescricaoHabilidadeEn(detail);
                Habilidade h = habilidadeRepository.findByPokeapiId(id).orElse(null);
                if (h == null) h = new Habilidade();
                h.setPokeapiId(id);
                h.setNome(nomeFinal);
                h.setNomeEn(nomeEn != null && !nomeEn.isBlank() ? capitalizarNomeMove(nomeEn) : null);
                if (descricao != null && !descricao.isBlank()) h.setDescricao(descricao);
                habilidadeRepository.save(h);
                total++;
            } catch (Exception ignored) {
            }
        }
        return total;
    }

    @SuppressWarnings("unchecked")
    private String extrairNomeHabilidadePt(Map<String, Object> detail) {
        List<Map<String, Object>> names = (List<Map<String, Object>>) detail.get("names");
        if (names == null) return null;
        for (Map<String, Object> n : names) {
            Object lang = n.get("language");
            if (lang instanceof Map && "pt-br".equalsIgnoreCase((String) ((Map<?, ?>) lang).get("name"))) {
                String v = (String) n.get("name");
                if (v != null && !v.isBlank()) return v;
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private String extrairNomeHabilidadeEn(Map<String, Object> detail) {
        List<Map<String, Object>> names = (List<Map<String, Object>>) detail.get("names");
        if (names == null) return null;
        for (Map<String, Object> n : names) {
            Object lang = n.get("language");
            if (lang instanceof Map && "en".equalsIgnoreCase((String) ((Map<?, ?>) lang).get("name"))) {
                String v = (String) n.get("name");
                if (v != null && !v.isBlank()) return v;
            }
        }
        return (String) detail.get("name");
    }

    @SuppressWarnings("unchecked")
    private String extrairDescricaoHabilidadePt(Map<String, Object> detail) {
        List<Map<String, Object>> entries = (List<Map<String, Object>>) detail.get("effect_entries");
        if (entries != null) {
            for (Map<String, Object> e : entries) {
                Object lang = e.get("language");
                if (lang instanceof Map && "pt-br".equalsIgnoreCase((String) ((Map<?, ?>) lang).get("name"))) {
                    String v = (String) e.get("effect");
                    if (v != null && !v.isBlank()) return v.replace('\n', ' ').trim();
                }
            }
        }
        List<Map<String, Object>> flavor = (List<Map<String, Object>>) detail.get("flavor_text_entries");
        if (flavor != null) {
            for (Map<String, Object> f : flavor) {
                Object lang = f.get("language");
                if (lang instanceof Map && "pt-br".equalsIgnoreCase((String) ((Map<?, ?>) lang).get("name"))) {
                    String v = (String) f.get("flavor_text");
                    if (v != null && !v.isBlank()) return v.replace('\n', ' ').replace('\f', ' ').trim();
                }
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private String extrairDescricaoHabilidadeEn(Map<String, Object> detail) {
        List<Map<String, Object>> entries = (List<Map<String, Object>>) detail.get("effect_entries");
        if (entries != null) {
            for (Map<String, Object> e : entries) {
                Object lang = e.get("language");
                if (lang instanceof Map && "en".equalsIgnoreCase((String) ((Map<?, ?>) lang).get("name"))) {
                    String v = (String) e.get("effect");
                    if (v != null && !v.isBlank()) return v.replace('\n', ' ').trim();
                }
            }
        }
        List<Map<String, Object>> flavor = (List<Map<String, Object>>) detail.get("flavor_text_entries");
        if (flavor != null) {
            for (Map<String, Object> f : flavor) {
                Object lang = f.get("language");
                if (lang instanceof Map && "en".equalsIgnoreCase((String) ((Map<?, ?>) lang).get("name"))) {
                    String v = (String) f.get("flavor_text");
                    if (v != null && !v.isBlank()) return v.replace('\n', ' ').replace('\f', ' ').trim();
                }
            }
        }
        return null;
    }

    /**
     * Importa itens da PokéAPI, preenchendo nome/descrição preferencialmente em pt-BR.
     * Usa pokeapiId como identificador externo para manter a operação idempotente.
     */
    @SuppressWarnings("unchecked")
    public int importarItens() {
        String url = BASE_URL + "/item?limit=10000&offset=0";
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response == null || !response.containsKey("results")) {
            return 0;
        }
        List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
        int atualizadosOuCriados = 0;
        for (Map<String, Object> itemSummary : results) {
            String urlStr = (String) itemSummary.get("url");
            int id = extrairIdDaUrl(urlStr);
            if (id <= 0) continue;
            try {
                Map<String, Object> detail = restTemplate.getForObject(BASE_URL + "/item/" + id, Map.class);
                if (detail == null) continue;
                if (salvarOuAtualizarItemDePokeApi(detail, id)) {
                    atualizadosOuCriados++;
                }
            } catch (Exception ignored) {
                // ignora item que falhou (ex.: 404 ou timeout)
            }
        }
        return atualizadosOuCriados;
    }

    private static final int LISTAR_ITENS_POR_NOME_LIMITE = 50;

    /**
     * Lista itens da PokéAPI cujo nome contém o termo (case insensitive).
     * Retorna resumos com pokeapiId, name e se já está cadastrado no catálogo.
     */
    @SuppressWarnings("unchecked")
    public List<PokeApiItemResumoDto> listarItensPokeApiPorNome(String q) {
        if (q == null || q.isBlank()) {
            return List.of();
        }
        String termo = q.trim().toLowerCase();
        String url = BASE_URL + "/item?limit=10000&offset=0";
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response == null || !response.containsKey("results")) {
            return List.of();
        }
        List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
        List<PokeApiItemResumoDto> lista = new ArrayList<>();
        for (Map<String, Object> item : results) {
            String name = (String) item.get("name");
            if (name == null || !name.toLowerCase().contains(termo)) {
                continue;
            }
            String urlStr = (String) item.get("url");
            int pokeapiId = extrairIdDaUrl(urlStr);
            if (pokeapiId <= 0) continue;
            boolean jaCadastrado = itemRepository.findByPokeapiId(pokeapiId).isPresent();
            lista.add(new PokeApiItemResumoDto(pokeapiId, name, jaCadastrado));
            if (lista.size() >= LISTAR_ITENS_POR_NOME_LIMITE) break;
        }
        return lista;
    }

    /**
     * Busca um item na PokéAPI por id ou nome. Não grava no banco.
     * Retorna dados do item e indica se já está cadastrado no catálogo.
     */
    public PokeApiItemBuscaResponseDto buscarItemPokeApi(String idOuNome) {
        if (idOuNome == null || idOuNome.isBlank()) {
            throw new RecursoNaoEncontradoException("Informe o id ou nome do item.");
        }
        try {
            Map<String, Object> detail = restTemplate.getForObject(BASE_URL + "/item/" + idOuNome.trim(), Map.class);
            if (detail == null) {
                throw new RecursoNaoEncontradoException("Item não encontrado na PokéAPI: " + idOuNome);
            }
            ItemDados dados = extrairDadosItemDePokeApi(detail);
            if (dados == null || dados.nome() == null || dados.nome().isBlank()) {
                throw new RecursoNaoEncontradoException("Item sem nome válido na PokéAPI: " + idOuNome);
            }
            Optional<Item> existing = itemRepository.findByPokeapiId(dados.pokeapiId());
            return new PokeApiItemBuscaResponseDto(
                    dados.pokeapiId(),
                    dados.nome(),
                    dados.nomeEn(),
                    dados.descricao(),
                    dados.peso(),
                    dados.preco(),
                    existing.isPresent(),
                    existing.map(Item::getId).orElse(null)
            );
        } catch (HttpClientErrorException.NotFound e) {
            throw new RecursoNaoEncontradoException("Item não encontrado na PokéAPI: " + idOuNome);
        }
    }

    /**
     * Importa um item específico da PokéAPI por id ou nome e salva no catálogo.
     */
    public Item importarItemPorIdOuNome(String idOuNome) {
        if (idOuNome == null || idOuNome.isBlank()) {
            throw new RecursoNaoEncontradoException("Informe o id ou nome do item.");
        }
        try {
            Map<String, Object> detail = restTemplate.getForObject(BASE_URL + "/item/" + idOuNome.trim(), Map.class);
            if (detail == null) {
                throw new RecursoNaoEncontradoException("Item não encontrado na PokéAPI: " + idOuNome);
            }
            int pokeapiId = ((Number) detail.get("id")).intValue();
            salvarOuAtualizarItemDePokeApi(detail, pokeapiId);
            return itemRepository.findByPokeapiId(pokeapiId)
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Item não foi salvo."));
        } catch (HttpClientErrorException.NotFound e) {
            throw new RecursoNaoEncontradoException("Item não encontrado na PokéAPI: " + idOuNome);
        }
    }

    /**
     * Atualiza a URL da imagem de todos os itens que têm pokeapi_id, buscando na PokéAPI.
     * Útil para preencher imagens de itens importados antes do campo existir.
     */
    public int atualizarImagensItensImportados() {
        List<Item> itens = itemRepository.findByPokeapiIdIsNotNull();
        int atualizados = 0;
        for (Item item : itens) {
            Integer id = item.getPokeapiId();
            if (id == null) continue;
            try {
                Map<String, Object> detail = restTemplate.getForObject(BASE_URL + "/item/" + id, Map.class);
                if (detail == null) continue;
                ItemDados dados = extrairDadosItemDePokeApi(detail);
                if (dados != null && dados.imagemUrl() != null && !dados.imagemUrl().isBlank()) {
                    item.setImagemUrl(dados.imagemUrl());
                    itemRepository.save(item);
                    atualizados++;
                }
            } catch (Exception ignored) {
                // ignora item que falhou (ex.: 404)
            }
        }
        return atualizados;
    }

    @SuppressWarnings("unchecked")
    private ItemDados extrairDadosItemDePokeApi(Map<String, Object> detail) {
        if (detail == null) return null;

        int pokeapiId = ((Number) detail.getOrDefault("id", 0)).intValue();
        if (pokeapiId <= 0) return null;

        String nomePtBr = null;
        String descricaoPtBr = null;
        String nomeEn = null;
        String descricaoEn = null;

        List<Map<String, Object>> names = (List<Map<String, Object>>) detail.get("names");
        if (names != null) {
            for (Map<String, Object> n : names) {
                Object lang = n.get("language");
                if (lang instanceof Map) {
                    String langName = (String) ((Map<String, Object>) lang).get("name");
                    String value = (String) n.get("name");
                    if ("pt-br".equalsIgnoreCase(langName) && value != null && !value.isBlank()) {
                        nomePtBr = value;
                    } else if ("en".equalsIgnoreCase(langName) && value != null && !value.isBlank()) {
                        nomeEn = value;
                    }
                }
            }
        }

        List<Map<String, Object>> flavorEntries = (List<Map<String, Object>>) detail.get("flavor_text_entries");
        if (flavorEntries != null) {
            for (Map<String, Object> f : flavorEntries) {
                Object lang = f.get("language");
                if (lang instanceof Map) {
                    String langName = (String) ((Map<String, Object>) lang).get("name");
                    String text = (String) f.get("flavor_text");
                    if (text != null) {
                        text = text.replace('\n', ' ').replace('\f', ' ').trim();
                    }
                    if ("pt-br".equalsIgnoreCase(langName) && text != null && !text.isBlank()) {
                        descricaoPtBr = text;
                    } else if ("en".equalsIgnoreCase(langName) && text != null && !text.isBlank()) {
                        descricaoEn = text;
                    }
                }
            }
        }

        String nomeFinal = nomePtBr != null ? nomePtBr : nomeEn;
        if (nomeFinal == null || nomeFinal.isBlank()) {
            Object rawName = detail.get("name");
            if (rawName instanceof String) {
                nomeFinal = ((String) rawName);
            }
        }
        if (nomeFinal == null || nomeFinal.isBlank()) {
            return null;
        }

        String descricaoFinal = descricaoPtBr != null ? descricaoPtBr : descricaoEn;

        double peso = 0;
        Object weightObj = detail.get("weight");
        if (weightObj instanceof Number) {
            peso = ((Number) weightObj).doubleValue();
        }

        int preco = 0;
        Object costObj = detail.get("cost");
        if (costObj instanceof Number) {
            preco = ((Number) costObj).intValue();
        }

        String imagemUrl = null;
        Object sprites = detail.get("sprites");
        if (sprites instanceof Map) {
            Object def = ((Map<?, ?>) sprites).get("default");
            if (def instanceof String && !((String) def).isBlank()) {
                imagemUrl = (String) def;
            }
        }
        if (imagemUrl == null || imagemUrl.isBlank()) {
            String itemName = (String) detail.get("name");
            if (itemName != null && !itemName.isBlank()) {
                imagemUrl = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/" + itemName + ".png";
            }
        }

        return new ItemDados(pokeapiId, nomeFinal, nomeEn, descricaoFinal, peso, preco, imagemUrl);
    }

    @SuppressWarnings("unchecked")
    private boolean salvarOuAtualizarItemDePokeApi(Map<String, Object> detail, int pokeapiId) {
        ItemDados dados = extrairDadosItemDePokeApi(detail);
        if (dados == null || dados.nome() == null || dados.nome().isBlank()) {
            return false;
        }

        Item item = itemRepository.findByPokeapiId(pokeapiId).orElse(null);
        if (item == null) {
            item = new Item();
            item.setPokeapiId(pokeapiId);
        }
        item.setNome(dados.nome());
        item.setNomeEn(dados.nomeEn());
        item.setDescricao(dados.descricao());
        item.setPeso(dados.peso());
        item.setPreco(dados.preco());
        if (dados.imagemUrl() != null && !dados.imagemUrl().isBlank()) {
            item.setImagemUrl(dados.imagemUrl());
        }
        itemRepository.save(item);
        return true;
    }

    private static String capitalizarNomeMove(String name) {
        if (name == null || name.isEmpty()) return name;
        StringBuilder sb = new StringBuilder();
        boolean cap = true;
        for (char c : name.toCharArray()) {
            if (c == '-' || c == ' ') {
                sb.append(c);
                cap = true;
            } else if (cap) {
                sb.append(Character.toUpperCase(c));
                cap = false;
            } else {
                sb.append(Character.toLowerCase(c));
            }
        }
        return sb.toString();
    }

    @SuppressWarnings("unchecked")
    private Tipagem extrairTipoMove(Map<String, Object> detail) {
        Object typeObj = detail.get("type");
        if (typeObj instanceof Map) {
            String name = (String) ((Map<String, Object>) typeObj).get("name");
            if (name != null && TYPE_MAP.containsKey(name)) return TYPE_MAP.get(name);
        }
        return Tipagem.NORMAL;
    }

    @SuppressWarnings("unchecked")
    private CategoriaMovimento extrairCategoriaMove(Map<String, Object> detail) {
        Object dc = detail.get("damage_class");
        if (dc instanceof Map) {
            String name = (String) ((Map<String, Object>) dc).get("name");
            if (name != null && DAMAGE_CLASS_MAP.containsKey(name)) return DAMAGE_CLASS_MAP.get(name);
        }
        return null;
    }
}
