package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.Item;
import com.pokemonamethyst.domain.Mochila;
import com.pokemonamethyst.domain.MochilaItem;
import com.pokemonamethyst.exception.RecursoNaoEncontradoException;
import com.pokemonamethyst.exception.RegraNegocioException;
import com.pokemonamethyst.repository.ItemRepository;
import com.pokemonamethyst.repository.MochilaItemRepository;
import com.pokemonamethyst.repository.MochilaRepository;
import com.pokemonamethyst.repository.PerfilJogadorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MochilaService {

    private final PerfilJogadorRepository perfilRepository;
    private final MochilaRepository mochilaRepository;
    private final MochilaItemRepository mochilaItemRepository;
    private final ItemRepository itemRepository;

    public MochilaService(PerfilJogadorRepository perfilRepository, MochilaRepository mochilaRepository,
                         MochilaItemRepository mochilaItemRepository, ItemRepository itemRepository) {
        this.perfilRepository = perfilRepository;
        this.mochilaRepository = mochilaRepository;
        this.mochilaItemRepository = mochilaItemRepository;
        this.itemRepository = itemRepository;
    }

    public Mochila buscarPorPerfil(String perfilId) {
        var perfil = perfilRepository.findByIdWithPokemons(perfilId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Perfil não encontrado."));
        if (perfil.getMochila() == null) {
            throw new RecursoNaoEncontradoException("Mochila não encontrada.");
        }
        return mochilaRepository.findByIdWithConteudos(perfil.getMochila().getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Mochila não encontrada."));
    }

    @Transactional
    public Mochila adicionarItem(String perfilId, String itemId, int quantidade) {
        if (quantidade <= 0) {
            throw new RegraNegocioException("Quantidade deve ser positiva.");
        }
        Mochila mochila = buscarPorPerfil(perfilId);
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Item não encontrado."));

        double pesoAtual = mochila.getConteudos().stream()
                .mapToDouble(mi -> mi.getItem().getPeso() * mi.getQuantidade())
                .sum();
        double pesoNovo = pesoAtual + item.getPeso() * quantidade;
        if (pesoNovo > mochila.getPesoMaximo()) {
            throw new RegraNegocioException("Peso máximo da mochila excedido.");
        }

        MochilaItem existente = mochilaItemRepository.findByMochilaIdAndItemId(mochila.getId(), itemId).orElse(null);
        if (existente != null) {
            existente.setQuantidade(existente.getQuantidade() + quantidade);
            mochilaItemRepository.save(existente);
        } else {
            MochilaItem novo = new MochilaItem();
            novo.setMochila(mochila);
            novo.setItem(item);
            novo.setQuantidade(quantidade);
            mochilaItemRepository.save(novo);
            mochila.getConteudos().add(novo);
        }
        return mochilaRepository.findByIdWithConteudos(mochila.getId()).orElse(mochila);
    }

    @Transactional
    public Mochila removerItem(String perfilId, String itemId, int quantidade) {
        if (quantidade <= 0) {
            throw new RegraNegocioException("Quantidade deve ser positiva.");
        }
        Mochila mochila = buscarPorPerfil(perfilId);
        MochilaItem mi = mochilaItemRepository.findByMochilaIdAndItemId(mochila.getId(), itemId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Item não está na mochila."));
        if (mi.getQuantidade() < quantidade) {
            throw new RegraNegocioException("Quantidade insuficiente na mochila.");
        }
        mi.setQuantidade(mi.getQuantidade() - quantidade);
        if (mi.getQuantidade() == 0) {
            mochila.getConteudos().remove(mi);
            mochilaItemRepository.delete(mi);
        } else {
            mochilaItemRepository.save(mi);
        }
        return mochilaRepository.findByIdWithConteudos(mochila.getId()).orElse(mochila);
    }
}
