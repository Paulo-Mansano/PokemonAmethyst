package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.CategoriaMovimento;
import com.pokemonamethyst.domain.Tipagem;

public class MovimentoAtualizarRequestDto {

    private String nome;
    private String nomeEn;
    private Tipagem tipo;
    private CategoriaMovimento categoria;
    private Integer custoStamina;
    private String dadoDeDano;
    private String descricaoEfeito;

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getNomeEn() { return nomeEn; }
    public void setNomeEn(String nomeEn) { this.nomeEn = nomeEn; }
    public Tipagem getTipo() { return tipo; }
    public void setTipo(Tipagem tipo) { this.tipo = tipo; }
    public CategoriaMovimento getCategoria() { return categoria; }
    public void setCategoria(CategoriaMovimento categoria) { this.categoria = categoria; }
    public Integer getCustoStamina() { return custoStamina; }
    public void setCustoStamina(Integer custoStamina) { this.custoStamina = custoStamina; }
    public String getDadoDeDano() { return dadoDeDano; }
    public void setDadoDeDano(String dadoDeDano) { this.dadoDeDano = dadoDeDano; }
    public String getDescricaoEfeito() { return descricaoEfeito; }
    public void setDescricaoEfeito(String descricaoEfeito) { this.descricaoEfeito = descricaoEfeito; }
}
