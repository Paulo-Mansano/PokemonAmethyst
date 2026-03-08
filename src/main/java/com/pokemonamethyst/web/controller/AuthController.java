package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.domain.Usuario;
import com.pokemonamethyst.security.UsuarioPrincipal;
import com.pokemonamethyst.service.AuthService;
import com.pokemonamethyst.web.dto.UsuarioResponseDto;
import com.pokemonamethyst.web.dto.auth.RegistroRequestDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;

    public AuthController(AuthService authService, AuthenticationManager authenticationManager) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
    }

    @PostMapping("/registro")
    public ResponseEntity<UsuarioResponseDto> registro(@Valid @RequestBody RegistroRequestDto dto) {
        Usuario usuario = authService.registrar(dto.getNomeUsuario(), dto.getSenha(), dto.isMestre());
        return ResponseEntity.status(HttpStatus.CREATED).body(UsuarioResponseDto.from(usuario));
    }

    @PostMapping("/login")
    public ResponseEntity<UsuarioResponseDto> login(@RequestBody RegistroRequestDto dto) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getNomeUsuario(), dto.getSenha()));
        SecurityContextHolder.getContext().setAuthentication(auth);
        UsuarioPrincipal principal = (UsuarioPrincipal) auth.getPrincipal();
        return ResponseEntity.ok(UsuarioResponseDto.from(principal.getUsuario()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        SecurityContextHolder.clearContext();
        return ResponseEntity.noContent().build();
    }
}
