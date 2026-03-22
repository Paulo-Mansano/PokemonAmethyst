package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.MoveLearnMethod;
import com.pokemonamethyst.domain.PokemonSpeciesMovimento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface PokemonSpeciesMovimentoRepository extends JpaRepository<PokemonSpeciesMovimento, Long> {
    List<PokemonSpeciesMovimento> findBySpeciesId(String speciesId);

    @Query("SELECT DISTINCT m FROM PokemonSpeciesMovimento m LEFT JOIN FETCH m.movimento WHERE m.species.id = :speciesId")
    List<PokemonSpeciesMovimento> findBySpeciesIdComMovimento(@Param("speciesId") String speciesId);

    List<PokemonSpeciesMovimento> findBySpeciesIdAndLearnMethodInAndLevelLessThanEqual(
            String speciesId,
            Collection<MoveLearnMethod> learnMethods,
            Integer level
    );

    List<PokemonSpeciesMovimento> findBySpeciesIdAndLearnMethodInAndLevelIsNull(
            String speciesId,
            Collection<MoveLearnMethod> learnMethods
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM PokemonSpeciesMovimento m WHERE m.species.id = :speciesId")
    void deleteBySpeciesId(@Param("speciesId") String speciesId);
}
