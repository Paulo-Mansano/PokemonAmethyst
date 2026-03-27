package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.CategoriaMovimento;
import com.pokemonamethyst.domain.Habilidade;
import com.pokemonamethyst.domain.MoveLearnMethod;
import com.pokemonamethyst.domain.Movimento;
import com.pokemonamethyst.domain.Item;
import com.pokemonamethyst.domain.PokemonSpeciesHabilidade;
import com.pokemonamethyst.domain.PokemonSpeciesMovimento;
import com.pokemonamethyst.domain.PokemonSpecies;
import com.pokemonamethyst.domain.Tipagem;
import com.pokemonamethyst.repository.HabilidadeRepository;
import com.pokemonamethyst.repository.MovimentoRepository;
import com.pokemonamethyst.repository.ItemRepository;
import com.pokemonamethyst.repository.PokemonSpeciesHabilidadeRepository;
import com.pokemonamethyst.repository.PokemonSpeciesMovimentoRepository;
import com.pokemonamethyst.repository.PokemonSpeciesRepository;
import com.pokemonamethyst.exception.RecursoNaoEncontradoException;
import com.pokemonamethyst.exception.RegraNegocioException;
import com.pokemonamethyst.web.dto.PokeApiItemBuscaResponseDto;
import com.pokemonamethyst.web.dto.PokeApiItemResumoDto;
import com.pokemonamethyst.web.dto.PokeApiPokemonDetailDto;
import com.pokemonamethyst.web.dto.PokeApiPokemonSummaryDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class PokeApiService {

    private record ItemDados(int pokeapiId, String nome, String nomeEn, String descricao, double peso, int preco, String imagemUrl) {}

    private static final String BASE_URL = "https://pokeapi.co/api/v2";
    private static final String SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/%d.png";
    private static final int IMPORTAR_MOVIMENTOS_LIMITE = 2500;
    private static final int IMPORTAR_HABILIDADES_LIMITE = 500;
    private static final int IMPORTAR_SPECIES_PAGE_SIZE = 300;

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
    private final PokemonSpeciesRepository pokemonSpeciesRepository;
    private final PokemonSpeciesHabilidadeRepository speciesHabilidadeRepository;
    private final PokemonSpeciesMovimentoRepository speciesMovimentoRepository;
    private final PokemonAbilityService pokemonAbilityService;
    private final PokemonLearnsetService pokemonLearnsetService;
    private final TransactionTemplate transactionTemplate;
    private final Map<String, Integer> versionGroupOrderCache = new ConcurrentHashMap<>();
    private final Map<Integer, Object> speciesImportLocks = new ConcurrentHashMap<>();

    public PokeApiService(RestTemplate restTemplate, MovimentoRepository movimentoRepository, ItemRepository itemRepository,
                          HabilidadeRepository habilidadeRepository,
                          PokemonSpeciesRepository pokemonSpeciesRepository,
                          PokemonSpeciesHabilidadeRepository speciesHabilidadeRepository,
                          PokemonSpeciesMovimentoRepository speciesMovimentoRepository,
                          PokemonAbilityService pokemonAbilityService,
                          PokemonLearnsetService pokemonLearnsetService,
                          PlatformTransactionManager transactionManager) {
        this.restTemplate = restTemplate;
        this.movimentoRepository = movimentoRepository;
        this.itemRepository = itemRepository;
        this.habilidadeRepository = habilidadeRepository;
        this.pokemonSpeciesRepository = pokemonSpeciesRepository;
        this.speciesHabilidadeRepository = speciesHabilidadeRepository;
        this.speciesMovimentoRepository = speciesMovimentoRepository;
        this.pokemonAbilityService = pokemonAbilityService;
        this.pokemonLearnsetService = pokemonLearnsetService;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
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

    @Transactional
    public PokemonSpecies obterOuImportarSpecies(int pokedexId) {
        if (pokedexId <= 0) {
            return pokemonSpeciesRepository.findByPokedexId(0)
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Espécie padrão não encontrada."));
        }
        return pokemonSpeciesRepository.findByPokedexId(pokedexId)
                .orElseGet(() -> importarSpeciesDaPokeApi(pokedexId));
    }

    /**
     * Fluxo otimizado para criação: tenta local primeiro e só importa da PokéAPI no primeiro uso da espécie.
     * Usa lock por pokedexId para evitar importação duplicada em acessos concorrentes.
     * <p>
     * Ao importar, {@link #importarSpeciesDaPokeApi(int)} sincroniza habilidades (PokéAPI) + learnset completo
     * (movimentos por nível/método), criando entradas no catálogo quando necessário.
     * </p>
     */
    @Transactional
    public PokemonSpecies obterSpeciesParaCriacao(int pokedexId) {
        if (pokedexId <= 0) {
            throw new RecursoNaoEncontradoException("pokedexId inválido para criação de espécie.");
        }
        Optional<PokemonSpecies> local = pokemonSpeciesRepository.findByPokedexId(pokedexId);
        if (local.isPresent()) {
            return local.get();
        }

        Object lock = speciesImportLocks.computeIfAbsent(pokedexId, ignored -> new Object());
        synchronized (lock) {
            Optional<PokemonSpecies> localDentroLock = pokemonSpeciesRepository.findByPokedexId(pokedexId);
            if (localDentroLock.isPresent()) {
                return localDentroLock.get();
            }
            return importarSpeciesDaPokeApi(pokedexId);
        }
    }

    @Transactional(readOnly = true)
    public PokemonSpecies obterSpeciesLocal(int pokedexId) {
        if (pokedexId <= 0) {
            return pokemonSpeciesRepository.findByPokedexId(0)
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Espécie padrão não encontrada."));
        }
        return pokemonSpeciesRepository.findByPokedexId(pokedexId)
                .orElseThrow(() -> new RecursoNaoEncontradoException(
                        "Espécie não importada localmente. Importe via endpoint de mestre. pokedexId=" + pokedexId
                ));
    }

    @SuppressWarnings("unchecked")
    @Transactional
    public PokemonSpecies importarSpeciesDaPokeApi(int pokedexId) {
        try {
            Map<String, Object> pokemonData = restTemplate.getForObject(BASE_URL + "/pokemon/" + pokedexId, Map.class);
            Map<String, Object> speciesData = restTemplate.getForObject(BASE_URL + "/pokemon-species/" + pokedexId, Map.class);
            if (pokemonData == null || speciesData == null) {
                throw new RecursoNaoEncontradoException("Não foi possível carregar dados da espécie na PokéAPI: " + pokedexId);
            }

            PokemonSpecies species = pokemonSpeciesRepository.findByPokedexId(pokedexId).orElseGet(PokemonSpecies::new);
            species.setPokedexId(pokedexId);
            species.setNome(capitalizarNomeMove((String) pokemonData.getOrDefault("name", "unknown")));
            species.setImagemUrl(extrairImageUrl(pokemonData));
            species.setSpriteShinyUrl(extrairShinyUrl(pokemonData));
            species.setTipoPrimario(extrairTipoPorSlot(pokemonData, 1));
            species.setTipoSecundario(extrairTipoPorSlot(pokemonData, 2));
            species.setBaseHp(extrairStat(pokemonData, "hp"));
            species.setBaseAtaque(extrairStat(pokemonData, "attack"));
            species.setBaseDefesa(extrairStat(pokemonData, "defense"));
            species.setBaseAtaqueEspecial(extrairStat(pokemonData, "special-attack"));
            species.setBaseDefesaEspecial(extrairStat(pokemonData, "special-defense"));
            species.setBaseSpeed(extrairStat(pokemonData, "speed"));
            species.setBaseExperience(((Number) pokemonData.getOrDefault("base_experience", 0)).intValue());
            species.setHeight(((Number) pokemonData.getOrDefault("height", 0)).intValue());
            species.setWeight(((Number) pokemonData.getOrDefault("weight", 0)).intValue());
            species.setGrowthRate(extrairNomeReferencia(speciesData.get("growth_rate")));
            Number captureRate = (Number) speciesData.get("capture_rate");
            species.setCaptureRate(captureRate != null ? captureRate.intValue() : null);
            species.setHabitat(extrairNomeReferencia(speciesData.get("habitat")));
            species.setLegendary(Boolean.TRUE.equals(speciesData.get("is_legendary")));
            species.setMythical(Boolean.TRUE.equals(speciesData.get("is_mythical")));
            Number genderRate = (Number) speciesData.get("gender_rate");
            species.setGenderRate(genderRate != null ? genderRate.intValue() : null);
            species.setHasGenderDifferences(Boolean.TRUE.equals(speciesData.get("has_gender_differences")));
            species.setForms(extrairFormsJson(pokemonData));

            PokemonSpecies saved = pokemonSpeciesRepository.save(species);
            sincronizarAbilitiesDaSpecies(saved, pokemonData);
            sincronizarLearnsetDaSpecies(saved, pokemonData);
            String speciesId = saved.getId();
            pokemonAbilityService.invalidarCacheSpecies(speciesId);
            pokemonLearnsetService.invalidarCacheSpecies(speciesId);
            // deleteBySpeciesId (habilidades/learnset) usa clearAutomatically=true e deixa `saved` detached.
            // O objeto em memória ainda tem listas OneToMany vazias (default); merge ao salvar Pokemon pode
            // aplicar orphanRemoval e apagar todo o learnset/habilidades no BD. Recarrega espécie gerenciada.
            return pokemonSpeciesRepository.findByPokedexId(pokedexId)
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Espécie não encontrada após importação: " + pokedexId));
        } catch (HttpClientErrorException.NotFound e) {
            throw new RecursoNaoEncontradoException("Pokémon não encontrado na PokéAPI: " + pokedexId);
        } catch (RestClientException e) {
            throw new RegraNegocioException("Falha ao consultar a PokéAPI (rede ou limite). Tente novamente em instantes. Detalhe: " + e.getMessage());
        }
    }

    /**
     * Importa todas as espécies existentes na PokéAPI que ainda não estão salvas localmente.
     * Estratégia otimizada: faz diff por pokedexId e importa somente o que falta, com concorrência moderada.
     */
    public Map<String, Object> importarTodasSpeciesDaPokeApi() {
        List<Integer> todosIdsPokeApi = listarTodosPokedexIdsDaPokeApi();
        if (todosIdsPokeApi.isEmpty()) {
            return Map.of(
                    "totalPokeApi", 0,
                    "jaExistentes", 0,
                    "faltantes", 0,
                    "importadas", 0,
                    "falhas", 0,
                    "idsComFalha", List.of()
            );
        }

        Set<Integer> idsExistentes = new HashSet<>(pokemonSpeciesRepository.findAllPokedexIds());
        List<Integer> idsFaltantes = todosIdsPokeApi.stream()
                .filter(id -> id != null && id > 0)
                .filter(id -> !idsExistentes.contains(id))
                .sorted()
                .toList();

        if (idsFaltantes.isEmpty()) {
            return Map.of(
                    "totalPokeApi", todosIdsPokeApi.size(),
                    "jaExistentes", idsExistentes.size(),
                    "faltantes", 0,
                    "importadas", 0,
                    "falhas", 0,
                    "idsComFalha", List.of()
            );
        }

        int importadas = 0;
        int falhas = 0;
        List<Integer> idsComFalha = new ArrayList<>();
        for (Integer id : idsFaltantes) {
            try {
                transactionTemplate.executeWithoutResult(status -> importarSpeciesDaPokeApi(id));
                importadas++;
            } catch (Exception ignored) {
                falhas++;
                if (idsComFalha.size() < 25) {
                    idsComFalha.add(id);
                }
            }
        }

        return Map.of(
                "totalPokeApi", todosIdsPokeApi.size(),
                "jaExistentes", idsExistentes.size(),
                "faltantes", idsFaltantes.size(),
                "importadas", importadas,
                "falhas", falhas,
                "idsComFalha", idsComFalha
        );
    }

    /**
     * Preenche vínculos faltantes (habilidades e/ou learnset) das espécies já salvas localmente.
     * Não altera espécies que já estão completas.
     */
    public Map<String, Object> vincularSpeciesExistentesComDadosDaPokeApi() {
        List<PokemonSpecies> speciesList = pokemonSpeciesRepository.findAll().stream()
                .filter(s -> s.getPokedexId() > 0)
                .sorted(Comparator.comparingInt(PokemonSpecies::getPokedexId))
                .toList();

        int total = speciesList.size();
        int completas = 0;
        int vinculadas = 0;
        int falhas = 0;
        List<Integer> idsComFalha = new ArrayList<>();

        for (PokemonSpecies species : speciesList) {
            String speciesId = species.getId();
            boolean temHabilidades = speciesHabilidadeRepository.existsBySpeciesId(speciesId);
            boolean temLearnset = speciesMovimentoRepository.existsBySpeciesId(speciesId);
            if (temHabilidades && temLearnset) {
                completas++;
                continue;
            }
            try {
                transactionTemplate.executeWithoutResult(status ->
                        vincularDadosFaltantesDaSpecies(species.getPokedexId(), !temHabilidades, !temLearnset)
                );
                vinculadas++;
            } catch (Exception ignored) {
                falhas++;
                if (idsComFalha.size() < 25) {
                    idsComFalha.add(species.getPokedexId());
                }
            }
        }

        return Map.of(
                "totalSpeciesLocais", total,
                "completasSemAlteracao", completas,
                "vinculadas", vinculadas,
                "falhas", falhas,
                "idsComFalha", idsComFalha
        );
    }

    @SuppressWarnings("unchecked")
    private void vincularDadosFaltantesDaSpecies(int pokedexId, boolean sincronizarHabilidades, boolean sincronizarLearnset) {
        if (!sincronizarHabilidades && !sincronizarLearnset) {
            return;
        }
        PokemonSpecies species = pokemonSpeciesRepository.findByPokedexId(pokedexId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Espécie não encontrada localmente: " + pokedexId));
        Map<String, Object> pokemonData = restTemplate.getForObject(BASE_URL + "/pokemon/" + pokedexId, Map.class);
        if (pokemonData == null) {
            throw new RecursoNaoEncontradoException("Pokémon não encontrado na PokéAPI: " + pokedexId);
        }
        if (sincronizarHabilidades) {
            sincronizarAbilitiesDaSpecies(species, pokemonData);
        }
        if (sincronizarLearnset) {
            sincronizarLearnsetDaSpecies(species, pokemonData);
        }
        pokemonAbilityService.invalidarCacheSpecies(species.getId());
        pokemonLearnsetService.invalidarCacheSpecies(species.getId());
    }

    @SuppressWarnings("unchecked")
    private List<Integer> listarTodosPokedexIdsDaPokeApi() {
        String countUrl = BASE_URL + "/pokemon?limit=1&offset=0";
        Map<String, Object> primeiraPagina = restTemplate.getForObject(countUrl, Map.class);
        if (primeiraPagina == null) {
            return List.of();
        }
        Number totalRaw = (Number) primeiraPagina.get("count");
        int total = totalRaw != null ? totalRaw.intValue() : 0;
        if (total <= 0) {
            return List.of();
        }

        List<Integer> ids = new ArrayList<>(total);
        for (int offset = 0; offset < total; offset += IMPORTAR_SPECIES_PAGE_SIZE) {
            int limite = Math.min(IMPORTAR_SPECIES_PAGE_SIZE, total - offset);
            String pageUrl = BASE_URL + "/pokemon?limit=" + limite + "&offset=" + offset;
            Map<String, Object> pagina = restTemplate.getForObject(pageUrl, Map.class);
            if (pagina == null || !pagina.containsKey("results")) {
                continue;
            }
            List<Map<String, Object>> results = (List<Map<String, Object>>) pagina.get("results");
            if (results == null || results.isEmpty()) {
                continue;
            }
            for (Map<String, Object> item : results) {
                String url = (String) item.get("url");
                int id = extrairIdDaUrl(url);
                if (id > 0) {
                    ids.add(id);
                }
            }
        }
        return ids.stream().distinct().sorted().toList();
    }

    /**
     * Atualiza URLs de sprites (normal e shiny) da espécie a partir de {@code /pokemon/{id}} na PokéAPI.
     */
    @Transactional
    public PokemonSpecies atualizarSpritesDaPokeApi(int pokedexId) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> pokemonData = restTemplate.getForObject(BASE_URL + "/pokemon/" + pokedexId, Map.class);
            if (pokemonData == null) {
                throw new RecursoNaoEncontradoException("Pokémon não encontrado na PokéAPI: " + pokedexId);
            }
            PokemonSpecies species = pokemonSpeciesRepository.findByPokedexId(pokedexId)
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Espécie não encontrada localmente: " + pokedexId));
            species.setImagemUrl(extrairImageUrl(pokemonData));
            species.setSpriteShinyUrl(extrairShinyUrl(pokemonData));
            return pokemonSpeciesRepository.save(species);
        } catch (HttpClientErrorException.NotFound e) {
            throw new RecursoNaoEncontradoException("Pokémon não encontrado na PokéAPI: " + pokedexId);
        } catch (RestClientException e) {
            throw new RegraNegocioException(
                    "Falha ao consultar a PokéAPI (rede ou limite). Tente novamente em instantes. Detalhe: " + e.getMessage());
        }
    }

    /**
     * Garante que a espécie tenha URL de sprite shiny (consulta a API se ainda estiver vazia).
     */
    @Transactional
    public PokemonSpecies garantirSpriteShinyNaEspecie(PokemonSpecies species) {
        if (species == null) {
            return null;
        }
        if (species.getSpriteShinyUrl() != null && !species.getSpriteShinyUrl().isBlank()) {
            return species;
        }
        return atualizarSpritesDaPokeApi(species.getPokedexId());
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
    private String extrairShinyUrl(Map<String, Object> data) {
        Object sprites = data.get("sprites");
        if (sprites instanceof Map) {
            Map<String, Object> sp = (Map<String, Object>) sprites;
            String shiny = (String) sp.get("front_shiny");
            if (shiny != null && !shiny.isEmpty()) return shiny;
        }
        return null;
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

    @SuppressWarnings("unchecked")
    private Tipagem extrairTipoPorSlot(Map<String, Object> pokemonData, int slot) {
        List<Map<String, Object>> types = (List<Map<String, Object>>) pokemonData.get("types");
        if (types == null || types.isEmpty()) return slot == 1 ? Tipagem.NORMAL : null;
        for (Map<String, Object> entry : types) {
            Number s = (Number) entry.get("slot");
            if (s != null && s.intValue() == slot) {
                return nomeParaTipagem(entry);
            }
        }
        types.sort(Comparator.comparingInt(e -> ((Number) e.getOrDefault("slot", 99)).intValue()));
        if (slot == 1) return nomeParaTipagem(types.get(0));
        return types.size() > 1 ? nomeParaTipagem(types.get(1)) : null;
    }

    @SuppressWarnings("unchecked")
    private int extrairStat(Map<String, Object> pokemonData, String statName) {
        List<Map<String, Object>> stats = (List<Map<String, Object>>) pokemonData.get("stats");
        if (stats == null) return 1;
        for (Map<String, Object> entry : stats) {
            Object statObj = entry.get("stat");
            if (statObj instanceof Map<?, ?> statMap) {
                Object name = statMap.get("name");
                if (statName.equals(name)) {
                    Number base = (Number) entry.get("base_stat");
                    return base != null ? Math.max(1, base.intValue()) : 1;
                }
            }
        }
        return 1;
    }

    @SuppressWarnings("unchecked")
    private void sincronizarAbilitiesDaSpecies(PokemonSpecies species, Map<String, Object> pokemonData) {
        speciesHabilidadeRepository.deleteBySpeciesId(species.getId());
        List<Map<String, Object>> abilities = (List<Map<String, Object>>) pokemonData.get("abilities");
        if (abilities == null || abilities.isEmpty()) {
            return;
        }
        // BD: PK (species_id, habilidade_id), UNIQUE(species_id, slot), CHECK(slot BETWEEN 1 AND 3).
        List<PokemonSpeciesHabilidade> candidatos = new ArrayList<>();
        Set<String> habilidadeIdsVistos = new HashSet<>();
        for (Map<String, Object> entry : abilities) {
            Number slotNumber = (Number) entry.get("slot");
            int slot = slotNumber != null ? slotNumber.intValue() : 1;
            slot = Math.max(1, Math.min(3, slot));
            boolean hidden = Boolean.TRUE.equals(entry.get("is_hidden"));
            String abilityName = extrairNomeReferencia(entry.get("ability"));
            if (abilityName == null || abilityName.isBlank()) {
                continue;
            }
            Habilidade habilidade = encontrarHabilidadePorNome(abilityName);
            if (habilidade == null) {
                continue;
            }
            if (!habilidadeIdsVistos.add(habilidade.getId())) {
                continue;
            }
            PokemonSpeciesHabilidade relation = new PokemonSpeciesHabilidade();
            relation.setSpecies(species);
            relation.setHabilidade(habilidade);
            relation.setSlot(slot);
            relation.setHidden(hidden);
            candidatos.add(relation);
        }
        Map<Integer, PokemonSpeciesHabilidade> porSlot = new LinkedHashMap<>();
        for (PokemonSpeciesHabilidade rel : candidatos) {
            porSlot.putIfAbsent(rel.getSlot(), rel);
        }
        if (!porSlot.isEmpty()) {
            List<PokemonSpeciesHabilidade> entities = porSlot.entrySet().stream()
                    .sorted(Map.Entry.comparingByKey())
                    .map(Map.Entry::getValue)
                    .toList();
            speciesHabilidadeRepository.saveAll(entities);
        }
    }

    @SuppressWarnings("unchecked")
    private void sincronizarLearnsetDaSpecies(PokemonSpecies species, Map<String, Object> pokemonData) {
        speciesMovimentoRepository.deleteBySpeciesId(species.getId());
        List<Map<String, Object>> moves = (List<Map<String, Object>>) pokemonData.get("moves");
        if (moves == null || moves.isEmpty()) {
            return;
        }
        List<PokemonSpeciesMovimento> entities = new ArrayList<>();
        Set<String> chavesDedup = new HashSet<>();
        for (int moveIndex = 0; moveIndex < moves.size(); moveIndex++) {
            Map<String, Object> moveEntry = moves.get(moveIndex);
            String moveName = extrairNomeReferencia(moveEntry.get("move"));
            if (moveName == null || moveName.isBlank()) {
                continue;
            }
            Movimento movimento = encontrarMovimentoPorNome(moveName);
            if (movimento == null) {
                continue;
            }
            List<Map<String, Object>> details = (List<Map<String, Object>>) moveEntry.get("version_group_details");
            if (details == null || details.isEmpty()) {
                continue;
            }

            Integer menorNivelLevelUp = null;
            for (Map<String, Object> detail : details) {
                String methodName = extrairNomeReferencia(detail.get("move_learn_method"));
                if (MoveLearnMethod.fromPokeApi(methodName) != MoveLearnMethod.LEVEL_UP) {
                    continue;
                }
                Number levelRaw = (Number) detail.get("level_learned_at");
                if (levelRaw == null || levelRaw.intValue() <= 0) {
                    continue;
                }
                int lv = levelRaw.intValue();
                if (menorNivelLevelUp == null || lv < menorNivelLevelUp) {
                    menorNivelLevelUp = lv;
                }
            }

            PokemonSpeciesMovimento relation = new PokemonSpeciesMovimento();
            relation.setSpecies(species);
            relation.setMovimento(movimento);
            relation.setOrdem(moveIndex);

            if (menorNivelLevelUp != null) {
                relation.setLearnMethod(MoveLearnMethod.LEVEL_UP);
                relation.setLevel(menorNivelLevelUp);
            } else {
                Map<String, Object> latestDetail = selecionarDetalheMaisRecente(details);
                if (latestDetail == null) {
                    continue;
                }
                String methodName = extrairNomeReferencia(latestDetail.get("move_learn_method"));
                MoveLearnMethod learnMethod = MoveLearnMethod.fromPokeApi(methodName);
                Number levelRaw = (Number) latestDetail.get("level_learned_at");
                Integer level = levelRaw != null && levelRaw.intValue() > 0 ? levelRaw.intValue() : null;
                relation.setLearnMethod(learnMethod);
                relation.setLevel(level);
            }
            String dedupeKey = movimento.getId()
                    + "|" + relation.getLearnMethod()
                    + "|" + (relation.getLevel() == null ? "n" : relation.getLevel());
            if (!chavesDedup.add(dedupeKey)) {
                continue;
            }
            entities.add(relation);
        }
        if (!entities.isEmpty()) {
            entities.sort(PokemonLearnsetService.COMPARATOR_LEARNSET);
            for (int i = 0; i < entities.size(); i++) {
                entities.get(i).setOrdem(i);
            }
            speciesMovimentoRepository.saveAll(entities);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> selecionarDetalheMaisRecente(List<Map<String, Object>> details) {
        if (details == null || details.isEmpty()) {
            return null;
        }
        Map<String, Object> best = null;
        int bestOrder = Integer.MIN_VALUE;
        for (Map<String, Object> detail : details) {
            String versionGroup = extrairNomeReferencia(detail.get("version_group"));
            int currentOrder = obterOrdemVersionGroup(versionGroup);
            if (currentOrder > bestOrder) {
                bestOrder = currentOrder;
                best = detail;
            }
        }
        return best;
    }

    @SuppressWarnings("unchecked")
    private int obterOrdemVersionGroup(String versionGroup) {
        if (versionGroup == null || versionGroup.isBlank()) {
            return Integer.MIN_VALUE;
        }
        return versionGroupOrderCache.computeIfAbsent(versionGroup, key -> {
            try {
                Map<String, Object> vg = restTemplate.getForObject(BASE_URL + "/version-group/" + key, Map.class);
                if (vg == null) {
                    return Integer.MIN_VALUE;
                }
                Number order = (Number) vg.get("order");
                return order != null ? order.intValue() : Integer.MIN_VALUE;
            } catch (Exception e) {
                return Integer.MIN_VALUE;
            }
        });
    }

    @SuppressWarnings("unchecked")
    private String extrairFormsJson(Map<String, Object> pokemonData) {
        List<Map<String, Object>> forms = (List<Map<String, Object>>) pokemonData.get("forms");
        if (forms == null || forms.isEmpty()) {
            return null;
        }
        List<String> nomes = forms.stream()
                .map(f -> extrairNomeReferencia(f))
                .filter(n -> n != null && !n.isBlank())
                .toList();
        if (nomes.isEmpty()) {
            return null;
        }
        return nomes.stream().map(n -> "\"" + n + "\"").collect(Collectors.joining(",", "[", "]"));
    }

    private Movimento encontrarMovimentoPorNome(String moveName) {
        return movimentoRepository.findByNomeEnIgnoreCase(moveName)
                .or(() -> movimentoRepository.findByNomeIgnoreCase(capitalizarNomeMove(moveName)))
                .orElseGet(() -> importarMovimentoPorNomePokeApi(moveName));
    }

    private Habilidade encontrarHabilidadePorNome(String abilityName) {
        return habilidadeRepository.findByNomeEnIgnoreCase(abilityName)
                .or(() -> habilidadeRepository.findByNomeIgnoreCase(capitalizarNomeMove(abilityName)))
                .orElseGet(() -> importarHabilidadePorNomePokeApi(abilityName));
    }

    @SuppressWarnings("unchecked")
    private Movimento importarMovimentoPorNomePokeApi(String moveName) {
        if (moveName == null || moveName.isBlank()) {
            return null;
        }
        try {
            Map<String, Object> detail = restTemplate.getForObject(BASE_URL + "/move/" + moveName.trim(), Map.class);
            if (detail == null) {
                return null;
            }
            Number idRaw = (Number) detail.get("id");
            Integer pokeapiId = idRaw != null ? idRaw.intValue() : null;
            if (pokeapiId != null) {
                Movimento existente = movimentoRepository.findByPokeapiId(pokeapiId).orElse(null);
                if (existente != null) {
                    return existente;
                }
            }
            String nomePt = extrairNomeMovePt(detail);
            String nomeEn = extrairNomeMoveEn(detail);
            String nomeFinal = nomePt != null && !nomePt.isBlank()
                    ? nomePt
                    : (nomeEn != null ? capitalizarNomeMove(nomeEn) : capitalizarNomeMove(moveName));
            Movimento movimento = new Movimento();
            movimento.setPokeapiId(pokeapiId);
            movimento.setNome(nomeFinal);
            movimento.setNomeEn(nomeEn != null && !nomeEn.isBlank() ? capitalizarNomeMove(nomeEn) : null);
            movimento.setTipo(extrairTipoMove(detail));
            movimento.setCategoria(extrairCategoriaMove(detail));
            movimento.setCustoStamina(0);
            String descricao = extrairDescricaoMovePt(detail);
            if (descricao == null || descricao.isBlank()) {
                descricao = extrairDescricaoMoveEn(detail);
            }
            movimento.setDescricaoEfeito(descricao);
            return movimentoRepository.save(movimento);
        } catch (Exception ignored) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private Habilidade importarHabilidadePorNomePokeApi(String abilityName) {
        if (abilityName == null || abilityName.isBlank()) {
            return null;
        }
        try {
            Map<String, Object> detail = restTemplate.getForObject(BASE_URL + "/ability/" + abilityName.trim(), Map.class);
            if (detail == null) {
                return null;
            }
            Number idRaw = (Number) detail.get("id");
            Integer pokeapiId = idRaw != null ? idRaw.intValue() : null;
            if (pokeapiId != null) {
                Habilidade existente = habilidadeRepository.findByPokeapiId(pokeapiId).orElse(null);
                if (existente != null) {
                    return existente;
                }
            }
            String nomePt = extrairNomeHabilidadePt(detail);
            String nomeEn = extrairNomeHabilidadeEn(detail);
            String nomeFinal = nomePt != null && !nomePt.isBlank()
                    ? nomePt
                    : (nomeEn != null ? capitalizarNomeMove(nomeEn) : capitalizarNomeMove(abilityName));
            Habilidade habilidade = new Habilidade();
            habilidade.setPokeapiId(pokeapiId);
            habilidade.setNome(nomeFinal);
            habilidade.setNomeEn(nomeEn != null && !nomeEn.isBlank() ? capitalizarNomeMove(nomeEn) : null);
            String descricao = extrairDescricaoHabilidadePt(detail);
            if (descricao == null || descricao.isBlank()) {
                descricao = extrairDescricaoHabilidadeEn(detail);
            }
            habilidade.setDescricao(descricao);
            return habilidadeRepository.save(habilidade);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String extrairNomeReferencia(Object refObj) {
        if (refObj instanceof Map<?, ?> refMap) {
            Object name = refMap.get("name");
            if (name instanceof String s && !s.isBlank()) return s;
        }
        return null;
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
