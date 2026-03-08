package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.Pokemon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PokemonRepository extends JpaRepository<Pokemon, String> {

    List<Pokemon> findByPerfilIdOrderByOrdemTimeAsc(String perfilId);

    @Query("SELECT DISTINCT p FROM Pokemon p LEFT JOIN FETCH p.movimentosConhecidos WHERE p.perfil.id = :perfilId AND p.ordemTime IS NOT NULL AND p.ordemTime BETWEEN 1 AND 6 ORDER BY p.ordemTime")
    List<Pokemon> findTimePrincipalByPerfilId(String perfilId);

    @Query("SELECT DISTINCT p FROM Pokemon p LEFT JOIN FETCH p.movimentosConhecidos WHERE p.perfil.id = :perfilId AND (p.ordemTime IS NULL OR p.ordemTime = 0)")
    List<Pokemon> findBoxByPerfilId(String perfilId);

    @Query("SELECT COUNT(p) FROM Pokemon p WHERE p.perfil.id = :perfilId AND p.ordemTime IS NOT NULL AND p.ordemTime BETWEEN 1 AND 6")
    int countTimePrincipalByPerfilId(String perfilId);

    Optional<Pokemon> findByIdAndPerfilId(String id, String perfilId);
}
