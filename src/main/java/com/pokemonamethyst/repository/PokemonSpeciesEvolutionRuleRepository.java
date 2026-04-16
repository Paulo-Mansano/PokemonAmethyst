package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.PokemonSpeciesEvolutionRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PokemonSpeciesEvolutionRuleRepository extends JpaRepository<PokemonSpeciesEvolutionRule, Long> {
    List<PokemonSpeciesEvolutionRule> findByFromPokedexIdOrderByToPokedexIdAsc(int fromPokedexId);
    void deleteByFromPokedexId(int fromPokedexId);
}
