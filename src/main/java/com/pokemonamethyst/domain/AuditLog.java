package com.pokemonamethyst.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log", indexes = {
    @Index(name = "idx_audit_log_criado_em",  columnList = "criado_em DESC"),
    @Index(name = "idx_audit_log_usuario_id", columnList = "usuario_id"),
    @Index(name = "idx_audit_log_acao",       columnList = "acao"),
})
public class AuditLog {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private String id;

    @Column(name = "usuario_id", nullable = false)
    private String usuarioId;

    @Column(name = "nome_usuario", nullable = false, length = 100)
    private String nomeUsuario;

    @Column(name = "acao", nullable = false, length = 100)
    private String acao;

    @Column(name = "entidade_tipo", nullable = false, length = 50)
    private String entidadeTipo;

    @Column(name = "entidade_id")
    private String entidadeId;

    @Column(name = "detalhes", length = 500)
    private String detalhes;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @PrePersist
    void prePersist() {
        if (criadoEm == null) criadoEm = LocalDateTime.now();
    }

    public AuditLog() {}

    public AuditLog(String id, String usuarioId, String nomeUsuario, String acao,
                    String entidadeTipo, String entidadeId, String detalhes) {
        this.id = id;
        this.usuarioId = usuarioId;
        this.nomeUsuario = nomeUsuario;
        this.acao = acao;
        this.entidadeTipo = entidadeTipo;
        this.entidadeId = entidadeId;
        this.detalhes = detalhes;
    }

    public String getId() { return id; }
    public String getUsuarioId() { return usuarioId; }
    public String getNomeUsuario() { return nomeUsuario; }
    public String getAcao() { return acao; }
    public String getEntidadeTipo() { return entidadeTipo; }
    public String getEntidadeId() { return entidadeId; }
    public String getDetalhes() { return detalhes; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
}
