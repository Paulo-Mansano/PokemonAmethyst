package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.Habilidade;
import com.pokemonamethyst.domain.Item;
import com.pokemonamethyst.domain.Movimento;
import com.pokemonamethyst.exception.RecursoNaoEncontradoException;
import com.pokemonamethyst.repository.HabilidadeRepository;
import com.pokemonamethyst.repository.ItemRepository;
import com.pokemonamethyst.repository.MovimentoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CatalogoService {

    private final MovimentoRepository movimentoRepository;
    private final HabilidadeRepository habilidadeRepository;
    private final ItemRepository itemRepository;

    public CatalogoService(MovimentoRepository movimentoRepository, HabilidadeRepository habilidadeRepository,
                           ItemRepository itemRepository) {
        this.movimentoRepository = movimentoRepository;
        this.habilidadeRepository = habilidadeRepository;
        this.itemRepository = itemRepository;
    }

    public List<Movimento> listarMovimentos() {
        return movimentoRepository.findAllByOrderByNome();
    }

    public Movimento buscarMovimento(String id) {
        return movimentoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Movimento não encontrado."));
    }

    public List<Habilidade> listarHabilidades() {
        return habilidadeRepository.findAllByOrderByNome();
    }

    public Habilidade buscarHabilidade(String id) {
        return habilidadeRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Habilidade não encontrada."));
    }

    public List<Item> listarItens() {
        return itemRepository.findAllByOrderByNome();
    }

    public Item buscarItem(String id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Item não encontrado."));
    }

    @Transactional
    public Item criarItem(String nome, String nomeEn, String descricao, Double peso, Integer preco, String imagemUrl) {
        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("Nome do item é obrigatório.");
        }
        Item item = new Item();
        item.setNome(nome.trim());
        item.setNomeEn(nomeEn != null && !nomeEn.isBlank() ? nomeEn.trim() : null);
        item.setDescricao(descricao != null && !descricao.isBlank() ? descricao.trim() : null);
        item.setPeso(peso != null ? peso : 0);
        item.setPreco(preco != null ? preco : 0);
        item.setImagemUrl(imagemUrl != null && !imagemUrl.isBlank() ? imagemUrl.trim() : null);
        return itemRepository.save(item);
    }

    @Transactional
    public Item atualizarItem(String id, String nome, String nomeEn, String descricao, Double peso, Integer preco, String imagemUrl) {
        Item item = buscarItem(id);
        if (nome != null && !nome.isBlank()) item.setNome(nome);
        if (nomeEn != null) item.setNomeEn(nomeEn.isBlank() ? null : nomeEn);
        if (descricao != null) item.setDescricao(descricao);
        if (peso != null) item.setPeso(peso);
        if (preco != null) item.setPreco(preco);
        if (imagemUrl != null) item.setImagemUrl(imagemUrl.isBlank() ? null : imagemUrl);
        return itemRepository.save(item);
    }
}
