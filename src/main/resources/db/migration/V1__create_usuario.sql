CREATE TABLE usuario (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    is_mestre BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE UNIQUE INDEX idx_usuario_email ON usuario(email);
