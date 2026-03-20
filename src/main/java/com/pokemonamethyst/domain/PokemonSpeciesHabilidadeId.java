package com.pokemonamethyst.domain;

import java.io.Serializable;
import java.util.Objects;

public class PokemonSpeciesHabilidadeId implements Serializable {
    private String species;
    private String habilidade;

    public PokemonSpeciesHabilidadeId() {
    }

    public PokemonSpeciesHabilidadeId(String species, String habilidade) {
        this.species = species;
        this.habilidade = habilidade;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PokemonSpeciesHabilidadeId that)) return false;
        return Objects.equals(species, that.species) && Objects.equals(habilidade, that.habilidade);
    }

    @Override
    public int hashCode() {
        return Objects.hash(species, habilidade);
    }
}
