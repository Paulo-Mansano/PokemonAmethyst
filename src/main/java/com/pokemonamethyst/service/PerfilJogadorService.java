package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.*;
import com.pokemonamethyst.exception.RecursoNaoEncontradoException;
import com.pokemonamethyst.exception.RegraNegocioException;
import com.pokemonamethyst.repository.PerfilJogadorRepository;
import com.pokemonamethyst.security.UsuarioPrincipal;
import com.pokemonamethyst.repository.UsuarioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PerfilJogadorService {

    private static final int PESO_MAXIMO_MOCHILA_PADRAO = 50;
    private static final int HP_STAMINA_INICIAL = 10;
    private static final String PERFIL_NOME_PADRAO = "Treinador";
    private static final int MIN_ATRIBUTO = 1;
    private static final int HABILIDADE_INICIAL = 1;

    private static Atributos atributosIniciais() {
        return new Atributos(
                MIN_ATRIBUTO, MIN_ATRIBUTO,
                MIN_ATRIBUTO, MIN_ATRIBUTO,
                MIN_ATRIBUTO, MIN_ATRIBUTO,
                MIN_ATRIBUTO, MIN_ATRIBUTO
        );
    }

    private static Atributos normalizarAtributos(Atributos atributos) {
        if (atributos == null) return null;
        return new Atributos(
                Math.max(MIN_ATRIBUTO, atributos.getForca()),
                Math.max(MIN_ATRIBUTO, atributos.getSpeed()),
                Math.max(MIN_ATRIBUTO, atributos.getInteligencia()),
                Math.max(MIN_ATRIBUTO, atributos.getTecnica()),
                Math.max(MIN_ATRIBUTO, atributos.getSabedoria()),
                Math.max(MIN_ATRIBUTO, atributos.getPercepcao()),
                Math.max(MIN_ATRIBUTO, atributos.getDominio()),
                Math.max(MIN_ATRIBUTO, atributos.getRespeito())
        );
    }

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
     * Resolve qual perfil está em contexto: jogador sempre o próprio; mestre exige {@code playerId} (id do perfil alvo).
     * Valores de {@code playerIdFromRequest} vindos de não-mestres são ignorados.
     */
    public PerfilJogador obterPerfilAlvo(UsuarioPrincipal principal, String playerIdFromRequest) {
        if (!principal.isMestre()) {
            return buscarMeuPerfil(principal.getId());
        }
        if (playerIdFromRequest == null || playerIdFromRequest.isBlank()) {
            throw new RegraNegocioException("Mestre precisa informar playerId.");
        }
        return buscarPorId(playerIdFromRequest.trim());
    }

    public String resolvePerfilId(UsuarioPrincipal principal, String playerIdFromRequest) {
        return obterPerfilAlvo(principal, playerIdFromRequest).getId();
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
            perfil.setHabilidade(HABILIDADE_INICIAL);
            Mochila mochila = new Mochila();
            mochila.setPesoMaximo(PESO_MAXIMO_MOCHILA_PADRAO);
            perfil.setMochila(mochila);
            perfil.setAtributos(atributos == null ? atributosIniciais() : normalizarAtributos(atributos));
        }

        if (nomePersonagem != null) perfil.setNomePersonagem(nomePersonagem);
        if (classe != null) perfil.setClasse(classe);
        if (pokedolares != null) perfil.setPokedolares(pokedolares);
        if (nivel != null) perfil.setNivel(nivel);
        if (xpAtual != null) perfil.setXpAtual(xpAtual);
        if (hpMaximo != null) perfil.setHpMaximo(hpMaximo);
        if (staminaMaxima != null) perfil.setStaminaMaxima(staminaMaxima);
        if (habilidade != null) perfil.setHabilidade(Math.max(HABILIDADE_INICIAL, habilidade));
        if (atributos != null) perfil.setAtributos(normalizarAtributos(atributos));

        return perfilRepository.save(perfil);
    }
}
