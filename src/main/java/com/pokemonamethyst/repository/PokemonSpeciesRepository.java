package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.PokemonSpecies;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PokemonSpeciesRepository extends JpaRepository<PokemonSpecies, String> {
    Optional<PokemonSpecies> findByPokedexId(int pokedexId);

    @Query("""
            SELECT DISTINCT ps
            FROM PokemonSpecies ps
            LEFT JOIN FETCH ps.habilidades h
            LEFT JOIN FETCH h.habilidade
            LEFT JOIN FETCH ps.learnset ls
            LEFT JOIN FETCH ls.movimento
            WHERE ps.id = :id
            """)
    Optional<PokemonSpecies> findComRelacoesById(String id);
}
