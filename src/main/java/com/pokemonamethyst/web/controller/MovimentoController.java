package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.domain.Movimento;
import com.pokemonamethyst.service.CatalogoService;
import com.pokemonamethyst.web.dto.MovimentoResponseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/movimentos")
public class MovimentoController {

    private final CatalogoService catalogoService;

    public MovimentoController(CatalogoService catalogoService) {
        this.catalogoService = catalogoService;
    }

    @GetMapping
    public ResponseEntity<List<MovimentoResponseDto>> listar() {
        List<Movimento> lista = catalogoService.listarMovimentos();
        return ResponseEntity.ok(lista.stream().map(MovimentoResponseDto::from).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MovimentoResponseDto> buscar(@PathVariable String id) {
        Movimento m = catalogoService.buscarMovimento(id);
        return ResponseEntity.ok(MovimentoResponseDto.from(m));
    }
}
