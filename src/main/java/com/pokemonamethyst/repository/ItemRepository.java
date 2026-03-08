package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.Item;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, String> {

    List<Item> findAllByOrderByNome();
}
