package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.Pokemon;
import com.pokemonamethyst.domain.PokemonSpecies;
import com.pokemonamethyst.domain.PokemonSpeciesEvolutionRule;
import com.pokemonamethyst.exception.RegraNegocioException;
import com.pokemonamethyst.repository.PokemonRepository;
import com.pokemonamethyst.repository.PokemonSpeciesRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PokemonEvolutionService {

    private final PokemonRepository pokemonRepository;
    private final PokemonSpeciesRepository pokemonSpeciesRepository;
    private final PokemonGenerationService pokemonGenerationService;
    private final PokemonStatService pokemonStatService;
    private final PokeApiService pokeApiService;

    public PokemonEvolutionService(PokemonRepository pokemonRepository,
                                   PokemonSpeciesRepository pokemonSpeciesRepository,
                                   PokemonGenerationService pokemonGenerationService,
                                   PokemonStatService pokemonStatService,
                                   PokeApiService pokeApiService) {
        this.pokemonRepository = pokemonRepository;
        this.pokemonSpeciesRepository = pokemonSpeciesRepository;
        this.pokemonGenerationService = pokemonGenerationService;
        this.pokemonStatService = pokemonStatService;
        this.pokeApiService = pokeApiService;
    }

    @Transactional
    public Pokemon evoluir(String pokemonId, String perfilId, Integer novaPokedexId) {
        Pokemon pokemon = pokemonRepository.findByIdAndPerfilId(pokemonId, perfilId)
                .orElseThrow(() -> new RegraNegocioException("Pokémon não encontrado para evolução."));
        List<PokemonSpeciesEvolutionRule> opcoes = listarOpcoes(pokemon);
        if (opcoes.isEmpty()) {
            throw new RegraNegocioException("Este Pokémon não possui evolução configurada localmente.");
        }
        PokemonSpeciesEvolutionRule selecionada = selecionarOpcao(pokemon, opcoes, novaPokedexId);
        validarElegibilidade(pokemon, selecionada);
        PokemonSpecies novaSpecies = resolverNovaSpecies(selecionada.getToPokedexId());
        evoluir(pokemon, novaSpecies);
        return pokemonRepository.save(pokemon);
    }

    public List<PokemonSpeciesEvolutionRule> listarOpcoes(Pokemon pokemon) {
        if (pokemon == null || pokemon.getSpecies() == null) {
            return List.of();
        }
        return pokeApiService.listarRegrasEvolucaoLocais(pokemon.getSpecies().getPokedexId());
    }

    public void evoluir(Pokemon pokemon, PokemonSpecies novaSpecies) {
        if (pokemon == null) {
            throw new RegraNegocioException("Pokémon inválido para evolução.");
        }
        if (novaSpecies == null) {
            throw new RegraNegocioException("Espécie de evolução inválida.");
        }

        int pontosDevolvidos = pokemonStatService.totalAtributosDistribuiveisReset(pokemon);
        int bonusEvolucao = rolarBonusEvolucao(novaSpecies);
        pokemon.setPontosDistribuicaoDisponiveis(
                Math.max(0, pokemon.getPontosDistribuicaoDisponiveis() + pontosDevolvidos + bonusEvolucao)
        );
        pokemonGenerationService.reinicializarParaEvolucao(pokemon, novaSpecies);
        pokemonStatService.sincronizarMaximos(pokemon);
    }

    private PokemonSpecies resolverNovaSpecies(int novaPokedexId) {
        return pokemonSpeciesRepository.findByPokedexId(novaPokedexId)
                .orElseGet(() -> pokeApiService.obterSpeciesParaCriacao(novaPokedexId));
    }

    private PokemonSpeciesEvolutionRule selecionarOpcao(Pokemon pokemon,
                                                        List<PokemonSpeciesEvolutionRule> opcoes,
                                                        Integer novaPokedexId) {
        if (novaPokedexId != null && novaPokedexId > 0) {
            return opcoes.stream()
                    .filter(o -> o.getToPokedexId() == novaPokedexId)
                    .findFirst()
                    .orElseThrow(() -> new RegraNegocioException("A espécie de evolução escolhida não é válida para este Pokémon."));
        }
        return opcoes.get(0);
    }

    private void validarElegibilidade(Pokemon pokemon, PokemonSpeciesEvolutionRule opcao) {
        String trigger = opcao.getTriggerType() == null ? "UNKNOWN" : opcao.getTriggerType().toUpperCase();
        if (("LEVEL-UP".equals(trigger) || "LEVEL_UP".equals(trigger) || "LEVEL".equals(trigger))
                && opcao.getMinLevel() != null
                && pokemon.getNivel() < opcao.getMinLevel()) {
            throw new RegraNegocioException("Nível insuficiente para esta evolução. Necessário nível " + opcao.getMinLevel() + ".");
        }
    }

    private int rolarBonusEvolucao(PokemonSpecies novaSpecies) {
        int stage = pokeApiService.obterEstagioEvolutivo(novaSpecies.getPokedexId());
        int dados = stage >= 3 ? 2 : 1;
        int total = 0;
        for (int i = 0; i < dados; i++) {
            total += 1 + java.util.concurrent.ThreadLocalRandom.current().nextInt(6);
        }
        return total;
    }
}
