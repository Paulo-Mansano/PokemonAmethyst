package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.Habilidade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HabilidadeRepository extends JpaRepository<Habilidade, String> {

    List<Habilidade> findAllByOrderByNome();
}
