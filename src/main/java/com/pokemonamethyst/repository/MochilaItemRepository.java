package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.MochilaItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface MochilaItemRepository extends JpaRepository<MochilaItem, String> {

    Optional<MochilaItem> findByMochilaIdAndItemId(String mochilaId, String itemId);

    @Modifying
    @Query("DELETE FROM MochilaItem mi WHERE mi.item.id = :itemId")
    int deleteAllByItemId(@Param("itemId") String itemId);
}
