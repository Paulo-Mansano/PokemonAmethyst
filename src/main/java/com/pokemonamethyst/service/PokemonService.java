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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class PokemonService {

    private static final int MAX_POKEMONS_NO_TIME = 6;
    private static final int MAX_MOVIMENTOS_POR_POKEMON = 8;
    private static final int NIVEL_INICIAL = 1;
    private static final int XP_POR_NIVEL = 10;

    private final PokemonRepository pokemonRepository;
    private final PerfilJogadorRepository perfilRepository;
    private final ItemRepository itemRepository;
    private final MovimentoRepository movimentoRepository;
    private final HabilidadeRepository habilidadeRepository;
    private final PersonalidadeRepository personalidadeRepository;
    private final PokeApiService pokeApiService;
    private final PokemonAbilityService pokemonAbilityService;
    private final PokemonLearnsetService pokemonLearnsetService;
    private final int shinyChancePercent;

    public PokemonService(PokemonRepository pokemonRepository, PerfilJogadorRepository perfilRepository,
                          ItemRepository itemRepository, MovimentoRepository movimentoRepository,
                          HabilidadeRepository habilidadeRepository,
                          PersonalidadeRepository personalidadeRepository, PokeApiService pokeApiService,
                          PokemonAbilityService pokemonAbilityService,
                          PokemonLearnsetService pokemonLearnsetService,
                          @Value("${pokemon.shiny-chance-percent:1}") int shinyChancePercent) {
        this.pokemonRepository = pokemonRepository;
        this.perfilRepository = perfilRepository;
        this.itemRepository = itemRepository;
        this.movimentoRepository = movimentoRepository;
        this.habilidadeRepository = habilidadeRepository;
        this.personalidadeRepository = personalidadeRepository;
        this.pokeApiService = pokeApiService;
        this.pokemonAbilityService = pokemonAbilityService;
        this.pokemonLearnsetService = pokemonLearnsetService;
        this.shinyChancePercent = Math.max(0, Math.min(100, shinyChancePercent));
    }

    public List<Pokemon> listarPorPerfil(String perfilId) {
        return pokemonRepository.findByPerfilIdComRelacionamentos(perfilId);
    }

    public List<Pokemon> listarTimePrincipal(String perfilId) {
        return pokemonRepository.findTimePrincipalByPerfilId(perfilId);
    }

    public List<Pokemon> listarBox(String perfilId) {
        return pokemonRepository.findBoxByPerfilId(perfilId);
    }

    public Pokemon buscarPorIdEPerfil(String id, String perfilId) {
        return pokemonRepository.findByIdAndPerfilId(id, perfilId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pokémon não encontrado."));
    }

    private int xpMinimoParaNivel(int nivel) {
        // nível 1 => 0 XP; nível 2 => 10 XP; nível 3 => 20 XP; etc.
        int n = Math.max(1, nivel);
        return (n - 1) * XP_POR_NIVEL;
    }

    private int calcularNivelPorXp(int xpAtual) {
        int xp = Math.max(0, xpAtual);
        // xp >= (nivel-1)*XP_POR_NIVEL => nivel = floor(xp/XP_POR_NIVEL) + 1
        return Math.max(1, (xp / XP_POR_NIVEL) + 1);
    }

    @Transactional
    public Pokemon criar(String perfilId, Integer pokedexId, String apelido, Genero genero, Pokebola pokebolaCaptura,
                         int staminaMaxima, List<String> movimentoIds,
                         String personalidadeId) {
        if (pokedexId == null || pokedexId <= 0) {
            throw new RegraNegocioException("Para criar um Pokémon, informe um pokedexId válido da PokéAPI.");
        }

        PerfilJogador perfil = perfilRepository.findById(perfilId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Perfil não encontrado."));

        if (movimentoIds != null && movimentoIds.size() > MAX_MOVIMENTOS_POR_POKEMON) {
            throw new RegraNegocioException("Máximo de " + MAX_MOVIMENTOS_POR_POKEMON + " ataques por Pokémon.");
        }
        int pokedexIdVal = pokedexId;
        Pokemon pokemon = new Pokemon();
        pokemon.setPerfil(perfil);
        pokemon.setOrdemTime(null);
        pokemon.setSpecies(pokeApiService.obterSpeciesParaCriacao(pokedexIdVal));
        pokemon.setGenero(genero != null ? genero : definirGeneroAleatorio(pokemon.getSpecies()));
        pokemon.setShiny(sortearShiny());
        pokemon.setHabilidadeAtiva(pokemonAbilityService.sortearHabilidadeAtiva(pokemon.getSpecies()));
        pokemon.setPokebolaCaptura(pokebolaCaptura != null ? pokebolaCaptura : Pokebola.POKEBALL);
        pokemon.setApelido(apelido);
        pokemon.setStaminaMaxima(staminaMaxima);
        pokemon.setNivel(NIVEL_INICIAL);
        pokemon.setXpAtual(0);
        preencherIvsAleatorios(pokemon);
        if (personalidadeId != null && !personalidadeId.isBlank()) {
            personalidadeRepository.findById(personalidadeId).ifPresent(pokemon::setPersonalidade);
        }

        if (movimentoIds != null && !movimentoIds.isEmpty()) {
            pokemonLearnsetService.validarMovimentosPermitidos(pokemon.getSpecies(), pokemon.getNivel(), movimentoIds);
            List<Movimento> movimentos = buscarMovimentosPorIds(movimentoIds);
            pokemon.setMovimentosConhecidos(movimentos);
        } else {
            pokemon.setMovimentosConhecidos(
                    new ArrayList<>(pokemonLearnsetService.listarMovimentosIniciais(pokemon.getSpecies(), NIVEL_INICIAL, MAX_MOVIMENTOS_POR_POKEMON))
            );
        }

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
                            List<String> movimentoIds, String habilidadeId) {
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
        int nivelAtual = pokemon.getNivel();
        int xpAtualFinal = xpAtual != null ? xpAtual : pokemon.getXpAtual();
        if (xpAtualFinal < 0) {
            throw new RegraNegocioException("xpAtual não pode ser negativo.");
        }
        if (nivel != null && nivel > nivelAtual) {
            int xpMin = xpMinimoParaNivel(nivel);
            if (xpAtualFinal < xpMin) {
                throw new RegraNegocioException("Para subir o nível para " + nivel + ", o Pokémon precisa de no mínimo " + xpMin + " XP.");
            }
        }
        if (pokedexId != null && pokedexId <= 0) {
            throw new RegraNegocioException("pokedexId inválido. Use um valor maior que zero.");
        }
        if (pokedexId != null) {
            PokemonSpecies especieAtual = pokemon.getSpecies();
            int pokedexAtual = especieAtual != null ? especieAtual.getPokedexId() : -1;
            if (pokedexId != pokedexAtual) {
                pokemon.setSpecies(pokeApiService.obterSpeciesParaCriacao(pokedexId));
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
        if (isShiny != null) pokemon.setShiny(isShiny);
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
        if (nivel != null) pokemon.setNivel(nivel);
        if (xpAtual != null) pokemon.setXpAtual(xpAtual);
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
        if (movimentoIds != null) {
            if (movimentoIds.size() > MAX_MOVIMENTOS_POR_POKEMON) {
                throw new RegraNegocioException("Máximo de " + MAX_MOVIMENTOS_POR_POKEMON + " ataques por Pokémon.");
            }
            pokemonLearnsetService.validarMovimentosPermitidos(pokemon.getSpecies(), pokemon.getNivel(), movimentoIds);
            List<Movimento> movimentos = buscarMovimentosPorIds(movimentoIds);
            pokemon.getMovimentosConhecidos().clear();
            pokemon.getMovimentosConhecidos().addAll(movimentos);
        }
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

        int nivelDepois = nivel != null ? nivel : nivelAtual;
        List<Movimento> movimentosAprendendo = List.of();
        if (nivel != null && nivelDepois > nivelAtual) {
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
        int xpDepois = Math.max(0, xpAntes + xpGanho);
        int nivelDepois = calcularNivelPorXp(xpDepois);

        pokemon.setXpAtual(xpDepois);
        pokemon.setNivel(nivelDepois);

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

    private List<Movimento> calcularMovimentosAprendidosEntreNiveis(Pokemon pokemon, int nivelAnterior, int nivelNovo) {
        if (pokemon == null || pokemon.getSpecies() == null) return List.of();
        if (nivelNovo <= nivelAnterior) return List.of();

        Set<String> conhecidos = pokemon.getMovimentosConhecidos() == null
                ? Set.of()
                : pokemon.getMovimentosConhecidos().stream().map(Movimento::getId).collect(Collectors.toSet());

        PokemonSpecies species = pokemon.getSpecies();
        List<PokemonSpeciesMovimento> entries = pokemonLearnsetService.listarLearnset(species.getId());

        Map<String, Movimento> melhorMovimentoPorId = new HashMap<>();
        Map<String, Integer> melhorNivelPorId = new HashMap<>();

        for (PokemonSpeciesMovimento e : entries) {
            if (e.getLearnMethod() != MoveLearnMethod.LEVEL_UP) continue;
            Integer level = e.getLevel();
            if (level == null) continue;
            if (level <= nivelAnterior || level > nivelNovo) continue;

            Movimento mov = e.getMovimento();
            if (mov == null || mov.getId() == null) continue;
            if (conhecidos.contains(mov.getId())) continue;

            Integer melhorNivel = melhorNivelPorId.get(mov.getId());
            if (melhorNivel == null || level < melhorNivel) {
                melhorNivelPorId.put(mov.getId(), level);
                melhorMovimentoPorId.put(mov.getId(), mov);
            }
        }

        return melhorMovimentoPorId.entrySet().stream()
                .sorted(
                        Comparator
                                .comparing((Map.Entry<String, Movimento> en) -> melhorNivelPorId.getOrDefault(en.getKey(), Integer.MAX_VALUE))
                                .thenComparing(en -> en.getValue().getId())
                )
                .map(Map.Entry::getValue)
                .collect(Collectors.toList());
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
            pokemon.setMovimentosConhecidos(conhecidos);
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
        pokemon.setMovimentosConhecidos(conhecidos);
        return pokemonRepository.save(pokemon);
    }

    @Transactional
    public Pokemon recusarMovimentoAprendido(String pokemonId, String perfilId, String movimentoId) {
        // No-op: recusas não são persistidas; a próxima oferta é calculada apenas pelas faixas de nível cruzadas.
        buscarPorIdEPerfil(pokemonId, perfilId);
        if (movimentoId == null || movimentoId.isBlank()) {
            throw new RegraNegocioException("movimentoId é obrigatório.");
        }
        return pokemonRepository.findByIdAndPerfilId(pokemonId, perfilId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pokémon não encontrado."));
    }

    @Transactional
    public Pokemon colocarNoTime(String pokemonId, String perfilId, int ordem) {
        if (ordem < 1 || ordem > MAX_POKEMONS_NO_TIME) {
            throw new RegraNegocioException("Ordem no time deve ser entre 1 e " + MAX_POKEMONS_NO_TIME + ".");
        }
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
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

    @Transactional
    public void excluir(String pokemonId, String perfilId) {
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
        PerfilJogador perfil = pokemon.getPerfil();
        perfil.getPokemons().remove(pokemon);
        pokemonRepository.delete(pokemon);
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
        if (movimentos.size() != ids.size()) {
            throw new RecursoNaoEncontradoException("Um ou mais movimentos não foram encontrados.");
        }
        return movimentos;
    }

    private void validarHabilidadeDaSpecies(PokemonSpecies species, String habilidadeId) {
        boolean pertence = pokemonAbilityService.listarDaSpecies(species.getId()).stream()
                .anyMatch(link -> link.getHabilidade() != null && habilidadeId.equals(link.getHabilidade().getId()));
        if (!pertence) {
            throw new RegraNegocioException("Habilidade não pertence à espécie atual.");
        }
    }
}
