package com.pokemonamethyst.domain;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "movimento")
public class Movimento {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private String id = UUID.randomUUID().toString();

    @Column(nullable = false)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Tipagem tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private CategoriaMovimento categoria;

    private int custoStamina;

    @Column(name = "dado_de_dano")
    private String dadoDeDano;

    @Column(name = "descricao_efeito", columnDefinition = "TEXT")
    private String descricaoEfeito;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public Tipagem getTipo() { return tipo; }
    public void setTipo(Tipagem tipo) { this.tipo = tipo; }
    public CategoriaMovimento getCategoria() { return categoria; }
    public void setCategoria(CategoriaMovimento categoria) { this.categoria = categoria; }
    public int getCustoStamina() { return custoStamina; }
    public void setCustoStamina(int custoStamina) { this.custoStamina = custoStamina; }
    public String getDadoDeDano() { return dadoDeDano; }
    public void setDadoDeDano(String dadoDeDano) { this.dadoDeDano = dadoDeDano; }
    public String getDescricaoEfeito() { return descricaoEfeito; }
    public void setDescricaoEfeito(String descricaoEfeito) { this.descricaoEfeito = descricaoEfeito; }
}
