package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.Habilidade;
import com.pokemonamethyst.domain.PokemonSpecies;
import com.pokemonamethyst.domain.PokemonSpeciesHabilidade;
import com.pokemonamethyst.exception.RegraNegocioException;
import com.pokemonamethyst.repository.PokemonSpeciesHabilidadeRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class PokemonAbilityService {

    private final PokemonSpeciesHabilidadeRepository speciesHabilidadeRepository;
    private final int hiddenAbilityChancePercent;

    public PokemonAbilityService(
            PokemonSpeciesHabilidadeRepository speciesHabilidadeRepository,
            @Value("${pokemon.hidden-ability-chance-percent:5}") int hiddenAbilityChancePercent
    ) {
        this.speciesHabilidadeRepository = speciesHabilidadeRepository;
        this.hiddenAbilityChancePercent = Math.max(0, Math.min(100, hiddenAbilityChancePercent));
    }

    public List<PokemonSpeciesHabilidade> listarDaSpecies(String speciesId) {
        return speciesHabilidadeRepository.findBySpeciesId(speciesId);
    }

    public Habilidade sortearHabilidadeAtiva(PokemonSpecies species) {
        if (species == null || species.getId() == null) {
            throw new RegraNegocioException("Espécie inválida para sortear habilidade.");
        }
        Habilidade escolhida = sortearHabilidadeAtivaOuNulo(species);
        if (escolhida == null) {
            throw new RegraNegocioException("Espécie sem habilidades cadastradas: " + species.getNome());
        }
        return escolhida;
    }

    /**
     * Igual a {@link #sortearHabilidadeAtiva(PokemonSpecies)}, mas retorna {@code null} quando a espécie
     * ainda não tem habilidades no catálogo (ex.: espécie placeholder pokedex 0 "Desconhecido").
     */
    public Habilidade sortearHabilidadeAtivaOuNulo(PokemonSpecies species) {
        if (species == null || species.getId() == null) {
            return null;
        }
        List<PokemonSpeciesHabilidade> opcoes = listarDaSpecies(species.getId());
        if (opcoes.isEmpty()) {
            return null;
        }
        List<PokemonSpeciesHabilidade> hidden = opcoes.stream()
                .filter(h -> h.isHidden() || h.getSlot() == 3)
                .toList();
        List<PokemonSpeciesHabilidade> normais = opcoes.stream()
                .filter(h -> !h.isHidden() && h.getSlot() != 3)
                .toList();
        boolean tentaHidden = !hidden.isEmpty() && ThreadLocalRandom.current().nextInt(100) < hiddenAbilityChancePercent;
        List<PokemonSpeciesHabilidade> pool = tentaHidden ? hidden : normais;
        if (pool.isEmpty()) {
            pool = !normais.isEmpty() ? normais : hidden;
        }
        if (pool.isEmpty()) {
            return null;
        }
        PokemonSpeciesHabilidade sorteada = pool.get(ThreadLocalRandom.current().nextInt(pool.size()));
        return sorteada.getHabilidade();
    }

    /** Reservado para futura invalidação de cache; evite cachear entidades JPA diretamente. */
    public void invalidarCacheSpecies(String speciesId) {
        // no-op
    }
}
