package com.pokemonamethyst.web.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegistroRequestDto {

    @NotBlank(message = "Nome de usuário é obrigatório")
    @Size(min = 2, max = 50, message = "Nome de usuário deve ter entre 2 e 50 caracteres")
    private String nomeUsuario;

    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
    private String senha;

    private boolean mestre;

    public RegistroRequestDto() {}
    public RegistroRequestDto(String nomeUsuario, String senha, boolean mestre) {
        this.nomeUsuario = nomeUsuario;
        this.senha = senha;
        this.mestre = mestre;
    }
    public String getNomeUsuario() { return nomeUsuario; }
    public void setNomeUsuario(String nomeUsuario) { this.nomeUsuario = nomeUsuario; }
    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }
    public boolean isMestre() { return mestre; }
    public void setMestre(boolean mestre) { this.mestre = mestre; }
}
