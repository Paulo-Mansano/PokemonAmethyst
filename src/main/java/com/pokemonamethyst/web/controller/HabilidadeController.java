package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.domain.Habilidade;
import com.pokemonamethyst.service.CatalogoService;
import com.pokemonamethyst.web.dto.HabilidadeResponseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/habilidades")
public class HabilidadeController {

    private final CatalogoService catalogoService;

    public HabilidadeController(CatalogoService catalogoService) {
        this.catalogoService = catalogoService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<HabilidadeResponseDto>> listar() {
        List<Habilidade> lista = catalogoService.listarHabilidades();
        return ResponseEntity.ok(lista.stream().map(HabilidadeResponseDto::from).toList());
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<HabilidadeResponseDto> buscar(@PathVariable String id) {
        Habilidade h = catalogoService.buscarHabilidade(id);
        return ResponseEntity.ok(HabilidadeResponseDto.from(h));
    }
}
