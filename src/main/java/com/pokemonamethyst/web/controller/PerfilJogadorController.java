package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.domain.Atributos;
import com.pokemonamethyst.domain.PerfilJogador;
import com.pokemonamethyst.security.UsuarioPrincipal;
import com.pokemonamethyst.service.PerfilJogadorService;
import com.pokemonamethyst.service.PokemonService;
import com.pokemonamethyst.web.dto.PerfilJogadorRequestDto;
import com.pokemonamethyst.web.dto.PerfilJogadorResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/perfis")
public class PerfilJogadorController {

    private final PerfilJogadorService perfilService;
    private final PokemonService pokemonService;

    public PerfilJogadorController(PerfilJogadorService perfilService, PokemonService pokemonService) {
        this.perfilService = perfilService;
        this.pokemonService = pokemonService;
    }

    @GetMapping("/meu")
    @Transactional(readOnly = true)
    public ResponseEntity<PerfilJogadorResponseDto> meuPerfil(@AuthenticationPrincipal UsuarioPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        PerfilJogador perfil = perfilService.buscarMeuPerfil(principal.getId());
        List<com.pokemonamethyst.domain.Pokemon> time = pokemonService.listarTimePrincipal(perfil.getId());
        List<com.pokemonamethyst.domain.Pokemon> box = pokemonService.listarBox(perfil.getId());
        return ResponseEntity.ok(PerfilJogadorResponseDto.from(perfil, time, box));
    }

    @PutMapping("/meu")
    @Transactional
    public ResponseEntity<PerfilJogadorResponseDto> criarOuAtualizar(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @Valid @RequestBody PerfilJogadorRequestDto dto) {
        Atributos atr = dto.getAtributos() != null ? dto.getAtributos().toEntity() : null;
        PerfilJogador perfil = perfilService.criarOuAtualizar(
                principal.getId(),
                dto.getNomePersonagem(),
                dto.getClasse(),
                dto.getPokedolares(),
                dto.getNivel(),
                dto.getXpAtual(),
                dto.getHpMaximo(),
                dto.getHpAtual(),
                dto.getStaminaMaxima(),
                dto.getStaminaAtual(),
                dto.getHabilidade(),
                atr
        );
        List<com.pokemonamethyst.domain.Pokemon> time = pokemonService.listarTimePrincipal(perfil.getId());
        List<com.pokemonamethyst.domain.Pokemon> box = pokemonService.listarBox(perfil.getId());
        return ResponseEntity.ok(PerfilJogadorResponseDto.from(perfil, time, box));
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<PerfilJogadorResponseDto> buscarPorId(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id) {
        PerfilJogador perfil = perfilService.buscarPorId(id);
        if (!perfil.getUsuario().getId().equals(principal.getId()) && !principal.isMestre()) {
            return ResponseEntity.status(403).build();
        }
        List<com.pokemonamethyst.domain.Pokemon> time = pokemonService.listarTimePrincipal(perfil.getId());
        List<com.pokemonamethyst.domain.Pokemon> box = pokemonService.listarBox(perfil.getId());
        return ResponseEntity.ok(PerfilJogadorResponseDto.from(perfil, time, box));
    }
}
