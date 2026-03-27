package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.exception.RecursoNaoEncontradoException;
import com.pokemonamethyst.service.PokeApiService;
import com.pokemonamethyst.service.PokemonSpeciesConfigService;
import com.pokemonamethyst.web.dto.PokeApiPokemonDetailDto;
import com.pokemonamethyst.web.dto.PokeApiPokemonSummaryDto;
import com.pokemonamethyst.web.dto.PokemonSpeciesResumoDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pokeapi")
public class PokeApiController {

    private static final int MAX_LIMIT = 100;

    private final PokeApiService pokeApiService;
    private final PokemonSpeciesConfigService speciesConfigService;

    public PokeApiController(PokeApiService pokeApiService, PokemonSpeciesConfigService speciesConfigService) {
        this.pokeApiService = pokeApiService;
        this.speciesConfigService = speciesConfigService;
    }

    @GetMapping("/pokemon")
    public ResponseEntity<List<PokeApiPokemonSummaryDto>> listar(
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset,
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) Integer pokedexId) {
        int safeLimit = Math.min(Math.max(1, limit), MAX_LIMIT);
        int safeOffset = Math.max(0, offset);
        List<PokeApiPokemonSummaryDto> lista = pokeApiService.listarComFiltro(safeLimit, safeOffset, nome, pokedexId);
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

    @GetMapping("/species-local")
    public ResponseEntity<List<PokemonSpeciesResumoDto>> listarCatalogoLocal() {
        return ResponseEntity.ok(speciesConfigService.listarCatalogoLocal());
    }

    @GetMapping("/species-local/version")
    public ResponseEntity<Map<String, String>> obterVersaoCatalogoLocal() {
        return ResponseEntity.ok(Map.of("version", speciesConfigService.obterVersaoCatalogo()));
    }
}
