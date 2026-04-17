package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.*;
import com.pokemonamethyst.exception.RecursoNaoEncontradoException;
import com.pokemonamethyst.exception.RegraNegocioException;
import com.pokemonamethyst.repository.HabilidadeRepository;
import com.pokemonamethyst.repository.ItemRepository;
import com.pokemonamethyst.repository.MovimentoRepository;
import com.pokemonamethyst.repository.PersonalidadeRepository;
import com.pokemonamethyst.repository.PokemonRepository;
import com.pokemonamethyst.repository.PerfilJogadorRepository;
import com.pokemonamethyst.repository.PokemonSpeciesRepository;
import com.pokemonamethyst.web.dto.PokemonBatalhaAplicarDanoRequestDto;
import com.pokemonamethyst.web.dto.PokemonBatalhaCalculoRequestDto;
import com.pokemonamethyst.web.dto.PokemonBatalhaCalculoResponseDto;
import com.pokemonamethyst.web.dto.PokemonCapturaResponseDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;
import com.pokemonamethyst.web.dto.PokemonEvolucaoOpcaoDto;

@Service
public class PokemonService {

    private static final int MAX_POKEMONS_NO_TIME = 6;
    private static final int MAX_MOVIMENTOS_POR_POKEMON = 8;
    private static final int NIVEL_INICIAL = 1;
    private static final int POKEDEX_MIN = 1;
    private static final int POKEDEX_MAX = 1025;

    private final PokemonRepository pokemonRepository;
    private final PerfilJogadorRepository perfilRepository;
    private final ItemRepository itemRepository;
    private final MovimentoRepository movimentoRepository;
    private final HabilidadeRepository habilidadeRepository;
    private final PersonalidadeRepository personalidadeRepository;
    private final PokeApiService pokeApiService;
    private final PokemonAbilityService pokemonAbilityService;
    private final PokemonLearnsetService pokemonLearnsetService;
    private final PokemonGenerationService pokemonGenerationService;
    private final PokemonStatService pokemonStatService;
    private final PokemonEvolutionService pokemonEvolutionService;
    private final PokemonSpeciesRepository pokemonSpeciesRepository;
    private final int shinyChancePercent;
    private final boolean strictLocalRuntime;

    public PokemonService(PokemonRepository pokemonRepository, PerfilJogadorRepository perfilRepository,
                          ItemRepository itemRepository, MovimentoRepository movimentoRepository,
                          HabilidadeRepository habilidadeRepository,
                          PersonalidadeRepository personalidadeRepository, PokeApiService pokeApiService,
                          PokemonAbilityService pokemonAbilityService,
                          PokemonLearnsetService pokemonLearnsetService,
                          PokemonGenerationService pokemonGenerationService,
                          PokemonStatService pokemonStatService,
                          PokemonEvolutionService pokemonEvolutionService,
                          PokemonSpeciesRepository pokemonSpeciesRepository,
                          @Value("${pokemon.shiny-chance-percent:1}") int shinyChancePercent,
                          @Value("${pokemon.runtime.strict-local:true}") boolean strictLocalRuntime) {
        this.pokemonRepository = pokemonRepository;
        this.perfilRepository = perfilRepository;
        this.itemRepository = itemRepository;
        this.movimentoRepository = movimentoRepository;
        this.habilidadeRepository = habilidadeRepository;
        this.personalidadeRepository = personalidadeRepository;
        this.pokeApiService = pokeApiService;
        this.pokemonAbilityService = pokemonAbilityService;
        this.pokemonLearnsetService = pokemonLearnsetService;
        this.pokemonGenerationService = pokemonGenerationService;
        this.pokemonStatService = pokemonStatService;
        this.pokemonEvolutionService = pokemonEvolutionService;
        this.pokemonSpeciesRepository = pokemonSpeciesRepository;
        this.shinyChancePercent = Math.max(0, Math.min(100, shinyChancePercent));
        this.strictLocalRuntime = strictLocalRuntime;
    }

    public List<Pokemon> listarPorPerfil(String perfilId) {
        return pokemonRepository.findByPerfilIdComRelacionamentos(perfilId);
    }

    public List<Pokemon> listarTimePrincipal(String perfilId) {
        return pokemonRepository.findTimePrincipalByPerfilIdAndOrigem(perfilId, OrigemPokemon.TREINADOR);
    }

    public List<Pokemon> listarBox(String perfilId) {
        return pokemonRepository.findBoxByPerfilIdAndOrigem(perfilId, OrigemPokemon.TREINADOR);
    }

    public List<Pokemon> listarSelvagens(String perfilId) {
        return pokemonRepository.findByPerfilIdAndOrigemComRelacionamentos(perfilId, OrigemPokemon.SELVAGEM);
    }

