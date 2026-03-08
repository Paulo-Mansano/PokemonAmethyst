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
        private int quantidade;
        private double pesoUnitario;

        public MochilaItemDto() {}
        public MochilaItemDto(String itemId, String itemNome, int quantidade, double pesoUnitario) {
            this.itemId = itemId;
            this.itemNome = itemNome;
            this.quantidade = quantidade;
            this.pesoUnitario = pesoUnitario;
        }
        public String getItemId() { return itemId; }
        public void setItemId(String itemId) { this.itemId = itemId; }
        public String getItemNome() { return itemNome; }
        public void setItemNome(String itemNome) { this.itemNome = itemNome; }
        public int getQuantidade() { return quantidade; }
        public void setQuantidade(int quantidade) { this.quantidade = quantidade; }
        public double getPesoUnitario() { return pesoUnitario; }
        public void setPesoUnitario(double pesoUnitario) { this.pesoUnitario = pesoUnitario; }
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
                        mi.getQuantidade(),
                        mi.getItem().getPeso()
                ))
                .collect(Collectors.toList());
        return new MochilaResponseDto(m.getId(), m.getPesoMaximo(), pesoAtual, itens);
    }
}
