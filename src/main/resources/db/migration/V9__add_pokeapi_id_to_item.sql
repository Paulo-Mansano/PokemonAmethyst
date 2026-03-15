ALTER TABLE item
    ADD COLUMN pokeapi_id INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS uq_item_pokeapi_id
    ON item(pokeapi_id)
    WHERE pokeapi_id IS NOT NULL;

