package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.AuditLog;

import java.time.format.DateTimeFormatter;

public class AuditLogResponseDto {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private String id;
    private String usuarioId;
    private String nomeUsuario;
    private String acao;
    private String entidadeTipo;
    private String entidadeId;
    private String detalhes;
    private String criadoEm;

    public static AuditLogResponseDto from(AuditLog log) {
        AuditLogResponseDto dto = new AuditLogResponseDto();
        dto.id = log.getId();
        dto.usuarioId = log.getUsuarioId();
        dto.nomeUsuario = log.getNomeUsuario();
        dto.acao = log.getAcao();
        dto.entidadeTipo = log.getEntidadeTipo();
        dto.entidadeId = log.getEntidadeId();
        dto.detalhes = log.getDetalhes();
        dto.criadoEm = log.getCriadoEm() != null ? log.getCriadoEm().format(FMT) : null;
        return dto;
    }

    public String getId() { return id; }
    public String getUsuarioId() { return usuarioId; }
    public String getNomeUsuario() { return nomeUsuario; }
    public String getAcao() { return acao; }
    public String getEntidadeTipo() { return entidadeTipo; }
    public String getEntidadeId() { return entidadeId; }
    public String getDetalhes() { return detalhes; }
    public String getCriadoEm() { return criadoEm; }
}
