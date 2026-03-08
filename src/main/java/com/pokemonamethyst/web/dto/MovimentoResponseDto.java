package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.Movimento;

public class MovimentoResponseDto {

    private String id;
    private String nome;
    private String tipo;
    private String categoria;
    private int custoStamina;
    private String dadoDeDano;
    private String descricaoEfeito;

    public MovimentoResponseDto() {}
    public MovimentoResponseDto(String id, String nome, String tipo, String categoria, int custoStamina, String dadoDeDano, String descricaoEfeito) {
        this.id = id;
        this.nome = nome;
        this.tipo = tipo;
        this.categoria = categoria;
        this.custoStamina = custoStamina;
        this.dadoDeDano = dadoDeDano;
        this.descricaoEfeito = descricaoEfeito;
    }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public int getCustoStamina() { return custoStamina; }
    public void setCustoStamina(int custoStamina) { this.custoStamina = custoStamina; }
    public String getDadoDeDano() { return dadoDeDano; }
    public void setDadoDeDano(String dadoDeDano) { this.dadoDeDano = dadoDeDano; }
    public String getDescricaoEfeito() { return descricaoEfeito; }
    public void setDescricaoEfeito(String descricaoEfeito) { this.descricaoEfeito = descricaoEfeito; }

    public static MovimentoResponseDto from(Movimento m) {
        if (m == null) return null;
        return new MovimentoResponseDto(
                m.getId(),
                m.getNome(),
                m.getTipo() != null ? m.getTipo().name() : null,
                m.getCategoria() != null ? m.getCategoria().name() : null,
                m.getCustoStamina(),
                m.getDadoDeDano(),
                m.getDescricaoEfeito()
        );
    }
}
