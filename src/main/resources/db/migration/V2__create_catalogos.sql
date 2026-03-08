CREATE TABLE item (
    id VARCHAR(255) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    peso DOUBLE PRECISION NOT NULL DEFAULT 0,
    preco INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE movimento (
    id VARCHAR(255) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    custo_stamina INTEGER NOT NULL DEFAULT 0,
    dado_de_dano VARCHAR(100),
    descricao_efeito TEXT
);

CREATE TABLE habilidade (
    id VARCHAR(255) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT
);
