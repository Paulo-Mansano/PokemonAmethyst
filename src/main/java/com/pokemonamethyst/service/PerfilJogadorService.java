package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.*;
import com.pokemonamethyst.exception.RecursoNaoEncontradoException;
import com.pokemonamethyst.repository.PerfilJogadorRepository;
import com.pokemonamethyst.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PerfilJogadorService {

    private static final int PESO_MAXIMO_MOCHILA_PADRAO = 50;
    private static final int HP_STAMINA_INICIAL = 10;
    private static final String PERFIL_NOME_PADRAO = "Treinador";

    private final PerfilJogadorRepository perfilRepository;
    private final UsuarioRepository usuarioRepository;

    public PerfilJogadorService(PerfilJogadorRepository perfilRepository, UsuarioRepository usuarioRepository) {
        this.perfilRepository = perfilRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public PerfilJogador buscarPorUsuarioId(String usuarioId) {
        return perfilRepository.findByUsuarioId(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Perfil do jogador não encontrado."));
    }

    public PerfilJogador buscarPorId(String id) {
        return perfilRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Perfil do jogador não encontrado."));
    }

    /**
     * Retorna o perfil do jogador, criando um com valores padrão se ainda não existir (lazy).
     */
    @Transactional
    public PerfilJogador buscarMeuPerfil(String usuarioId) {
        return perfilRepository.findByUsuarioIdWithMochila(usuarioId)
                .orElseGet(() -> {
                    criarOuAtualizar(usuarioId, PERFIL_NOME_PADRAO, ClasseJogador.TREINADOR,
                            null, null, null, null, null, null, null);
                    return perfilRepository.findByUsuarioIdWithMochila(usuarioId)
                            .orElseThrow(() -> new RecursoNaoEncontradoException("Perfil do jogador não encontrado."));
                });
    }

    @Transactional
    public PerfilJogador criarOuAtualizar(String usuarioId, String nomePersonagem, ClasseJogador classe,
                                          Integer pokedolares, Integer nivel, Integer xpAtual,
                                          Integer hpMaximo, Integer staminaMaxima,
                                          Integer habilidade, Atributos atributos) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));

        PerfilJogador perfil = perfilRepository.findByUsuarioId(usuarioId).orElse(null);
        if (perfil == null) {
            perfil = new PerfilJogador();
            perfil.setUsuario(usuario);
            perfil.setHpMaximo(HP_STAMINA_INICIAL);
            perfil.setStaminaMaxima(HP_STAMINA_INICIAL);
            Mochila mochila = new Mochila();
            mochila.setPesoMaximo(PESO_MAXIMO_MOCHILA_PADRAO);
            perfil.setMochila(mochila);
            if (atributos == null) {
                perfil.setAtributos(new Atributos());
            }
        }

        if (nomePersonagem != null) perfil.setNomePersonagem(nomePersonagem);
        if (classe != null) perfil.setClasse(classe);
        if (pokedolares != null) perfil.setPokedolares(pokedolares);
        if (nivel != null) perfil.setNivel(nivel);
        if (xpAtual != null) perfil.setXpAtual(xpAtual);
        if (hpMaximo != null) perfil.setHpMaximo(hpMaximo);
        if (staminaMaxima != null) perfil.setStaminaMaxima(staminaMaxima);
        if (habilidade != null) perfil.setHabilidade(habilidade);
        if (atributos != null) perfil.setAtributos(atributos);

        return perfilRepository.save(perfil);
    }
}
