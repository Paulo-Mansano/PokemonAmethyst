package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.Item;

public class ItemResponseDto {

    private String id;
    private String nome;
    private String descricao;
    private double peso;
    private int preco;

    public ItemResponseDto() {}
    public ItemResponseDto(String id, String nome, String descricao, double peso, int preco) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
        this.peso = peso;
        this.preco = preco;
    }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public double getPeso() { return peso; }
    public void setPeso(double peso) { this.peso = peso; }
    public int getPreco() { return preco; }
    public void setPreco(int preco) { this.preco = preco; }

    public static ItemResponseDto from(Item i) {
        if (i == null) return null;
        return new ItemResponseDto(i.getId(), i.getNome(), i.getDescricao(), i.getPeso(), i.getPreco());
    }
}
