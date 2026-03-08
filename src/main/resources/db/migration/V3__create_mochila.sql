CREATE TABLE mochila (
    id VARCHAR(255) PRIMARY KEY,
    peso_maximo DOUBLE PRECISION NOT NULL
);

CREATE TABLE mochila_item (
    id VARCHAR(255) PRIMARY KEY,
    mochila_id VARCHAR(255) NOT NULL REFERENCES mochila(id) ON DELETE CASCADE,
    item_id VARCHAR(255) NOT NULL REFERENCES item(id),
    quantidade INTEGER NOT NULL,
    UNIQUE(mochila_id, item_id)
);

CREATE INDEX idx_mochila_item_mochila ON mochila_item(mochila_id);
