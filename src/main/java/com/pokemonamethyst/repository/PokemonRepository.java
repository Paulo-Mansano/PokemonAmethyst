package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.Pokemon;
import com.pokemonamethyst.domain.OrigemPokemon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PokemonRepository extends JpaRepository<Pokemon, String> {

    List<Pokemon> findByPerfilIdOrderByOrdemTimeAsc(String perfilId);

    @Query("""
            SELECT DISTINCT p
            FROM Pokemon p
            LEFT JOIN FETCH p.species
            LEFT JOIN FETCH p.habilidadeAtiva
            LEFT JOIN FETCH p.personalidade
            LEFT JOIN FETCH p.itemSegurado
            LEFT JOIN FETCH p.movimentosConhecidos
            WHERE p.perfil.id = :perfilId
              AND p.ordemTime IS NOT NULL
              AND p.ordemTime BETWEEN 1 AND 6
            ORDER BY p.ordemTime
            """)
    List<Pokemon> findTimePrincipalByPerfilId(String perfilId);

    @Query("""
            SELECT DISTINCT p
            FROM Pokemon p
            LEFT JOIN FETCH p.species
            LEFT JOIN FETCH p.habilidadeAtiva
            LEFT JOIN FETCH p.personalidade
            LEFT JOIN FETCH p.itemSegurado
            LEFT JOIN FETCH p.movimentosConhecidos
            WHERE p.perfil.id = :perfilId
              AND (p.ordemTime IS NULL OR p.ordemTime = 0)
            """)
    List<Pokemon> findBoxByPerfilId(String perfilId);

    @Query("SELECT COUNT(p) FROM Pokemon p WHERE p.perfil.id = :perfilId AND p.ordemTime IS NOT NULL AND p.ordemTime BETWEEN 1 AND 6")
    int countTimePrincipalByPerfilId(String perfilId);

    @Query("""
            SELECT DISTINCT p
            FROM Pokemon p
            LEFT JOIN FETCH p.species
            LEFT JOIN FETCH p.habilidadeAtiva
            LEFT JOIN FETCH p.personalidade
            LEFT JOIN FETCH p.itemSegurado
            LEFT JOIN FETCH p.movimentosConhecidos
            WHERE p.id = :id
              AND p.perfil.id = :perfilId
            """)
    Optional<Pokemon> findByIdAndPerfilId(String id, String perfilId);

    @Query("""
            SELECT DISTINCT p
            FROM Pokemon p
            LEFT JOIN FETCH p.species
            LEFT JOIN FETCH p.habilidadeAtiva
            LEFT JOIN FETCH p.personalidade
            LEFT JOIN FETCH p.itemSegurado
            LEFT JOIN FETCH p.movimentosConhecidos
            WHERE p.perfil.id = :perfilId
            ORDER BY p.ordemTime ASC
            """)
    List<Pokemon> findByPerfilIdComRelacionamentos(String perfilId);

    @Query("""
            SELECT DISTINCT p
            FROM Pokemon p
            LEFT JOIN FETCH p.species
            LEFT JOIN FETCH p.habilidadeAtiva
            LEFT JOIN FETCH p.personalidade
            LEFT JOIN FETCH p.itemSegurado
            LEFT JOIN FETCH p.movimentosConhecidos
            WHERE p.perfil.id = :perfilId
              AND p.origem = :origem
            ORDER BY p.ordemTime ASC
            """)
    List<Pokemon> findByPerfilIdAndOrigemComRelacionamentos(String perfilId, OrigemPokemon origem);
}
