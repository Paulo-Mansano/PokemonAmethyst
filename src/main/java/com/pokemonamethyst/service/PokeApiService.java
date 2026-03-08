package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.CategoriaMovimento;
import com.pokemonamethyst.domain.Movimento;
import com.pokemonamethyst.domain.Tipagem;
import com.pokemonamethyst.repository.MovimentoRepository;
import com.pokemonamethyst.web.dto.PokeApiPokemonDetailDto;
import com.pokemonamethyst.web.dto.PokeApiPokemonSummaryDto;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PokeApiService {

    private static final String BASE_URL = "https://pokeapi.co/api/v2";
    private static final String SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/%d.png";
    private static final int IMPORTAR_MOVIMENTOS_LIMITE = 500;

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

    public PokeApiService(RestTemplate restTemplate, MovimentoRepository movimentoRepository) {
        this.restTemplate = restTemplate;
        this.movimentoRepository = movimentoRepository;
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
            throw new com.pokemonamethyst.exception.RecursoNaoEncontradoException("Pokémon não encontrado na PokéAPI: " + idOuNome);
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
     * Importa movimentos da PokéAPI (apenas nome e tipagem, opcionalmente categoria).
     * Retorna o número de movimentos criados.
     */
    public int importarMovimentos() {
        String url = BASE_URL + "/move?limit=" + IMPORTAR_MOVIMENTOS_LIMITE + "&offset=0";
        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response == null || !response.containsKey("results")) {
            return 0;
        }
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
        int criados = 0;
        for (Map<String, Object> item : results) {
            String urlStr = (String) item.get("url");
            int id = extrairIdDaUrl(urlStr);
            if (id <= 0) continue;
            try {
                Map<String, Object> detail = restTemplate.getForObject(BASE_URL + "/move/" + id, Map.class);
                if (detail == null) continue;
                String name = (String) detail.get("name");
                if (name == null || name.isBlank()) continue;
                String nomeExibicao = capitalizarNomeMove(name);
                if (movimentoRepository.findByNomeIgnoreCase(nomeExibicao).isPresent()) continue;
                Tipagem tipo = extrairTipoMove(detail);
                CategoriaMovimento categoria = extrairCategoriaMove(detail);
                Movimento m = new Movimento();
                m.setNome(nomeExibicao);
                m.setTipo(tipo);
                m.setCategoria(categoria);
                m.setCustoStamina(0);
                m.setDadoDeDano(null);
                m.setDescricaoEfeito(null);
                movimentoRepository.save(m);
                criados++;
            } catch (Exception ignored) {
                // ignora movimento que falhou (ex.: 404)
            }
        }
        return criados;
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
        return CategoriaMovimento.STATUS;
    }
}
