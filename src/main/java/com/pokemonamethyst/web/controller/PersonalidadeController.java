package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.service.CatalogoService;
import com.pokemonamethyst.web.dto.PersonalidadeResponseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/personalidades")
public class PersonalidadeController {

    private final CatalogoService catalogoService;

    public PersonalidadeController(CatalogoService catalogoService) {
        this.catalogoService = catalogoService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<PersonalidadeResponseDto>> listar() {
        return ResponseEntity.ok(catalogoService.listarPersonalidades().stream()
                .map(PersonalidadeResponseDto::from)
                .toList());
    }
}
