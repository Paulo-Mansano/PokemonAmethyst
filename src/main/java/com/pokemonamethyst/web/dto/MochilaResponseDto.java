package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.Mochila;
import com.pokemonamethyst.domain.MochilaItem;

import java.util.List;
import java.util.stream.Collectors;

public class MochilaResponseDto {

    private String id;
    private double pesoMaximo;
    private double pesoAtual;
    private List<MochilaItemDto> itens;

    public static class MochilaItemDto {
        private String itemId;
        private String itemNome;
        private String itemNomeEn;
        private String descricao;
        private double pesoUnitario;
        private int preco;
        private String imagemUrl;
        private int quantidade;

        public MochilaItemDto() {}
        public MochilaItemDto(String itemId, String itemNome, String itemNomeEn, String descricao,
                              double pesoUnitario, int preco, String imagemUrl, int quantidade) {
            this.itemId = itemId;
            this.itemNome = itemNome;
            this.itemNomeEn = itemNomeEn;
            this.descricao = descricao;
            this.pesoUnitario = pesoUnitario;
            this.preco = preco;
            this.imagemUrl = imagemUrl;
            this.quantidade = quantidade;
        }
        public String getItemId() { return itemId; }
        public void setItemId(String itemId) { this.itemId = itemId; }
        public String getItemNome() { return itemNome; }
        public void setItemNome(String itemNome) { this.itemNome = itemNome; }
        public String getItemNomeEn() { return itemNomeEn; }
        public void setItemNomeEn(String itemNomeEn) { this.itemNomeEn = itemNomeEn; }
        public String getDescricao() { return descricao; }
        public void setDescricao(String descricao) { this.descricao = descricao; }
        public double getPesoUnitario() { return pesoUnitario; }
        public void setPesoUnitario(double pesoUnitario) { this.pesoUnitario = pesoUnitario; }
        public int getPreco() { return preco; }
        public void setPreco(int preco) { this.preco = preco; }
        public String getImagemUrl() { return imagemUrl; }
        public void setImagemUrl(String imagemUrl) { this.imagemUrl = imagemUrl; }
        public int getQuantidade() { return quantidade; }
        public void setQuantidade(int quantidade) { this.quantidade = quantidade; }
    }

    public MochilaResponseDto() {}
    public MochilaResponseDto(String id, double pesoMaximo, double pesoAtual, List<MochilaItemDto> itens) {
        this.id = id;
        this.pesoMaximo = pesoMaximo;
        this.pesoAtual = pesoAtual;
        this.itens = itens;
    }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public double getPesoMaximo() { return pesoMaximo; }
    public void setPesoMaximo(double pesoMaximo) { this.pesoMaximo = pesoMaximo; }
    public double getPesoAtual() { return pesoAtual; }
    public void setPesoAtual(double pesoAtual) { this.pesoAtual = pesoAtual; }
    public List<MochilaItemDto> getItens() { return itens; }
    public void setItens(List<MochilaItemDto> itens) { this.itens = itens; }

    public static MochilaResponseDto from(Mochila m) {
        if (m == null) return null;
        double pesoAtual = m.getConteudos().stream()
                .mapToDouble(mi -> mi.getItem().getPeso() * mi.getQuantidade())
                .sum();
        List<MochilaItemDto> itens = m.getConteudos().stream()
                .map(mi -> new MochilaItemDto(
                        mi.getItem().getId(),
                        mi.getItem().getNome(),
                        mi.getItem().getNomeEn(),
                        mi.getItem().getDescricao(),
                        mi.getItem().getPeso(),
                        mi.getItem().getPreco(),
                        mi.getItem().getImagemUrl(),
                        mi.getQuantidade()
                ))
                .collect(Collectors.toList());
        return new MochilaResponseDto(m.getId(), m.getPesoMaximo(), pesoAtual, itens);
    }
}
