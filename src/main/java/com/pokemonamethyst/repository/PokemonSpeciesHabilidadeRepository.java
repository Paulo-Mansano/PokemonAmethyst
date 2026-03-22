package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.PokemonSpeciesHabilidade;
import com.pokemonamethyst.domain.PokemonSpeciesHabilidadeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PokemonSpeciesHabilidadeRepository extends JpaRepository<PokemonSpeciesHabilidade, PokemonSpeciesHabilidadeId> {
    List<PokemonSpeciesHabilidade> findBySpeciesId(String speciesId);

    /**
     * Uma query por coleção: Hibernate não permite JOIN FETCH de dois {@code OneToMany} (bags) na mesma consulta.
     */
    @Query("SELECT DISTINCT h FROM PokemonSpeciesHabilidade h LEFT JOIN FETCH h.habilidade WHERE h.species.id = :speciesId")
    List<PokemonSpeciesHabilidade> findBySpeciesIdComHabilidade(@Param("speciesId") String speciesId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM PokemonSpeciesHabilidade h WHERE h.species.id = :speciesId")
    void deleteBySpeciesId(@Param("speciesId") String speciesId);
}
