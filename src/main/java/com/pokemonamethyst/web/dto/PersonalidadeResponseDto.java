package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.Personalidade;

public class PersonalidadeResponseDto {

    private String id;
    private String nome;

    public PersonalidadeResponseDto() {}
    public PersonalidadeResponseDto(String id, String nome) {
        this.id = id;
        this.nome = nome;
    }

    public static PersonalidadeResponseDto from(Personalidade p) {
        if (p == null) return null;
        return new PersonalidadeResponseDto(p.getId(), p.getNome());
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
}
