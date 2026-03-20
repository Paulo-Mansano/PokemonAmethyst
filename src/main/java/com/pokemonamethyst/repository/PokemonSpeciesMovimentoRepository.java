package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.MoveLearnMethod;
import com.pokemonamethyst.domain.PokemonSpeciesMovimento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface PokemonSpeciesMovimentoRepository extends JpaRepository<PokemonSpeciesMovimento, Long> {
    List<PokemonSpeciesMovimento> findBySpeciesId(String speciesId);

    List<PokemonSpeciesMovimento> findBySpeciesIdAndLearnMethodInAndLevelLessThanEqual(
            String speciesId,
            Collection<MoveLearnMethod> learnMethods,
            Integer level
    );

    List<PokemonSpeciesMovimento> findBySpeciesIdAndLearnMethodInAndLevelIsNull(
            String speciesId,
            Collection<MoveLearnMethod> learnMethods
    );

    void deleteBySpeciesId(String speciesId);
}
