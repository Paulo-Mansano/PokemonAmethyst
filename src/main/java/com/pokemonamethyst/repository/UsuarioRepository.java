package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, String> {

    Optional<Usuario> findByNomeUsuario(String nomeUsuario);

    boolean existsByNomeUsuario(String nomeUsuario);

    @Query("SELECT u FROM Usuario u LEFT JOIN FETCH u.perfilJogador WHERE u.id = :id")
    Optional<Usuario> findByIdWithPerfil(String id);
}
