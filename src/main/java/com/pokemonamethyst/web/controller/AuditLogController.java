package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.domain.AuditLog;
import com.pokemonamethyst.service.AuditLogService;
import com.pokemonamethyst.web.dto.AuditLogResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/mestre/logs")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listar(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String usuarioId,
            @RequestParam(required = false) String acao) {
        Page<AuditLog> resultado = auditLogService.listar(usuarioId, acao, page, size);
        return ResponseEntity.ok(Map.of(
                "content", resultado.getContent().stream().map(AuditLogResponseDto::from).toList(),
                "totalElements", resultado.getTotalElements(),
                "totalPages", resultado.getTotalPages(),
                "number", resultado.getNumber()
        ));
    }
}
