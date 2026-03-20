package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.PokemonSpeciesHabilidade;
import com.pokemonamethyst.domain.PokemonSpeciesHabilidadeId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PokemonSpeciesHabilidadeRepository extends JpaRepository<PokemonSpeciesHabilidade, PokemonSpeciesHabilidadeId> {
    List<PokemonSpeciesHabilidade> findBySpeciesId(String speciesId);

    void deleteBySpeciesId(String speciesId);
}
