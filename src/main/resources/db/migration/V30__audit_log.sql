CREATE TABLE IF NOT EXISTS audit_log (
    id          VARCHAR(255) PRIMARY KEY,
    usuario_id  VARCHAR(255) NOT NULL,
    nome_usuario VARCHAR(100) NOT NULL,
    acao        VARCHAR(100) NOT NULL,
    entidade_tipo VARCHAR(50) NOT NULL,
    entidade_id VARCHAR(255),
    detalhes    VARCHAR(500),
    criado_em   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_criado_em   ON audit_log(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_usuario_id  ON audit_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_acao        ON audit_log(acao);
