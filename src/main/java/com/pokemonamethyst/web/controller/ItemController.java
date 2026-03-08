package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.domain.Item;
import com.pokemonamethyst.service.CatalogoService;
import com.pokemonamethyst.web.dto.ItemResponseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/itens")
public class ItemController {

    private final CatalogoService catalogoService;

    public ItemController(CatalogoService catalogoService) {
        this.catalogoService = catalogoService;
    }

    @GetMapping
    public ResponseEntity<List<ItemResponseDto>> listar() {
        List<Item> lista = catalogoService.listarItens();
        return ResponseEntity.ok(lista.stream().map(ItemResponseDto::from).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemResponseDto> buscar(@PathVariable String id) {
        Item i = catalogoService.buscarItem(id);
        return ResponseEntity.ok(ItemResponseDto.from(i));
    }
}
