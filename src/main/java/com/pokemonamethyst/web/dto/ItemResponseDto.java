package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.Item;

public class ItemResponseDto {

    private String id;
    private String nome;
    private String nomeEn;
    private String descricao;
    private double peso;
    private int preco;
    private String imagemUrl;
    private String categoria;

    public ItemResponseDto() {}
    public ItemResponseDto(String id, String nome, String nomeEn, String descricao, double peso, int preco, String imagemUrl, String categoria) {
        this.id = id;
        this.nome = nome;
        this.nomeEn = nomeEn;
        this.descricao = descricao;
        this.peso = peso;
        this.preco = preco;
        this.imagemUrl = imagemUrl;
        this.categoria = categoria;
    }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getNomeEn() { return nomeEn; }
    public void setNomeEn(String nomeEn) { this.nomeEn = nomeEn; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public double getPeso() { return peso; }
    public void setPeso(double peso) { this.peso = peso; }
    public int getPreco() { return preco; }
    public void setPreco(int preco) { this.preco = preco; }
    public String getImagemUrl() { return imagemUrl; }
    public void setImagemUrl(String imagemUrl) { this.imagemUrl = imagemUrl; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public static ItemResponseDto from(Item i) {
        if (i == null) return null;
        return new ItemResponseDto(i.getId(), i.getNome(), i.getNomeEn(), i.getDescricao(), i.getPeso(), i.getPreco(), i.getImagemUrl(), i.getCategoria());
    }
}
