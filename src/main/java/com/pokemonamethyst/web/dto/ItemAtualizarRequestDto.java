package com.pokemonamethyst.web.dto;

public class ItemAtualizarRequestDto {

    private String nome;
    private String nomeEn;
    private String descricao;
    private Double peso;
    private Integer preco;
    private String imagemUrl;

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getNomeEn() { return nomeEn; }
    public void setNomeEn(String nomeEn) { this.nomeEn = nomeEn; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public Double getPeso() { return peso; }
    public void setPeso(Double peso) { this.peso = peso; }
    public Integer getPreco() { return preco; }
    public void setPreco(Integer preco) { this.preco = preco; }
    public String getImagemUrl() { return imagemUrl; }
    public void setImagemUrl(String imagemUrl) { this.imagemUrl = imagemUrl; }
}
