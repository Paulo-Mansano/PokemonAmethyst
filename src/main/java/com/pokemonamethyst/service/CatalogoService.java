package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.Habilidade;
import com.pokemonamethyst.domain.Item;
import com.pokemonamethyst.domain.Movimento;
import com.pokemonamethyst.exception.RecursoNaoEncontradoException;
import com.pokemonamethyst.repository.HabilidadeRepository;
import com.pokemonamethyst.repository.ItemRepository;
import com.pokemonamethyst.repository.MovimentoRepository;
import org.springframework.stereotype.Service;

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
}
