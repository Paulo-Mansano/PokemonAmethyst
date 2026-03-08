package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.domain.PerfilJogador;
import com.pokemonamethyst.repository.PerfilJogadorRepository;
import com.pokemonamethyst.service.PokeApiService;
import com.pokemonamethyst.service.PokemonService;
import com.pokemonamethyst.web.dto.PerfilJogadorResponseDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mestre")
public class MestreController {

    private final PerfilJogadorRepository perfilRepository;
    private final PokemonService pokemonService;
    private final PokeApiService pokeApiService;

    public MestreController(PerfilJogadorRepository perfilRepository, PokemonService pokemonService, PokeApiService pokeApiService) {
        this.perfilRepository = perfilRepository;
        this.pokemonService = pokemonService;
        this.pokeApiService = pokeApiService;
    }

    @PostMapping("/pokeapi/importar-movimentos")
    public ResponseEntity<Map<String, Integer>> importarMovimentos() {
        int importados = pokeApiService.importarMovimentos();
        return ResponseEntity.ok(Map.of("importados", importados));
    }

    @GetMapping("/jogadores")
    public ResponseEntity<List<PerfilJogadorResponseDto>> listarJogadores() {
        List<PerfilJogador> perfis = perfilRepository.findAll();
        List<PerfilJogadorResponseDto> dtos = perfis.stream()
                .map(p -> {
                    var time = pokemonService.listarTimePrincipal(p.getId());
                    var box = pokemonService.listarBox(p.getId());
                    return PerfilJogadorResponseDto.from(p, time, box);
                })
                .toList();
        return ResponseEntity.ok(dtos);
    }
}
