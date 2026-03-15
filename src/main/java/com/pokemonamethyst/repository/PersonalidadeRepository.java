package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.Personalidade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PersonalidadeRepository extends JpaRepository<Personalidade, String> {

    List<Personalidade> findAllByOrderByNome();
}
