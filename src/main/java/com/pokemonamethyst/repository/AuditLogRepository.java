package com.pokemonamethyst.repository;

import com.pokemonamethyst.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, String> {

    Page<AuditLog> findAllByOrderByCriadoEmDesc(Pageable pageable);

    Page<AuditLog> findByUsuarioIdOrderByCriadoEmDesc(String usuarioId, Pageable pageable);

    Page<AuditLog> findByAcaoOrderByCriadoEmDesc(String acao, Pageable pageable);

    Page<AuditLog> findByUsuarioIdAndAcaoOrderByCriadoEmDesc(String usuarioId, String acao, Pageable pageable);
}
