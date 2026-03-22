package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.PokemonSpecies;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PokemonSpeciesRepository extends JpaRepository<PokemonSpecies, String> {
    Optional<PokemonSpecies> findByPokedexId(int pokedexId);
    List<PokemonSpecies> findTop200ByOrderByPokedexIdAsc();
    List<PokemonSpecies> findTop200ByNomeContainingIgnoreCaseOrderByPokedexIdAsc(String nome);
}
