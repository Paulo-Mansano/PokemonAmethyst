ALTER TABLE item
    ADD COLUMN IF NOT EXISTS categoria VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_item_categoria
    ON item(categoria);

ALTER TABLE pokemon_instance
    ADD COLUMN IF NOT EXISTS sprite_customizado_url VARCHAR(512);