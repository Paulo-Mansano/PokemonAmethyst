package com.pokemonamethyst.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "item")
public class Item {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false)
    private String nome;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    private double peso;
    private int preco;

    @Column(name = "pokeapi_id", unique = true)
    private Integer pokeapiId;

    @Column(name = "nome_en")
    private String nomeEn;

    @Column(name = "imagem_url", length = 512)
    private String imagemUrl;

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
    public Integer getPokeapiId() { return pokeapiId; }
    public void setPokeapiId(Integer pokeapiId) { this.pokeapiId = pokeapiId; }
    public String getNomeEn() { return nomeEn; }
    public void setNomeEn(String nomeEn) { this.nomeEn = nomeEn; }
    public String getImagemUrl() { return imagemUrl; }
    public void setImagemUrl(String imagemUrl) { this.imagemUrl = imagemUrl; }
}
