package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.domain.Mochila;
import com.pokemonamethyst.security.UsuarioPrincipal;
import com.pokemonamethyst.service.MochilaService;
import com.pokemonamethyst.service.PerfilJogadorService;
import com.pokemonamethyst.web.dto.MochilaItemRequestDto;
import com.pokemonamethyst.web.dto.MochilaResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/perfis/meu/mochila")
public class MochilaController {

    private final PerfilJogadorService perfilService;
    private final MochilaService mochilaService;

    public MochilaController(PerfilJogadorService perfilService, MochilaService mochilaService) {
        this.perfilService = perfilService;
        this.mochilaService = mochilaService;
    }

    @GetMapping
    public ResponseEntity<MochilaResponseDto> buscar(@AuthenticationPrincipal UsuarioPrincipal principal) {
        String perfilId = perfilService.buscarMeuPerfil(principal.getId()).getId();
        Mochila mochila = mochilaService.buscarPorPerfil(perfilId);
        return ResponseEntity.ok(MochilaResponseDto.from(mochila));
    }

    @PutMapping("/itens")
    public ResponseEntity<MochilaResponseDto> adicionarItem(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @Valid @RequestBody MochilaItemRequestDto dto) {
        String perfilId = perfilService.buscarMeuPerfil(principal.getId()).getId();
        Mochila mochila = mochilaService.adicionarItem(perfilId, dto.getItemId(), dto.getQuantidade());
        return ResponseEntity.ok(MochilaResponseDto.from(mochila));
    }

    @DeleteMapping("/itens/{itemId}")
    public ResponseEntity<MochilaResponseDto> removerItem(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String itemId,
            @RequestParam(defaultValue = "1") int quantidade) {
        String perfilId = perfilService.buscarMeuPerfil(principal.getId()).getId();
        Mochila mochila = mochilaService.removerItem(perfilId, itemId, quantidade);
        return ResponseEntity.ok(MochilaResponseDto.from(mochila));
    }
}
