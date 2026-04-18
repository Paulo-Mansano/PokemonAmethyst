package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.Item;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ItemRepository extends JpaRepository<Item, String> {

    List<Item> findAllByOrderByNome();

    List<Item> findAllByCategoriaIgnoreCaseOrderByNome(String categoria);

    List<Item> findByNomeEnContainingIgnoreCaseOrderByNomeEn(String termo);

    Optional<Item> findByPokeapiId(Integer pokeapiId);

    List<Item> findByPokeapiIdIsNotNull();
}
