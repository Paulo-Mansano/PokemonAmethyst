package com.pokemonamethyst.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "pokemon_species_habilidade")
@IdClass(PokemonSpeciesHabilidadeId.class)
public class PokemonSpeciesHabilidade {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "species_id", nullable = false)
    private PokemonSpecies species;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habilidade_id", nullable = false)
    private Habilidade habilidade;

    @Column(name = "slot", nullable = false)
    private int slot;

    @Column(name = "is_hidden", nullable = false)
    private boolean hidden;

    public PokemonSpecies getSpecies() {
        return species;
    }

    public void setSpecies(PokemonSpecies species) {
        this.species = species;
    }

    public Habilidade getHabilidade() {
        return habilidade;
    }

    public void setHabilidade(Habilidade habilidade) {
        this.habilidade = habilidade;
    }

    public int getSlot() {
        return slot;
    }

    public void setSlot(int slot) {
        this.slot = slot;
    }

    public boolean isHidden() {
        return hidden;
    }

    public void setHidden(boolean hidden) {
        this.hidden = hidden;
    }
}
