package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.domain.Mochila;
import com.pokemonamethyst.repository.ItemRepository;
import com.pokemonamethyst.security.UsuarioPrincipal;
import com.pokemonamethyst.service.AuditLogService;
import com.pokemonamethyst.service.MochilaService;
import com.pokemonamethyst.service.PerfilJogadorService;
import com.pokemonamethyst.web.dto.MochilaItemRequestDto;
import com.pokemonamethyst.web.dto.MochilaResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/perfis/meu/mochila")
public class MochilaController {

    private final PerfilJogadorService perfilService;
    private final MochilaService mochilaService;
    private final ItemRepository itemRepository;
    private final AuditLogService auditLogService;

    public MochilaController(PerfilJogadorService perfilService, MochilaService mochilaService,
                             ItemRepository itemRepository, AuditLogService auditLogService) {
        this.perfilService = perfilService;
        this.mochilaService = mochilaService;
        this.itemRepository = itemRepository;
        this.auditLogService = auditLogService;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<MochilaResponseDto> buscar(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @RequestParam(value = "playerId", required = false) String playerId) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        Mochila mochila = mochilaService.buscarPorPerfil(perfilId);
        return ResponseEntity.ok(MochilaResponseDto.from(mochila));
    }

    @PutMapping("/itens")
    @Transactional
    public ResponseEntity<MochilaResponseDto> adicionarItem(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @RequestParam(value = "playerId", required = false) String playerId,
            @Valid @RequestBody MochilaItemRequestDto dto) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        String nomeItem = itemRepository.findById(dto.getItemId())
            .map(i -> i.getNome()).orElse(dto.getItemId());
        Mochila mochila = mochilaService.adicionarItem(perfilId, dto.getItemId(), dto.getQuantidade());
        auditLogService.registrar(principal.getId(), principal.getUsername(), "ITEM_ADICIONADO",
            "MOCHILA", perfilId,
            "'" + nomeItem + "' x" + dto.getQuantidade());
        return ResponseEntity.ok(MochilaResponseDto.from(mochila));
    }

    @DeleteMapping("/itens/{itemId}")
    @Transactional
    public ResponseEntity<MochilaResponseDto> removerItem(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String itemId,
            @RequestParam(defaultValue = "1") int quantidade,
            @RequestParam(value = "playerId", required = false) String playerId) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        String nomeItem = itemRepository.findById(itemId)
            .map(i -> i.getNome()).orElse(itemId);
        Mochila mochila = mochilaService.removerItem(perfilId, itemId, quantidade);
        auditLogService.registrar(principal.getId(), principal.getUsername(), "ITEM_REMOVIDO",
            "MOCHILA", perfilId,
            "'" + nomeItem + "' x" + quantidade);
        return ResponseEntity.ok(MochilaResponseDto.from(mochila));
    }
}
