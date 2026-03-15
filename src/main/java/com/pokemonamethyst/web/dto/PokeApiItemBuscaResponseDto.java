package com.pokemonamethyst.web.dto;

public class PokeApiItemBuscaResponseDto {

    private int pokeapiId;
    private String nome;
    private String nomeEn;
    private String descricao;
    private double peso;
    private int preco;
    private boolean jaCadastrado;
    private String itemId;

    public PokeApiItemBuscaResponseDto() {}

    public PokeApiItemBuscaResponseDto(int pokeapiId, String nome, String nomeEn, String descricao,
                                       double peso, int preco, boolean jaCadastrado, String itemId) {
        this.pokeapiId = pokeapiId;
        this.nome = nome;
        this.nomeEn = nomeEn;
        this.descricao = descricao;
        this.peso = peso;
        this.preco = preco;
        this.jaCadastrado = jaCadastrado;
        this.itemId = itemId;
    }

    public int getPokeapiId() { return pokeapiId; }
    public void setPokeapiId(int pokeapiId) { this.pokeapiId = pokeapiId; }
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
    public boolean isJaCadastrado() { return jaCadastrado; }
    public void setJaCadastrado(boolean jaCadastrado) { this.jaCadastrado = jaCadastrado; }
    public String getItemId() { return itemId; }
    public void setItemId(String itemId) { this.itemId = itemId; }
}
