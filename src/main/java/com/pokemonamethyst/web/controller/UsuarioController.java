package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.domain.Usuario;
import com.pokemonamethyst.security.UsuarioPrincipal;
import com.pokemonamethyst.service.UsuarioService;
import com.pokemonamethyst.web.dto.AlterarSenhaRequestDto;
import com.pokemonamethyst.web.dto.UsuarioResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping("/eu")
    public ResponseEntity<UsuarioResponseDto> eu(@AuthenticationPrincipal UsuarioPrincipal principal) {
        Usuario usuario = usuarioService.buscarPorId(principal.getId());
        return ResponseEntity.ok(UsuarioResponseDto.from(usuario));
    }

    @PatchMapping("/eu")
    public ResponseEntity<UsuarioResponseDto> atualizarNomeUsuario(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @RequestBody Map<String, String> body) {
        String novoNomeUsuario = body.get("nomeUsuario");
        if (novoNomeUsuario == null || novoNomeUsuario.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Usuario usuario = usuarioService.atualizarNomeUsuario(principal.getId(), novoNomeUsuario);
        return ResponseEntity.ok(UsuarioResponseDto.from(usuario));
    }

    @PostMapping("/eu/senha")
    public ResponseEntity<Void> alterarSenha(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @Valid @RequestBody AlterarSenhaRequestDto dto) {
        usuarioService.alterarSenha(principal.getId(), dto.getSenhaAtual(), dto.getNovaSenha());
        return ResponseEntity.noContent().build();
    }
}
