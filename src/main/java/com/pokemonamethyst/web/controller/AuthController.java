package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.domain.Usuario;
import com.pokemonamethyst.security.UsuarioPrincipal;
import com.pokemonamethyst.service.AuthService;
import com.pokemonamethyst.web.dto.UsuarioResponseDto;
import com.pokemonamethyst.web.dto.auth.RegistroRequestDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final Duration sessionTimeout;

    public AuthController(AuthService authService, AuthenticationManager authenticationManager,
                          SecurityContextRepository securityContextRepository,
                          @Value("${server.servlet.session.timeout}") Duration sessionTimeout) {
        this.authService = authService;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.sessionTimeout = sessionTimeout;
    }

    @PostMapping("/registro")
    public ResponseEntity<UsuarioResponseDto> registro(@Valid @RequestBody RegistroRequestDto dto) {
        Usuario usuario = authService.registrar(dto.getNomeUsuario(), dto.getSenha(), dto.isMestre());
        return ResponseEntity.status(HttpStatus.CREATED).body(UsuarioResponseDto.from(usuario));
    }

    @PostMapping("/login")
    public ResponseEntity<UsuarioResponseDto> login(@Valid @RequestBody RegistroRequestDto dto,
                                                    HttpServletRequest request,
                                                    HttpServletResponse response) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getNomeUsuario(), dto.getSenha()));
        SecurityContextHolder.getContext().setAuthentication(auth);
        securityContextRepository.saveContext(SecurityContextHolder.getContext(), request, response);
        HttpSession session = request.getSession(true);
        session.setMaxInactiveInterval((int) Math.min(sessionTimeout.getSeconds(), Integer.MAX_VALUE));
        UsuarioPrincipal principal = (UsuarioPrincipal) auth.getPrincipal();
        return ResponseEntity.ok(UsuarioResponseDto.from(principal.getUsuario()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        SecurityContextHolder.clearContext();
        securityContextRepository.saveContext(SecurityContextHolder.getContext(), request, response);
        return ResponseEntity.noContent().build();
    }
}
