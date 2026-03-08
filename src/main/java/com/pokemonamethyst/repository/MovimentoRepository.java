package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.Movimento;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MovimentoRepository extends JpaRepository<Movimento, String> {

    List<Movimento> findAllByOrderByNome();

    Optional<Movimento> findByNomeIgnoreCase(String nome);
}
