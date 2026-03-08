-- Troca o campo email por nome de usuário (treinador)
ALTER TABLE usuario RENAME COLUMN email TO nome_usuario;

ALTER INDEX idx_usuario_email RENAME TO idx_usuario_nome_usuario;
