package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.Usuario;
import com.pokemonamethyst.exception.RecursoNaoEncontradoException;
import com.pokemonamethyst.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Usuario buscarPorId(String id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));
    }

    public Usuario buscarPorNomeUsuario(String nomeUsuario) {
        return usuarioRepository.findByNomeUsuario(nomeUsuario)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));
    }

    @Transactional
    public Usuario atualizarNomeUsuario(String usuarioId, String novoNomeUsuario) {
        Usuario usuario = buscarPorId(usuarioId);
        if (usuarioRepository.existsByNomeUsuario(novoNomeUsuario) && !novoNomeUsuario.equals(usuario.getNomeUsuario())) {
            throw new com.pokemonamethyst.exception.RegraNegocioException("Nome de usuário já em uso.");
        }
        usuario.setNomeUsuario(novoNomeUsuario);
        return usuarioRepository.save(usuario);
    }

    @Transactional
    public void alterarSenha(String usuarioId, String senhaAtual, String novaSenha) {
        Usuario usuario = buscarPorId(usuarioId);
        if (!passwordEncoder.matches(senhaAtual, usuario.getSenhaHash())) {
            throw new com.pokemonamethyst.exception.RegraNegocioException("Senha atual incorreta.");
        }
        usuario.setSenhaHash(passwordEncoder.encode(novaSenha));
        usuarioRepository.save(usuario);
    }
}
