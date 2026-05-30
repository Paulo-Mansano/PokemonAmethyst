ALTER TABLE pokemon_species
  ADD COLUMN imagem_url_femea     VARCHAR(512),
  ADD COLUMN eh_forma_alternativa BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN base_species_id      VARCHAR(255) REFERENCES pokemon_species(id);
