package com.pokemonamethyst.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "pokemon_species", indexes = @Index(columnList = "pokedex_id", unique = true))
public class PokemonSpecies {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private String id = UUID.randomUUID().toString();

    @Column(name = "pokedex_id", nullable = false, unique = true)
    private int pokedexId;

    @Column(name = "nome", nullable = false)
    private String nome;

    @Column(name = "imagem_url")
    private String imagemUrl;

    @Column(name = "sprite_shiny_url")
    private String spriteShinyUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_primario", nullable = false)
    private Tipagem tipoPrimario;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_secundario")
    private Tipagem tipoSecundario;

    @Column(name = "base_hp", nullable = false)
    private int baseHp;

    @Column(name = "base_ataque", nullable = false)
    private int baseAtaque;

    @Column(name = "base_defesa", nullable = false)
    private int baseDefesa;

    @Column(name = "base_ataque_especial", nullable = false)
    private int baseAtaqueEspecial;

    @Column(name = "base_defesa_especial", nullable = false)
    private int baseDefesaEspecial;

    @Column(name = "base_speed", nullable = false)
    private int baseSpeed;

    @Column(name = "growth_rate")
    private String growthRate;

    @Column(name = "base_experience")
    private Integer baseExperience;

    @Column(name = "capture_rate")
    private Integer captureRate;

    @Column(name = "height")
    private Integer height;

    @Column(name = "weight")
    private Integer weight;

    @Column(name = "habitat")
    private String habitat;

    @Column(name = "legendary", nullable = false)
    private boolean legendary;

    @Column(name = "mythical", nullable = false)
    private boolean mythical;

    @Column(name = "gender_rate")
    private Integer genderRate;

    @Column(name = "has_gender_differences", nullable = false)
    private boolean hasGenderDifferences;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "forms", columnDefinition = "jsonb")
    private String forms;

    @OneToMany(mappedBy = "species", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PokemonSpeciesHabilidade> habilidades = new ArrayList<>();

    @OneToMany(mappedBy = "species", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PokemonSpeciesMovimento> learnset = new ArrayList<>();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public int getPokedexId() { return pokedexId; }
    public void setPokedexId(int pokedexId) { this.pokedexId = pokedexId; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getImagemUrl() { return imagemUrl; }
    public void setImagemUrl(String imagemUrl) { this.imagemUrl = imagemUrl; }
    public String getSpriteShinyUrl() { return spriteShinyUrl; }
    public void setSpriteShinyUrl(String spriteShinyUrl) { this.spriteShinyUrl = spriteShinyUrl; }
    public Tipagem getTipoPrimario() { return tipoPrimario; }
    public void setTipoPrimario(Tipagem tipoPrimario) { this.tipoPrimario = tipoPrimario; }
    public Tipagem getTipoSecundario() { return tipoSecundario; }
    public void setTipoSecundario(Tipagem tipoSecundario) { this.tipoSecundario = tipoSecundario; }
    public int getBaseHp() { return baseHp; }
    public void setBaseHp(int baseHp) { this.baseHp = baseHp; }
    public int getBaseAtaque() { return baseAtaque; }
    public void setBaseAtaque(int baseAtaque) { this.baseAtaque = baseAtaque; }
    public int getBaseDefesa() { return baseDefesa; }
    public void setBaseDefesa(int baseDefesa) { this.baseDefesa = baseDefesa; }
    public int getBaseAtaqueEspecial() { return baseAtaqueEspecial; }
    public void setBaseAtaqueEspecial(int baseAtaqueEspecial) { this.baseAtaqueEspecial = baseAtaqueEspecial; }
    public int getBaseDefesaEspecial() { return baseDefesaEspecial; }
    public void setBaseDefesaEspecial(int baseDefesaEspecial) { this.baseDefesaEspecial = baseDefesaEspecial; }
    public int getBaseSpeed() { return baseSpeed; }
    public void setBaseSpeed(int baseSpeed) { this.baseSpeed = baseSpeed; }
    public String getGrowthRate() { return growthRate; }
    public void setGrowthRate(String growthRate) { this.growthRate = growthRate; }
    public Integer getBaseExperience() { return baseExperience; }
    public void setBaseExperience(Integer baseExperience) { this.baseExperience = baseExperience; }
    public Integer getCaptureRate() { return captureRate; }
    public void setCaptureRate(Integer captureRate) { this.captureRate = captureRate; }
    public Integer getHeight() { return height; }
    public void setHeight(Integer height) { this.height = height; }
    public Integer getWeight() { return weight; }
    public void setWeight(Integer weight) { this.weight = weight; }
    public String getHabitat() { return habitat; }
    public void setHabitat(String habitat) { this.habitat = habitat; }
    public boolean isLegendary() { return legendary; }
    public void setLegendary(boolean legendary) { this.legendary = legendary; }
    public boolean isMythical() { return mythical; }
    public void setMythical(boolean mythical) { this.mythical = mythical; }
    public Integer getGenderRate() { return genderRate; }
    public void setGenderRate(Integer genderRate) { this.genderRate = genderRate; }
    public boolean isHasGenderDifferences() { return hasGenderDifferences; }
    public boolean getHasGenderDifferences() { return hasGenderDifferences; }
    public void setHasGenderDifferences(boolean hasGenderDifferences) { this.hasGenderDifferences = hasGenderDifferences; }
    public String getForms() { return forms; }
    public void setForms(String forms) { this.forms = forms; }
    public List<PokemonSpeciesHabilidade> getHabilidades() { return habilidades; }
    public void setHabilidades(List<PokemonSpeciesHabilidade> habilidades) { this.habilidades = habilidades; }
    public List<PokemonSpeciesMovimento> getLearnset() { return learnset; }
    public void setLearnset(List<PokemonSpeciesMovimento> learnset) { this.learnset = learnset; }
}
