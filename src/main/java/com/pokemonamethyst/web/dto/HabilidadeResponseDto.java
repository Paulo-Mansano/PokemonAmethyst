package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.Habilidade;

public class HabilidadeResponseDto {

    private String id;
    private String nome;
    private String descricao;

    public HabilidadeResponseDto() {}
    public HabilidadeResponseDto(String id, String nome, String descricao) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
    }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }

    public static HabilidadeResponseDto from(Habilidade h) {
        if (h == null) return null;
        return new HabilidadeResponseDto(h.getId(), h.getNome(), h.getDescricao());
    }
}