    public Pokemon buscarPorIdEPerfil(String id, String perfilId) {
        return pokemonRepository.findByIdAndPerfilId(id, perfilId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pokémon não encontrado."));
    }

    @Transactional
    public Pokemon gerarSelvagem(String perfilId, Integer pokedexId, String idOuNome, Integer nivel) {
        int nivelFinal = Math.max(1, Math.min(100, nivel == null ? 5 : nivel));
        int pokedexEscolhido;
        if (pokedexId != null && pokedexId > 0) {
            pokedexEscolhido = pokedexId;
        } else if (idOuNome != null && !idOuNome.isBlank()) {
            pokedexEscolhido = resolverPokedexIdPorIdOuNome(idOuNome);
        } else {
            pokedexEscolhido = ThreadLocalRandom.current().nextInt(POKEDEX_MIN, POKEDEX_MAX + 1);
        }
        Pokemon pokemon = criar(
                perfilId,
                pokedexEscolhido,
                null,
                null,
                Pokebola.POKEBALL,
                100,
                null,
                null,
                nivelFinal
        );
        pokemon.setOrigem(OrigemPokemon.SELVAGEM);
        pokemon.setEstado(EstadoPokemon.ATIVO);
        pokemon.setOrdemTime(null);
        pokemon.setMovimentosConhecidos(
                new ArrayList<>(pokemonLearnsetService.escolherMovimentosAoCriarPokemon(pokemon.getSpecies(), nivelFinal))
        );
        pokemonStatService.sincronizarMaximos(pokemon);
        return pokemonRepository.save(pokemon);
    }

    @Transactional
    public Pokemon criar(String perfilId, Integer pokedexId, String apelido, Genero genero, Pokebola pokebolaCaptura,
                         int staminaMaxima, List<String> movimentoIds,
                         String personalidadeId, Integer nivelInicial) {
        if (pokedexId == null || pokedexId <= 0) {
            throw new RegraNegocioException("Para criar um Pokémon, informe um pokedexId válido da PokéAPI.");
        }

        PerfilJogador perfil = perfilRepository.findById(perfilId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Perfil não encontrado."));

        int pokedexIdVal = pokedexId;
        Pokemon pokemon = new Pokemon();
        pokemon.setPerfil(perfil);
        pokemon.setOrdemTime(null);
        pokemon.setSpecies(obterSpeciesRuntime(pokedexIdVal));
        // Importação de espécie usa deleteBySpeciesId (clearAutomatically=true) e limpa o contexto JPA;
        // o perfil carregado acima fica detached e a coleção lazy pokemons quebra (LazyInitializationException).
        perfil = perfilRepository.findById(perfilId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Perfil não encontrado."));
        pokemon.setPerfil(perfil);
        pokemon.setGenero(genero != null ? genero : definirGeneroAleatorio(pokemon.getSpecies()));
        pokemon.setShiny(sortearShiny());
        if (pokemon.isShiny() && !strictLocalRuntime) {
            try {
                PokemonSpecies sp = pokeApiService.garantirSpriteShinyNaEspecie(pokemon.getSpecies());
                if (sp != null) {
                    pokemon.setSpecies(sp);
                }
            } catch (RegraNegocioException | RecursoNaoEncontradoException e) {
                // Sprite shiny extra é opcional; não bloqueia a criação (rede / limite PokéAPI).
            }
        }
        pokemon.setHabilidadeAtiva(pokemonAbilityService.sortearHabilidadeAtiva(pokemon.getSpecies()));
        pokemon.setPokebolaCaptura(pokebolaCaptura != null ? pokebolaCaptura : Pokebola.POKEBALL);
        pokemon.setApelido(apelido);
        pokemon.setStaminaMaxima(staminaMaxima);
        int nivelBase = Math.max(1, Math.min(100, nivelInicial == null ? NIVEL_INICIAL : nivelInicial));
        pokemon.setNivel(nivelBase);
        GrowthRate curva = GrowthRate.fromSpecies(pokemon.getSpecies());
        pokemon.setXpAtual(PokemonExperience.getTotalXpForLevel(nivelBase, curva));
        pokemon.setOrigem(OrigemPokemon.TREINADOR);
        pokemon.setEstado(EstadoPokemon.ATIVO);
        pokemonGenerationService.inicializarPokemonNovo(pokemon);
        if (nivelBase > NIVEL_INICIAL) {
            pokemonStatService.concederPontosPorNivel(pokemon, NIVEL_INICIAL, nivelBase);
        }
        if (personalidadeId != null && !personalidadeId.isBlank()) {
            personalidadeRepository.findById(personalidadeId).ifPresent(pokemon::setPersonalidade);
        }

        if (movimentoIds != null && !movimentoIds.isEmpty()) {
            List<String> movimentoIdsUnicos = deduplicarIdsPreservandoOrdem(movimentoIds);
            if (movimentoIdsUnicos.size() > MAX_MOVIMENTOS_POR_POKEMON) {
                throw new RegraNegocioException("Máximo de " + MAX_MOVIMENTOS_POR_POKEMON + " ataques por Pokémon.");
            }
            pokemonLearnsetService.validarMovimentosPermitidos(
                    pokemon.getSpecies(),
                    pokemon.getNivel(),
                    movimentoIdsUnicos,
                    Set.of(MoveLearnMethod.LEVEL_UP)
            );
            List<Movimento> movimentos = semMovimentosDuplicados(buscarMovimentosPorIds(movimentoIdsUnicos));
            pokemon.setMovimentosConhecidos(movimentos);
        } else {
            pokemon.setMovimentosConhecidos(
                    new ArrayList<>(pokemonLearnsetService.escolherMovimentosAoCriarPokemon(
                            pokemon.getSpecies(), nivelBase))
            );
        }

        pokemonStatService.sincronizarMaximos(pokemon);

        Pokemon salvo = pokemonRepository.save(pokemon);
        perfil.getPokemons().add(salvo);
        perfilRepository.save(perfil);
        return salvo;
    }

    @Transactional
    public com.pokemonamethyst.web.dto.PokemonAtualizarComAprendizagemResponseDto atualizar(String pokemonId, String perfilId, Integer pokedexId, String apelido, String notas,
                            Genero genero, Boolean isShiny, String personalidadeId,
                            Especializacao especializacao, String berryFavorita, Integer nivelDeVinculo,
                            Integer nivel, Integer xpAtual, Pokebola pokebolaCaptura, String itemSeguradoId,
                            Integer tecnica, Integer respeito, List<CondicaoStatus> statusAtuais,
                            List<String> movimentoIds, String habilidadeId, boolean permitirMetodosExtrasNoLearnset) {
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
        int nivelAtual = pokemon.getNivel();
        if (xpAtual != null && xpAtual < 0) {
            throw new RegraNegocioException("xpAtual não pode ser negativo.");
        }
        if (pokedexId != null && pokedexId <= 0) {
            throw new RegraNegocioException("pokedexId inválido. Use um valor maior que zero.");
        }
        if (pokedexId != null) {
            PokemonSpecies especieAtual = pokemon.getSpecies();
            int pokedexAtual = especieAtual != null ? especieAtual.getPokedexId() : -1;
            if (pokedexId != pokedexAtual) {
                pokemon.setSpecies(obterSpeciesRuntime(pokedexId));
                pokemon.setGenero(definirGeneroAleatorio(pokemon.getSpecies()));
                Habilidade novaHab = pokemonAbilityService.sortearHabilidadeAtivaOuNulo(pokemon.getSpecies());
                if (novaHab == null) {
                    novaHab = pokemonAbilityService.sortearHabilidadeAtiva(pokemon.getSpecies());
                }
                pokemon.setHabilidadeAtiva(novaHab);
            }
        }
        if (apelido != null) pokemon.setApelido(apelido);
        if (notas != null) pokemon.setNotas(notas);
        if (genero != null) pokemon.setGenero(genero);
        if (isShiny != null) {
            pokemon.setShiny(isShiny);
            if (Boolean.TRUE.equals(isShiny) && !strictLocalRuntime) {
                try {
                    PokemonSpecies sp = pokeApiService.garantirSpriteShinyNaEspecie(pokemon.getSpecies());
                    if (sp != null) {
                        pokemon.setSpecies(sp);
                    }
                } catch (RegraNegocioException | RecursoNaoEncontradoException e) {
                    // Idem criação: não falha a atualização se a PokéAPI não responder.
                }
            }
        }
        if (personalidadeId != null) {
            if (personalidadeId.isBlank()) {
                pokemon.setPersonalidade(null);
            } else {
                Personalidade personalidade = personalidadeRepository.findById(personalidadeId).orElse(null);
                pokemon.setPersonalidade(personalidade);
            }
        }
        if (especializacao != null) pokemon.setEspecializacao(especializacao);
        if (berryFavorita != null) pokemon.setBerryFavorita(berryFavorita);
        if (nivelDeVinculo != null) pokemon.setNivelDeVinculo(nivelDeVinculo);
        if (pokebolaCaptura != null) pokemon.setPokebolaCaptura(pokebolaCaptura);
        if (itemSeguradoId != null) {
            if (itemSeguradoId.isBlank()) {
                pokemon.setItemSegurado(null);
            } else {
                Item item = itemRepository.findById(itemSeguradoId).orElse(null);
                pokemon.setItemSegurado(item);
            }
        }
        if (tecnica != null) pokemon.setTecnica(tecnica);
        if (respeito != null) pokemon.setRespeito(respeito);
        if (statusAtuais != null) pokemon.setStatusAtuais(statusAtuais);
        if (habilidadeId != null) {
            if (habilidadeId.isBlank()) {
                pokemon.setHabilidadeAtiva(pokemonAbilityService.sortearHabilidadeAtivaOuNulo(pokemon.getSpecies()));
            } else {
                Habilidade habilidade = habilidadeRepository.findById(habilidadeId)
                        .orElseThrow(() -> new RecursoNaoEncontradoException("Habilidade não encontrada: " + habilidadeId));
                validarHabilidadeDaSpecies(pokemon.getSpecies(), habilidade.getId());
                pokemon.setHabilidadeAtiva(habilidade);
            }
        }

        GrowthRate curva = GrowthRate.fromSpecies(pokemon.getSpecies());
        int x = pokemon.getXpAtual();
        if (xpAtual != null) {
            x = PokemonExperience.clampXpTotal(xpAtual, curva);
        } else if (nivel != null && nivel != nivelAtual) {
            int n = Math.max(PokemonExperience.MIN_LEVEL, Math.min(PokemonExperience.MAX_LEVEL, nivel));
            x = PokemonExperience.getTotalXpForLevel(n, curva);
        }
        x = PokemonExperience.clampXpTotal(x, curva);
        pokemon.setXpAtual(x);
        pokemon.setNivel(PokemonExperience.calculateLevelFromXp(x, curva));
        int nivelRecalculado = pokemon.getNivel();
        if (nivelRecalculado > nivelAtual) {
            pokemonStatService.concederPontosPorNivel(pokemon, nivelAtual, nivelRecalculado);
        }

        if (movimentoIds != null) {
            List<String> movimentoIdsUnicos = deduplicarIdsPreservandoOrdem(movimentoIds);
            if (movimentoIdsUnicos.size() > MAX_MOVIMENTOS_POR_POKEMON) {
            throw new RegraNegocioException("Máximo de " + MAX_MOVIMENTOS_POR_POKEMON + " ataques por Pokémon.");
            }
            Set<MoveLearnMethod> metodosPermitidos = permitirMetodosExtrasNoLearnset
                ? Set.of(MoveLearnMethod.LEVEL_UP, MoveLearnMethod.EGG, MoveLearnMethod.MACHINE, MoveLearnMethod.TUTOR)
                : Set.of(MoveLearnMethod.LEVEL_UP);
            pokemonLearnsetService.validarMovimentosPermitidos(
                pokemon.getSpecies(),
                pokemon.getNivel(),
                movimentoIdsUnicos,
                metodosPermitidos
            );
            List<Movimento> movimentos = semMovimentosDuplicados(buscarMovimentosPorIds(movimentoIdsUnicos));
            pokemon.getMovimentosConhecidos().clear();
            pokemon.getMovimentosConhecidos().addAll(movimentos);
        }

        int hpMaximoAtualizado = calcularHpMaximo(pokemon);
        int hpAtual = pokemon.getHpAtual() == null ? hpMaximoAtualizado : pokemon.getHpAtual();
        pokemon.setHpAtual(Math.max(0, Math.min(hpAtual, hpMaximoAtualizado)));

        int nivelDepois = pokemon.getNivel();
        List<Movimento> movimentosAprendendo = List.of();
        if (nivelDepois > nivelAtual) {
            movimentosAprendendo = calcularMovimentosAprendidosEntreNiveis(pokemon, nivelAtual, nivelDepois);
        }

        Pokemon salvo = pokemonRepository.save(pokemon);
        return com.pokemonamethyst.web.dto.PokemonAtualizarComAprendizagemResponseDto
                .from(salvo, nivelAtual, nivelDepois, movimentosAprendendo);
    }

    @Transactional
    public com.pokemonamethyst.web.dto.PokemonGanharXpResponseDto ganharXp(String pokemonId, String perfilId, int xpGanho) {
        if (xpGanho <= 0) {
            throw new RegraNegocioException("xpGanho deve ser maior que zero.");
        }
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);

        int nivelAntes = pokemon.getNivel();
        int xpAntes = pokemon.getXpAtual();
        GrowthRate curva = GrowthRate.fromSpecies(pokemon.getSpecies());
        long soma = (long) xpAntes + xpGanho;
        int xpDepois = (int) Math.min(PokemonExperience.getTotalXpForLevel(PokemonExperience.MAX_LEVEL, curva), Math.max(0, soma));
        int nivelDepois = PokemonExperience.calculateLevelFromXp(xpDepois, curva);

        pokemon.setXpAtual(xpDepois);
        pokemon.setNivel(nivelDepois);
        if (nivelDepois > nivelAntes) {
            pokemonStatService.concederPontosPorNivel(pokemon, nivelAntes, nivelDepois);
        }
        int hpMaximoAtualizado = calcularHpMaximo(pokemon);
        int hpAtual = pokemon.getHpAtual() == null ? hpMaximoAtualizado : pokemon.getHpAtual();
        pokemon.setHpAtual(Math.max(0, Math.min(hpAtual, hpMaximoAtualizado)));

        List<Movimento> movimentosAprendendo = new ArrayList<>();
        if (nivelDepois > nivelAntes) {
            movimentosAprendendo = calcularMovimentosAprendidosEntreNiveis(pokemon, nivelAntes, nivelDepois);
        }

        Pokemon salvo = pokemonRepository.save(pokemon);

        List<com.pokemonamethyst.web.dto.MovimentoResponseDto> ofertas =
                movimentosAprendendo.stream()
                        .map(com.pokemonamethyst.web.dto.MovimentoResponseDto::from)
                        .collect(Collectors.toList());

        return com.pokemonamethyst.web.dto.PokemonGanharXpResponseDto.from(salvo, nivelAntes, nivelDepois, ofertas);
    }

    @Transactional(readOnly = true)
    public com.pokemonamethyst.web.dto.PokemonXpPreviewResponseDto preverGanhoXp(String pokemonId, String perfilId, int xpGanho, Integer xpBaseAtual) {
        if (xpGanho <= 0) {
            throw new RegraNegocioException("xpGanho deve ser maior que zero.");
        }
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
        if (pokemon.getSpecies() == null || pokemon.getSpecies().getId() == null || pokemon.getSpecies().getId().isBlank()) {
            throw new RegraNegocioException("Não foi possível prever XP: espécie do Pokémon está incompleta.");
        }
        GrowthRate curva = GrowthRate.fromSpecies(pokemon.getSpecies());
        if (curva == null) {
            throw new RegraNegocioException("Não foi possível prever XP: curva de crescimento não disponível para a espécie.");
        }

        int xpAntes = xpBaseAtual != null
                ? PokemonExperience.clampXpTotal(xpBaseAtual, curva)
                : pokemon.getXpAtual();
        int nivelAntes = PokemonExperience.calculateLevelFromXp(xpAntes, curva);

        long soma = (long) xpAntes + xpGanho;
        int xpDepois = (int) Math.min(PokemonExperience.getTotalXpForLevel(PokemonExperience.MAX_LEVEL, curva), Math.max(0, soma));
        int nivelDepois = PokemonExperience.calculateLevelFromXp(xpDepois, curva);
        int pontosGanhos = 0;
        if (nivelDepois > nivelAntes) {
            PokemonIVClass classe = pokemon.getIvClass() != null ? pokemon.getIvClass() : PokemonIVClass.fromBst(0);
            pontosGanhos = (nivelDepois - nivelAntes) * classe.getPontosPorNivel();
        }
        int pontosDistribuicaoDepois = Math.max(0, pokemon.getPontosDistribuicaoDisponiveis() + pontosGanhos);

        List<Movimento> movimentosAprendendo = List.of();
        if (nivelDepois > nivelAntes) {
            try {
                movimentosAprendendo = calcularMovimentosAprendidosEntreNiveis(pokemon, nivelAntes, nivelDepois);
            } catch (RuntimeException ex) {
                throw new RegraNegocioException("Não foi possível prever os ataques aprendidos para este Pokémon.");
            }
        }

        return com.pokemonamethyst.web.dto.PokemonXpPreviewResponseDto.from(
                xpAntes,
                xpDepois,
                nivelAntes,
                nivelDepois,
                pontosGanhos,
                pontosDistribuicaoDepois,
                movimentosAprendendo
        );
    }

    @Transactional(readOnly = true)
    public PokemonBatalhaCalculoResponseDto calcularDano(String perfilId, PokemonBatalhaCalculoRequestDto dto) {
        Pokemon atacante = buscarPorIdEPerfil(dto.getAtacanteId(), perfilId);
        Pokemon defensor = buscarPorIdEPerfil(dto.getDefensorId(), perfilId);

        CategoriaMovimento categoria = dto.getCategoria() != null ? dto.getCategoria() : CategoriaMovimento.FISICO;
        boolean categoriaFisica = categoria == CategoriaMovimento.FISICO;
        int ataque = categoriaFisica ? calcularAtaque(atacante) : calcularAtaqueEspecial(atacante);
        int defesa = categoriaFisica ? calcularDefesa(defensor) : calcularDefesaEspecial(defensor);

        PokemonDamageCalculator.DamageInput input = new PokemonDamageCalculator.DamageInput(
                atacante.getNivel(),
                dto.getPoder(),
                ataque,
                defesa,
                categoriaFisica,
                dto.isCritico(),
                dto.isQueimado(),
                dto.getStabMultiplier(),
                dto.getTypeMultiplier(),
                dto.getOtherMultiplier(),
                dto.getRandomMin(),
                dto.getRandomMax(),
                dto.getRandomValue()
        );
        PokemonDamageCalculator.DamageResult result = PokemonDamageCalculator.calcular(input);

        PokemonBatalhaCalculoResponseDto response = new PokemonBatalhaCalculoResponseDto();
        response.setAtacanteId(atacante.getId());
        response.setDefensorId(defensor.getId());
        response.setHpAtualDefensor(hpAtualNormalizado(defensor));
        response.setHpMaximoDefensor(calcularHpMaximo(defensor));
        response.setDanoMinimo(result.danoMinimo());
        response.setDanoMaximo(result.danoMaximo());
        response.setDanoAplicado(result.danoAplicado());
        response.setFormula(result.formula());
        response.setMultiplicadores(result.multiplicadores());
        return response;
    }

    @Transactional
    public Pokemon aplicarDano(String perfilId, PokemonBatalhaAplicarDanoRequestDto dto) {
        Pokemon atacante = buscarPorIdEPerfil(dto.getAtacanteId(), perfilId);
        Pokemon defensor = buscarPorIdEPerfil(dto.getDefensorId(), perfilId);

        int hpAtual = hpAtualNormalizado(defensor);
        int novoHp = Math.max(0, hpAtual - Math.max(0, dto.getDanoAplicado()));
        defensor.setHpAtual(novoHp);
        atacante.setEstado(EstadoPokemon.EM_BATALHA);

        if (novoHp == 0) {
            defensor.setEstado(EstadoPokemon.DERROTADO);
        } else {
            defensor.setEstado(EstadoPokemon.EM_BATALHA);
        }

        pokemonRepository.save(atacante);
        return pokemonRepository.save(defensor);
    }

    @Transactional
    public PokemonCapturaResponseDto tentarCaptura(String perfilId, String pokemonId, boolean sucesso) {
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
        if (sucesso) {
            pokemon.setOrigem(OrigemPokemon.TREINADOR);
            pokemon.setEstado(EstadoPokemon.ATIVO);
            pokemon.setOrdemTime(null);
        } else {
            pokemon.setEstado(EstadoPokemon.CAPTURAVEL);
        }
        Pokemon salvo = pokemonRepository.save(pokemon);
        return new PokemonCapturaResponseDto(sucesso, com.pokemonamethyst.web.dto.PokemonResponseDto.from(salvo));
    }

    @Transactional
    public Pokemon atualizarEstado(String perfilId, String pokemonId, EstadoPokemon estado) {
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
        pokemon.setEstado(estado);
        return pokemonRepository.save(pokemon);
    }

    private List<Movimento> calcularMovimentosAprendidosEntreNiveis(Pokemon pokemon, int nivelAnterior, int nivelNovo) {
        if (pokemon == null || pokemon.getSpecies() == null) return List.of();
        if (nivelNovo <= nivelAnterior) return List.of();

        Set<String> conhecidos = pokemon.getMovimentosConhecidos() == null
                ? Set.of()
                : pokemon.getMovimentosConhecidos().stream().map(Movimento::getId).collect(Collectors.toSet());

        PokemonSpecies species = pokemon.getSpecies();
        if (species.getId() == null || species.getId().isBlank()) return List.of();
        // Ordem canônica do learnset (nível, ordem na PokéAPI, id) — mesmo critério da importação e da criação.
        List<PokemonSpeciesMovimento> entries = pokemonLearnsetService.listarLearnsetOrdenado(species.getId());

        List<Movimento> resultado = new ArrayList<>();
        Set<String> jaIncluidosNestaFaixa = new LinkedHashSet<>();

        for (PokemonSpeciesMovimento e : entries) {
            if (e.getLearnMethod() != MoveLearnMethod.LEVEL_UP) continue;
            Integer level = e.getLevel();
            if (level == null) continue;
            if (level <= nivelAnterior || level > nivelNovo) continue;

            Movimento mov = e.getMovimento();
            if (mov == null || mov.getId() == null) continue;
            if (conhecidos.contains(mov.getId())) continue;
            if (jaIncluidosNestaFaixa.contains(mov.getId())) continue;

            jaIncluidosNestaFaixa.add(mov.getId());
            resultado.add(mov);
        }

        return resultado;
    }

    @Transactional
    public Pokemon aceitarMovimentoAprendido(String pokemonId, String perfilId, String movimentoId, String substituirMovimentoId) {
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
        if (movimentoId == null || movimentoId.isBlank()) {
            throw new RegraNegocioException("movimentoId é obrigatório.");
        }

        PokemonSpecies species = pokemon.getSpecies();
        if (species == null) {
            throw new RegraNegocioException("Espécie do Pokémon não encontrada.");
        }

        // Valida que o movimento é aprendível por LEVEL_UP <= nível atual.
        List<PokemonSpeciesMovimento> entries = pokemonLearnsetService.listarLearnset(species.getId());
        boolean existeNivelUp = entries.stream()
                .anyMatch(e -> e.getLearnMethod() == MoveLearnMethod.LEVEL_UP
                        && e.getLevel() != null
                        && e.getLevel() <= pokemon.getNivel()
                        && e.getMovimento() != null
                        && movimentoId.equals(e.getMovimento().getId()));

        if (!existeNivelUp) {
            throw new RegraNegocioException("Movimento não está disponível para aprender neste nível.");
        }

        Movimento novoMov = movimentoRepository.findById(movimentoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Movimento não encontrado: " + movimentoId));

        List<Movimento> conhecidos = pokemon.getMovimentosConhecidos() != null ? pokemon.getMovimentosConhecidos() : new ArrayList<>();
        boolean jaConhecido = conhecidos.stream().anyMatch(m -> movimentoId.equals(m.getId()));
        if (jaConhecido) {
            throw new RegraNegocioException("Este movimento já está aprendido.");
        }

        if (conhecidos.size() < MAX_MOVIMENTOS_POR_POKEMON) {
            conhecidos.add(novoMov);
            pokemon.setMovimentosConhecidos(semMovimentosDuplicados(conhecidos));
            return pokemonRepository.save(pokemon);
        }

        // Quando o Pokémon estiver cheio, prioriza o movimento selecionado pelo player.
        // Se a seleção ficar inválida (lista mudou durante a sequência de pop-ups),
        // faz fallback para o primeiro movimento atualmente aprendido.
        String alvoSubstituicao = conhecidos.get(0).getId();
        if (substituirMovimentoId != null && !substituirMovimentoId.isBlank()) {
            boolean alvoExiste = conhecidos.stream().anyMatch(m -> substituirMovimentoId.equals(m.getId()));
            if (alvoExiste) {
                alvoSubstituicao = substituirMovimentoId;
            }
        }

        final String alvoFinal = alvoSubstituicao;
        conhecidos = conhecidos.stream()
                .filter(m -> !alvoFinal.equals(m.getId()))
                .collect(Collectors.toList());
        conhecidos.add(novoMov);
        pokemon.setMovimentosConhecidos(semMovimentosDuplicados(conhecidos));
        return pokemonRepository.save(pokemon);
    }

    @Transactional
    public Pokemon recusarMovimentoAprendido(String pokemonId, String perfilId, String movimentoId) {
        // No-op: recusas não são persistidas; a próxima oferta é calculada apenas pelas faixas de nível cruzadas.
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
        if (movimentoId == null || movimentoId.isBlank()) {
            throw new RegraNegocioException("movimentoId é obrigatório.");
        }
        return pokemon;
    }

    @Transactional
    public Pokemon colocarNoTime(String pokemonId, String perfilId, int ordem) {
        if (ordem < 1 || ordem > MAX_POKEMONS_NO_TIME) {
            throw new RegraNegocioException("Ordem no time deve ser entre 1 e " + MAX_POKEMONS_NO_TIME + ".");
        }
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
        if (pokemon.getOrigem() != OrigemPokemon.TREINADOR) {
            throw new RegraNegocioException("Somente Pokémon do treinador podem entrar no time.");
        }
        int noTime = pokemonRepository.countTimePrincipalByPerfilId(perfilId);
        if (pokemon.getOrdemTime() == null || pokemon.getOrdemTime() == 0) {
            if (noTime >= MAX_POKEMONS_NO_TIME) {
                throw new RegraNegocioException("Time principal já está cheio (máximo " + MAX_POKEMONS_NO_TIME + ").");
            }
        }
        pokemon.setOrdemTime(ordem);
        return pokemonRepository.save(pokemon);
    }

    @Transactional
    public Pokemon removerDoTime(String pokemonId, String perfilId) {
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
        pokemon.setOrdemTime(null);
        return pokemonRepository.save(pokemon);
    }

    /**
     * Permite ao mestre alterar os tipos exibidos deste Pokémon (instância), sem mudar a espécie no catálogo.
     */
    @Transactional
    public Pokemon mestreDefinirTiposPokemon(String pokemonId, Tipagem tipoPrimario,
                                           Tipagem tipoSecundario, boolean resetParaEspecie) {
        Pokemon pokemon = pokemonRepository.findById(pokemonId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pokémon não encontrado."));
        if (resetParaEspecie) {
            pokemon.setTipoPrimarioOverride(null);
            pokemon.setTipoSecundarioOverride(null);
            return pokemonRepository.save(pokemon);
        }
        if (tipoPrimario == null) {
            throw new RegraNegocioException("tipoPrimario é obrigatório quando não se restaura os tipos da espécie.");
        }
        if (tipoSecundario != null && tipoSecundario == tipoPrimario) {
            throw new RegraNegocioException("Tipo primário e secundário não podem ser iguais.");
        }
        pokemon.setTipoPrimarioOverride(tipoPrimario);
        pokemon.setTipoSecundarioOverride(tipoSecundario);
        return pokemonRepository.save(pokemon);
    }

    @Transactional
    public void excluir(String pokemonId, String perfilId) {
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
        PerfilJogador perfil = pokemon.getPerfil();
        perfil.getPokemons().remove(pokemon);
        pokemonRepository.delete(pokemon);
    }

    @Transactional
    public Pokemon evoluir(String pokemonId, String perfilId, Integer novaPokedexId) {
        return pokemonEvolutionService.evoluir(pokemonId, perfilId, novaPokedexId);
    }

    @Transactional
    public Pokemon alocarAtributo(String pokemonId, String perfilId, String atributo, int quantidade, boolean isMestre) {
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
        pokemonStatService.alocarPontos(pokemon, atributo, quantidade, isMestre);
        return pokemonRepository.save(pokemon);
    }

    @Transactional(readOnly = true)
    public List<PokemonEvolucaoOpcaoDto> listarEvolucoesPossiveis(String pokemonId, String perfilId) {
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
        return pokemonEvolutionService.listarOpcoes(pokemon).stream().map(rule -> {
            PokemonEvolucaoOpcaoDto dto = new PokemonEvolucaoOpcaoDto();
            dto.setPokedexId(rule.getToPokedexId());
            dto.setEspecie(pokemonSpeciesRepository.findByPokedexId(rule.getToPokedexId()).map(PokemonSpecies::getNome).orElse("Pokedex " + rule.getToPokedexId()));
            dto.setTriggerType(rule.getTriggerType());
            dto.setMinLevel(rule.getMinLevel());
            dto.setItemName(rule.getItemName());
            boolean porNivel = rule.getTriggerType() != null &&
                    ("LEVEL-UP".equalsIgnoreCase(rule.getTriggerType()) || "LEVEL_UP".equalsIgnoreCase(rule.getTriggerType()) || "LEVEL".equalsIgnoreCase(rule.getTriggerType()));
            dto.setDisponivelAgora(!porNivel || rule.getMinLevel() == null || pokemon.getNivel() >= rule.getMinLevel());
            return dto;
        }).toList();
    }

    private void preencherIvsAleatorios(Pokemon pokemon) {
        pokemon.setIvHp(rolarIv());
        pokemon.setIvAtaque(rolarIv());
        pokemon.setIvDefesa(rolarIv());
        pokemon.setIvAtaqueEspecial(rolarIv());
        pokemon.setIvDefesaEspecial(rolarIv());
        pokemon.setIvSpeed(rolarIv());
    }

    private int rolarIv() {
        return ThreadLocalRandom.current().nextInt(32);
    }

    private boolean sortearShiny() {
        return ThreadLocalRandom.current().nextInt(100) < shinyChancePercent;
    }

    private Genero definirGeneroAleatorio(PokemonSpecies species) {
        Integer genderRate = species != null ? species.getGenderRate() : null;
        if (genderRate == null || genderRate < 0) {
            return Genero.SEM_GENERO;
        }
        if (genderRate <= 0) {
            return Genero.MACHO;
        }
        if (genderRate >= 8) {
            return Genero.FEMEA;
        }
        int femalePercent = Math.round((genderRate / 8.0f) * 100f);
        return ThreadLocalRandom.current().nextInt(100) < femalePercent ? Genero.FEMEA : Genero.MACHO;
    }

    private List<Movimento> buscarMovimentosPorIds(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        List<Movimento> movimentos = movimentoRepository.findAllById(ids);
        Map<String, Movimento> porId = new HashMap<>();
        for (Movimento m : movimentos) {
            porId.put(m.getId(), m);
        }
        List<Movimento> ordem = new ArrayList<>(ids.size());
        for (String id : ids) {
            Movimento m = porId.get(id);
            if (m == null) {
                throw new RecursoNaoEncontradoException("Um ou mais movimentos não foram encontrados.");
            }
            ordem.add(m);
        }
        return ordem;
    }

    private static List<String> deduplicarIdsPreservandoOrdem(List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        LinkedHashSet<String> visto = new LinkedHashSet<>();
        for (String id : ids) {
            if (id != null && !id.isBlank()) {
                visto.add(id);
            }
        }
        return new ArrayList<>(visto);
    }

    private static List<Movimento> semMovimentosDuplicados(List<Movimento> movimentos) {
        if (movimentos == null || movimentos.isEmpty()) {
            return new ArrayList<>();
        }
        Map<String, Movimento> map = new LinkedHashMap<>();
        for (Movimento m : movimentos) {
            if (m != null && m.getId() != null) {
                map.putIfAbsent(m.getId(), m);
            }
        }
        return new ArrayList<>(map.values());
    }

    private void validarHabilidadeDaSpecies(PokemonSpecies species, String habilidadeId) {
        boolean pertence = pokemonAbilityService.listarDaSpecies(species.getId()).stream()
                .anyMatch(link -> link.getHabilidade() != null && habilidadeId.equals(link.getHabilidade().getId()));
        if (!pertence) {
            throw new RegraNegocioException("Habilidade não pertence à espécie atual.");
        }
    }

    private int calcularHpMaximo(Pokemon pokemon) {
        return pokemonStatService.calcularHpMaximo(pokemon);
    }

    private int hpAtualNormalizado(Pokemon pokemon) {
        int hpMaximo = calcularHpMaximo(pokemon);
        int hpAtual = pokemon.getHpAtual() == null ? hpMaximo : pokemon.getHpAtual();
        return Math.max(0, Math.min(hpAtual, hpMaximo));
    }

    private int calcularAtaque(Pokemon pokemon) {
        return pokemonStatService.calcularAtaque(pokemon);
    }

    private int calcularAtaqueEspecial(Pokemon pokemon) {
        return pokemonStatService.calcularAtaqueEspecial(pokemon);
    }

    private int calcularDefesa(Pokemon pokemon) {
        return pokemonStatService.calcularDefesa(pokemon);
    }

    private int calcularDefesaEspecial(Pokemon pokemon) {
        return pokemonStatService.calcularDefesaEspecial(pokemon);
    }

    private PokemonSpecies obterSpeciesRuntime(int pokedexId) {
        if (strictLocalRuntime) {
            return pokeApiService.obterSpeciesLocal(pokedexId);
        }
        return pokeApiService.obterSpeciesParaCriacao(pokedexId);
    }

    private int resolverPokedexIdPorIdOuNome(String idOuNome) {
        String raw = idOuNome == null ? "" : idOuNome.trim();
        if (raw.isBlank()) {
            throw new RegraNegocioException("Informe um nome ou id de Pokédex válido.");
        }
        if (raw.chars().allMatch(Character::isDigit)) {
            int value = Integer.parseInt(raw);
            if (value <= 0) throw new RegraNegocioException("Pokédex ID inválido.");
            return value;
        }
        return pokemonSpeciesRepository.findFirstByNomeIgnoreCase(raw)
                .or(() -> pokemonSpeciesRepository.findTop20ByNomeContainingIgnoreCaseOrderByPokedexIdAsc(raw).stream().findFirst())
                .map(PokemonSpecies::getPokedexId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Espécie não encontrada pelo nome informado: " + raw));
    }
}
