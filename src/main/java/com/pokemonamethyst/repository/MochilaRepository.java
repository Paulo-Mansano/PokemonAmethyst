package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.Mochila;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface MochilaRepository extends JpaRepository<Mochila, String> {

    @Query("SELECT m FROM Mochila m LEFT JOIN FETCH m.conteudos c LEFT JOIN FETCH c.item WHERE m.id = :id")
    Optional<Mochila> findByIdWithConteudos(String id);
}
