package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.domain.PerfilJogador;
import com.pokemonamethyst.repository.PerfilJogadorRepository;
import com.pokemonamethyst.web.dto.PerfilJogadorResponseDto;
import com.pokemonamethyst.service.PokemonService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/mestre")
public class MestreController {

    private final PerfilJogadorRepository perfilRepository;
    private final PokemonService pokemonService;

    public MestreController(PerfilJogadorRepository perfilRepository, PokemonService pokemonService) {
        this.perfilRepository = perfilRepository;
        this.pokemonService = pokemonService;
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
