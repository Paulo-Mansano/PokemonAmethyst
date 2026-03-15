package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.Habilidade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HabilidadeRepository extends JpaRepository<Habilidade, String> {

    List<Habilidade> findAllByOrderByNome();

    Optional<Habilidade> findByPokeapiId(Integer pokeapiId);
}
