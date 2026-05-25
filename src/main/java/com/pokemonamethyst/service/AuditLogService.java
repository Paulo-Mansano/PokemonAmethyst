package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.AuditLog;
import com.pokemonamethyst.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuditLogService {

    private final AuditLogRepository repository;

    public AuditLogService(AuditLogRepository repository) {
        this.repository = repository;
    }

    /**
     * Registra uma entrada no log. Usa REQUIRES_NEW para que falhas de audit
     * não revertam a transação principal.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrar(String usuarioId, String nomeUsuario, String acao,
                          String entidadeTipo, String entidadeId, String detalhes) {
        try {
            AuditLog log = new AuditLog(
                UUID.randomUUID().toString(),
                usuarioId,
                nomeUsuario,
                acao,
                entidadeTipo,
                entidadeId,
                detalhes
            );
            repository.save(log);
        } catch (Exception e) {
            // Nunca deixar falha de audit derrubar a operação principal
        }
    }

    @Transactional(readOnly = true)
    public Page<AuditLog> listar(String usuarioId, String acao, int page, int size) {
        int safeSize = Math.min(size, 100);
        Pageable pageable = PageRequest.of(page, safeSize);
        boolean temUser = usuarioId != null && !usuarioId.isBlank();
        boolean temAcao = acao != null && !acao.isBlank();
        if (temUser && temAcao) return repository.findByUsuarioIdAndAcaoOrderByCriadoEmDesc(usuarioId, acao, pageable);
        if (temUser) return repository.findByUsuarioIdOrderByCriadoEmDesc(usuarioId, pageable);
        if (temAcao) return repository.findByAcaoOrderByCriadoEmDesc(acao, pageable);
        return repository.findAllByOrderByCriadoEmDesc(pageable);
    }
}
