package com.pokemonamethyst.domain;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "usuario", indexes = @Index(unique = true, columnList = "nome_usuario"))
public class Usuario {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private String id = UUID.randomUUID().toString();

    @Column(name = "nome_usuario", nullable = false, unique = true)
    private String nomeUsuario;

    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;

    @Column(name = "is_mestre", nullable = false)
    private boolean mestre = false;

    @OneToOne(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
    private PerfilJogador perfilJogador;

    public Usuario() {}

    public Usuario(String id, String nomeUsuario, String senhaHash, boolean mestre, PerfilJogador perfilJogador) {
        this.id = id;
        this.nomeUsuario = nomeUsuario;
        this.senhaHash = senhaHash;
        this.mestre = mestre;
        this.perfilJogador = perfilJogador;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNomeUsuario() { return nomeUsuario; }
    public void setNomeUsuario(String nomeUsuario) { this.nomeUsuario = nomeUsuario; }
    public String getSenhaHash() { return senhaHash; }
    public void setSenhaHash(String senhaHash) { this.senhaHash = senhaHash; }
    public boolean isMestre() { return mestre; }
    public void setMestre(boolean mestre) { this.mestre = mestre; }
    public PerfilJogador getPerfilJogador() { return perfilJogador; }
    public void setPerfilJogador(PerfilJogador perfilJogador) { this.perfilJogador = perfilJogador; }
}
