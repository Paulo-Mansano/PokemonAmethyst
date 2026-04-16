package com.pokemonamethyst.domain;

import jakarta.persistence.*;

@Entity
@Table(
        name = "pokemon_species_evolution_rule",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_pokemon_species_evolution_rule",
                        columnNames = {"from_pokedex_id", "to_pokedex_id", "trigger_type", "min_level", "item_name"}
                )
        }
)
public class PokemonSpeciesEvolutionRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "from_pokedex_id", nullable = false)
    private int fromPokedexId;

    @Column(name = "to_pokedex_id", nullable = false)
    private int toPokedexId;

    @Column(name = "trigger_type", nullable = false, length = 50)
    private String triggerType;

    @Column(name = "min_level")
    private Integer minLevel;

    @Column(name = "item_name", length = 100)
    private String itemName;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public int getFromPokedexId() { return fromPokedexId; }
    public void setFromPokedexId(int fromPokedexId) { this.fromPokedexId = fromPokedexId; }
    public int getToPokedexId() { return toPokedexId; }
    public void setToPokedexId(int toPokedexId) { this.toPokedexId = toPokedexId; }
    public String getTriggerType() { return triggerType; }
    public void setTriggerType(String triggerType) { this.triggerType = triggerType; }
    public Integer getMinLevel() { return minLevel; }
    public void setMinLevel(Integer minLevel) { this.minLevel = minLevel; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
}
