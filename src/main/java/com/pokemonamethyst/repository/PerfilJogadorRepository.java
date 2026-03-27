package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.PerfilJogador;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PerfilJogadorRepository extends JpaRepository<PerfilJogador, String> {

    Optional<PerfilJogador> findByUsuarioId(String usuarioId);

    @Query("SELECT p FROM PerfilJogador p LEFT JOIN FETCH p.mochila WHERE p.usuario.id = :usuarioId")
    Optional<PerfilJogador> findByUsuarioIdWithMochila(String usuarioId);

    @Query("SELECT p FROM PerfilJogador p LEFT JOIN FETCH p.mochila WHERE p.id = :id")
    Optional<PerfilJogador> findByIdWithMochila(String id);

    @Query("SELECT p FROM PerfilJogador p LEFT JOIN FETCH p.pokemons WHERE p.id = :id")
    Optional<PerfilJogador> findByIdWithPokemons(String id);
}
