package com.pokemonamethyst.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "pokemon_species_movimento")
public class PokemonSpeciesMovimento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "species_id", nullable = false)
    private PokemonSpecies species;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "movimento_id", nullable = false)
    private Movimento movimento;

    @Enumerated(EnumType.STRING)
    @Column(name = "learn_method", nullable = false)
    private MoveLearnMethod learnMethod;

    @Column(name = "level")
    private Integer level;

    /** Índice no array {@code moves} da PokéAPI; usado para ordenar moves iniciais quando o nível empata. */
    @Column(name = "ordem")
    private Integer ordem;

    public Long getId() {
        return id;
    }

    public PokemonSpecies getSpecies() {
        return species;
    }

    public void setSpecies(PokemonSpecies species) {
        this.species = species;
    }

    public Movimento getMovimento() {
        return movimento;
    }

    public void setMovimento(Movimento movimento) {
        this.movimento = movimento;
    }

    public MoveLearnMethod getLearnMethod() {
        return learnMethod;
    }

    public void setLearnMethod(MoveLearnMethod learnMethod) {
        this.learnMethod = learnMethod;
    }

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }

    public Integer getOrdem() {
        return ordem;
    }

    public void setOrdem(Integer ordem) {
        this.ordem = ordem;
    }
}
