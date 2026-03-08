package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.MochilaItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MochilaItemRepository extends JpaRepository<MochilaItem, String> {

    Optional<MochilaItem> findByMochilaIdAndItemId(String mochilaId, String itemId);
}
