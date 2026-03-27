package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.PokemonSpecies;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PokemonSpeciesRepository extends JpaRepository<PokemonSpecies, String> {
    Optional<PokemonSpecies> findByPokedexId(int pokedexId);
    Optional<PokemonSpecies> findFirstByNomeIgnoreCase(String nome);
    List<PokemonSpecies> findTop20ByNomeContainingIgnoreCaseOrderByPokedexIdAsc(String nome);
    List<PokemonSpecies> findAllByOrderByPokedexIdAsc();
    List<PokemonSpecies> findTop200ByOrderByPokedexIdAsc();
    List<PokemonSpecies> findTop200ByNomeContainingIgnoreCaseOrderByPokedexIdAsc(String nome);

    @Query("select s.pokedexId from PokemonSpecies s")
    List<Integer> findAllPokedexIds();

    @Query(value = """
            SELECT COALESCE(
                md5(string_agg(concat_ws('|', id, CAST(pokedex_id AS text), nome, COALESCE(imagem_url, '')), '||' ORDER BY pokedex_id)),
                'empty'
            )
            FROM pokemon_species
            """, nativeQuery = true)
    String obterVersaoCatalogoSpecies();
}
