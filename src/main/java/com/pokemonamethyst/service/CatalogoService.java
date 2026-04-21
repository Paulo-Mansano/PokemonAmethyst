package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.CategoriaMovimento;
import com.pokemonamethyst.domain.Habilidade;
import com.pokemonamethyst.domain.Item;
import com.pokemonamethyst.domain.Movimento;
import com.pokemonamethyst.domain.Personalidade;
import com.pokemonamethyst.domain.Tipagem;
import com.pokemonamethyst.exception.RecursoNaoEncontradoException;
import com.pokemonamethyst.repository.HabilidadeRepository;
import com.pokemonamethyst.repository.ItemRepository;
import com.pokemonamethyst.repository.MochilaItemRepository;
import com.pokemonamethyst.repository.MovimentoRepository;
import com.pokemonamethyst.repository.PersonalidadeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CatalogoService {

    private final MovimentoRepository movimentoRepository;
    private final HabilidadeRepository habilidadeRepository;
    private final ItemRepository itemRepository;
    private final MochilaItemRepository mochilaItemRepository;
    private final PersonalidadeRepository personalidadeRepository;

    public CatalogoService(MovimentoRepository movimentoRepository, HabilidadeRepository habilidadeRepository,
                           ItemRepository itemRepository, MochilaItemRepository mochilaItemRepository,
                           PersonalidadeRepository personalidadeRepository) {
        this.movimentoRepository = movimentoRepository;
        this.habilidadeRepository = habilidadeRepository;
        this.itemRepository = itemRepository;
        this.mochilaItemRepository = mochilaItemRepository;
        this.personalidadeRepository = personalidadeRepository;
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

    @Transactional
    public Habilidade criarHabilidade(String nome, String nomeEn, String descricao) {
        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("Nome da habilidade é obrigatório.");
        }
        Habilidade h = new Habilidade();
        h.setNome(nome.trim());
        h.setNomeEn(nomeEn != null && !nomeEn.isBlank() ? nomeEn.trim() : null);
        h.setDescricao(descricao != null && !descricao.isBlank() ? descricao.trim() : null);
        return habilidadeRepository.save(h);
    }

    @Transactional
    public Habilidade atualizarHabilidade(String id, String nome, String nomeEn, String descricao) {
        Habilidade h = buscarHabilidade(id);
        if (nome != null && !nome.isBlank()) h.setNome(nome);
        if (nomeEn != null) h.setNomeEn(nomeEn.isBlank() ? null : nomeEn);
        if (descricao != null) h.setDescricao(descricao);
        return habilidadeRepository.save(h);
    }

    @Transactional
    public Movimento criarMovimento(String nome, String nomeEn, Tipagem tipo, CategoriaMovimento categoria,
                                    Integer custoStamina, String dadoDeDano, String descricaoEfeito) {
        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("Nome do movimento é obrigatório.");
        }
        if (tipo == null) {
            throw new IllegalArgumentException("Tipo do movimento é obrigatório.");
        }
        Movimento m = new Movimento();
        m.setNome(nome.trim());
        m.setNomeEn(nomeEn != null && !nomeEn.isBlank() ? nomeEn.trim() : null);
        m.setTipo(tipo);
        m.setCategoria(categoria);
        m.setCustoStamina(custoStamina != null ? custoStamina : 0);
        m.setDadoDeDano(dadoDeDano != null && !dadoDeDano.isBlank() ? dadoDeDano.trim() : null);
        m.setDescricaoEfeito(descricaoEfeito != null && !descricaoEfeito.isBlank() ? descricaoEfeito.trim() : null);
        return movimentoRepository.save(m);
    }

    @Transactional
    public Movimento atualizarMovimento(String id, String nome, String nomeEn, Tipagem tipo, CategoriaMovimento categoria,
                                        Integer custoStamina, String dadoDeDano, String descricaoEfeito) {
        Movimento m = buscarMovimento(id);
        if (nome != null && !nome.isBlank()) m.setNome(nome);
        if (nomeEn != null) m.setNomeEn(nomeEn.isBlank() ? null : nomeEn);
        if (tipo != null) m.setTipo(tipo);
        if (categoria != null) m.setCategoria(categoria);
        if (custoStamina != null) m.setCustoStamina(custoStamina);
        if (dadoDeDano != null) m.setDadoDeDano(dadoDeDano.isBlank() ? null : dadoDeDano);
        if (descricaoEfeito != null) m.setDescricaoEfeito(descricaoEfeito);
        return movimentoRepository.save(m);
    }

    public List<Personalidade> listarPersonalidades() {
        return personalidadeRepository.findAllByOrderByNome();
    }

    public Personalidade buscarPersonalidade(String id) {
        return personalidadeRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Personalidade não encontrada."));
    }

    @Transactional
    public Personalidade criarPersonalidade(String nome) {
        if (nome == null || nome.isBlank()) {
            throw new IllegalArgumentException("Nome da personalidade é obrigatório.");
        }
        Personalidade p = new Personalidade();
        p.setNome(nome.trim());
        return personalidadeRepository.save(p);
    }

    @Transactional
    public Personalidade atualizarPersonalidade(String id, String nome) {
        Personalidade p = buscarPersonalidade(id);
        if (nome != null && !nome.isBlank()) p.setNome(nome);
        return personalidadeRepository.save(p);
    }

    public List<Item> listarItens() {
        return itemRepository.findAllByOrderByNome();
    }

    public List<Item> listarItensPorCategoria(String categoria) {
        if (categoria == null || categoria.isBlank()) {
            throw new IllegalArgumentException("Categoria do item é obrigatória.");
        }
        return itemRepository.findAllByCategoriaIgnoreCaseOrderByNome(categoria.trim());
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

    @Transactional
    public void excluirItem(String id) {
        Item item = buscarItem(id);
        mochilaItemRepository.deleteAllByItemId(item.getId());
        itemRepository.delete(item);
    }
}
