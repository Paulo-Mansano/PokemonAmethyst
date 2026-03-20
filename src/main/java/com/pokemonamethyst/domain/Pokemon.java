package com.pokemonamethyst.domain;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "pokemon_instance", indexes = @Index(columnList = "perfil_id"))
public class Pokemon {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "perfil_id", nullable = false)
    private PerfilJogador perfil;

    @Column(name = "ordem_time")
    private Integer ordemTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "species_id", nullable = false)
    private PokemonSpecies species;

    private String apelido;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Genero genero;

    @Column(name = "is_shiny", nullable = false)
    private boolean shiny = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "personalidade_id")
    private Personalidade personalidade;

    @Enumerated(EnumType.STRING)
    private Especializacao especializacao;

    @Column(name = "berry_favorita")
    private String berryFavorita;

    @Column(name = "nivel_de_vinculo", nullable = false)
    private int nivelDeVinculo = 0;

    @Column(nullable = false)
    private int nivel = 1;

    @Column(name = "xp_atual", nullable = false)
    private int xpAtual = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "pokebola_captura", nullable = false)
    private Pokebola pokebolaCaptura;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_segurado_id")
    private Item itemSegurado;

    @Column(name = "stamina_maxima", nullable = false)
    private int staminaMaxima;

    @Column(name = "iv_hp", nullable = false)
    private int ivHp;
    @Column(name = "iv_ataque", nullable = false)
    private int ivAtaque;
    @Column(name = "iv_defesa", nullable = false)
    private int ivDefesa;
    @Column(name = "iv_ataque_especial", nullable = false)
    private int ivAtaqueEspecial;
    @Column(name = "iv_defesa_especial", nullable = false)
    private int ivDefesaEspecial;
    @Column(name = "iv_speed", nullable = false)
    private int ivSpeed;

    private int tecnica;
    private int respeito;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "pokemon_instance_status", joinColumns = @JoinColumn(name = "pokemon_instance_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "condicao")
    private List<CondicaoStatus> statusAtuais = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ability_id")
    private Habilidade habilidadeAtiva;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "pokemon_instance_movimento",
            joinColumns = @JoinColumn(name = "pokemon_instance_id"),
            inverseJoinColumns = @JoinColumn(name = "movimento_id")
    )
    private List<Movimento> movimentosConhecidos = new ArrayList<>();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public PerfilJogador getPerfil() { return perfil; }
    public void setPerfil(PerfilJogador perfil) { this.perfil = perfil; }
    public Integer getOrdemTime() { return ordemTime; }
    public void setOrdemTime(Integer ordemTime) { this.ordemTime = ordemTime; }
    public PokemonSpecies getSpecies() { return species; }
    public void setSpecies(PokemonSpecies species) { this.species = species; }
    public int getPokedexId() { return species != null ? species.getPokedexId() : 0; }
    public String getEspecie() { return species != null ? species.getNome() : ""; }
    public String getApelido() { return apelido; }
    public void setApelido(String apelido) { this.apelido = apelido; }
    public String getImagemUrl() { return species != null ? species.getImagemUrl() : null; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
    public Genero getGenero() { return genero; }
    public void setGenero(Genero genero) { this.genero = genero; }
    public boolean isShiny() { return shiny; }
    public void setShiny(boolean shiny) { this.shiny = shiny; }
    public Tipagem getTipoPrimario() { return species != null ? species.getTipoPrimario() : Tipagem.NORMAL; }
    public Tipagem getTipoSecundario() { return species != null ? species.getTipoSecundario() : null; }
    public Personalidade getPersonalidade() { return personalidade; }
    public void setPersonalidade(Personalidade personalidade) { this.personalidade = personalidade; }
    public Especializacao getEspecializacao() { return especializacao; }
    public void setEspecializacao(Especializacao especializacao) { this.especializacao = especializacao; }
    public String getBerryFavorita() { return berryFavorita; }
    public void setBerryFavorita(String berryFavorita) { this.berryFavorita = berryFavorita; }
    public int getNivelDeVinculo() { return nivelDeVinculo; }
    public void setNivelDeVinculo(int nivelDeVinculo) { this.nivelDeVinculo = nivelDeVinculo; }
    public int getNivel() { return nivel; }
    public void setNivel(int nivel) { this.nivel = nivel; }
    public int getXpAtual() { return xpAtual; }
    public void setXpAtual(int xpAtual) { this.xpAtual = xpAtual; }
    public Pokebola getPokebolaCaptura() { return pokebolaCaptura; }
    public void setPokebolaCaptura(Pokebola pokebolaCaptura) { this.pokebolaCaptura = pokebolaCaptura; }
    public Item getItemSegurado() { return itemSegurado; }
    public void setItemSegurado(Item itemSegurado) { this.itemSegurado = itemSegurado; }
    public int getStaminaMaxima() { return staminaMaxima; }
    public void setStaminaMaxima(int staminaMaxima) { this.staminaMaxima = staminaMaxima; }
    public int getIvHp() { return ivHp; }
    public void setIvHp(int ivHp) { this.ivHp = ivHp; }
    public int getIvAtaque() { return ivAtaque; }
    public void setIvAtaque(int ivAtaque) { this.ivAtaque = ivAtaque; }
    public int getIvAtaqueEspecial() { return ivAtaqueEspecial; }
    public void setIvAtaqueEspecial(int ivAtaqueEspecial) { this.ivAtaqueEspecial = ivAtaqueEspecial; }
    public int getIvDefesa() { return ivDefesa; }
    public void setIvDefesa(int ivDefesa) { this.ivDefesa = ivDefesa; }
    public int getIvDefesaEspecial() { return ivDefesaEspecial; }
    public void setIvDefesaEspecial(int ivDefesaEspecial) { this.ivDefesaEspecial = ivDefesaEspecial; }
    public int getIvSpeed() { return ivSpeed; }
    public void setIvSpeed(int ivSpeed) { this.ivSpeed = ivSpeed; }
    public int getTecnica() { return tecnica; }
    public void setTecnica(int tecnica) { this.tecnica = tecnica; }
    public int getRespeito() { return respeito; }
    public void setRespeito(int respeito) { this.respeito = respeito; }
    public List<CondicaoStatus> getStatusAtuais() { return statusAtuais; }
    public void setStatusAtuais(List<CondicaoStatus> statusAtuais) { this.statusAtuais = statusAtuais; }
    public Habilidade getHabilidadeAtiva() { return habilidadeAtiva; }
    public void setHabilidadeAtiva(Habilidade habilidadeAtiva) { this.habilidadeAtiva = habilidadeAtiva; }
    public List<Movimento> getMovimentosConhecidos() { return movimentosConhecidos; }
    public void setMovimentosConhecidos(List<Movimento> movimentosConhecidos) { this.movimentosConhecidos = movimentosConhecidos; }
}
