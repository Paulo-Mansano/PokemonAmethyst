package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.exception.RecursoNaoEncontradoException;
import com.pokemonamethyst.service.PokeApiService;
import com.pokemonamethyst.web.dto.PokeApiPokemonDetailDto;
import com.pokemonamethyst.web.dto.PokeApiPokemonSummaryDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pokeapi")
public class PokeApiController {

    private static final int MAX_LIMIT = 100;

    private final PokeApiService pokeApiService;

    public PokeApiController(PokeApiService pokeApiService) {
        this.pokeApiService = pokeApiService;
    }

    @GetMapping("/pokemon")
    public ResponseEntity<List<PokeApiPokemonSummaryDto>> listar(
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        int safeLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
        int safeOffset = Math.max(0, offset);
        List<PokeApiPokemonSummaryDto> lista = pokeApiService.listar(safeLimit, safeOffset);
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/pokemon/{idOuNome}")
    public ResponseEntity<PokeApiPokemonDetailDto> detalhe(@PathVariable String idOuNome) {
        try {
            PokeApiPokemonDetailDto detalhe = pokeApiService.buscarPorIdOuNome(idOuNome);
            return ResponseEntity.ok(detalhe);
        } catch (RecursoNaoEncontradoException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
