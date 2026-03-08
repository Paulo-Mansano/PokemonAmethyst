package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.Usuario;

public class UsuarioResponseDto {

    private String id;
    private String nomeUsuario;
    private boolean mestre;

    public UsuarioResponseDto() {}
    public UsuarioResponseDto(String id, String nomeUsuario, boolean mestre) {
        this.id = id;
        this.nomeUsuario = nomeUsuario;
        this.mestre = mestre;
    }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNomeUsuario() { return nomeUsuario; }
    public void setNomeUsuario(String nomeUsuario) { this.nomeUsuario = nomeUsuario; }
    public boolean isMestre() { return mestre; }
    public void setMestre(boolean mestre) { this.mestre = mestre; }

    public static UsuarioResponseDto from(Usuario u) {
        if (u == null) return null;
        return new UsuarioResponseDto(u.getId(), u.getNomeUsuario(), u.isMestre());
    }
}
