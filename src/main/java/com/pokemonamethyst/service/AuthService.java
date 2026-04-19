package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.Usuario;
import com.pokemonamethyst.exception.RegraNegocioException;
import com.pokemonamethyst.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Usuario registrar(String nomeUsuario, String senha, boolean isMestre) {
        if (usuarioRepository.existsByNomeUsuario(nomeUsuario)) {
            throw new RegraNegocioException("Nome de usuário já cadastrado.");
        }
        if (isMestre) {
            throw new RegraNegocioException("Cadastro de conta de mestre não é permitido.");
        }
        Usuario usuario = new Usuario();
        usuario.setNomeUsuario(nomeUsuario);
        usuario.setSenhaHash(passwordEncoder.encode(senha));
        usuario.setMestre(false);
        return usuarioRepository.save(usuario);
    }
}
