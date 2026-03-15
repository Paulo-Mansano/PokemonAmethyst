package com.pokemonamethyst.domain;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "pokemon", indexes = @Index(columnList = "perfil_id"))
public class Pokemon {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "perfil_id", nullable = false)
    private PerfilJogador perfil;

    @Column(name = "ordem_time")
    private Integer ordemTime;

    @Column(name = "pokedex_id", nullable = false)
    private int pokedexId;

    @Column(nullable = false)
    private String especie;

    private String apelido;

    @Column(name = "imagem_url")
    private String imagemUrl;

    @Column(columnDefinition = "TEXT")
    private String notas;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Genero genero;

    @Column(name = "is_shiny", nullable = false)
    private boolean shiny = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_primario", nullable = false)
    private Tipagem tipoPrimario;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_secundario")
    private Tipagem tipoSecundario;

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

    @Column(name = "hp_maximo", nullable = false)
    private int hpMaximo;

    @Column(name = "hp_atual", nullable = false)
    private int hpAtual;

    @Column(name = "hp_temporario", nullable = false)
    private int hpTemporario = 0;

    @Column(name = "stamina_maxima", nullable = false)
    private int staminaMaxima;

    @Column(name = "stamina_atual", nullable = false)
    private int staminaAtual;

    @Column(name = "stamina_temporaria", nullable = false)
    private int staminaTemporaria = 0;

    private int ataque;
    @Column(name = "ataque_especial")
    private int ataqueEspecial;
    private int defesa;
    @Column(name = "defesa_especial")
    private int defesaEspecial;
    private int speed;
    private int tecnica;
    private int respeito;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "pokemon_status", joinColumns = @JoinColumn(name = "pokemon_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "condicao")
    private List<CondicaoStatus> statusAtuais = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "pokemon_habilidade",
            joinColumns = @JoinColumn(name = "pokemon_id"),
            inverseJoinColumns = @JoinColumn(name = "habilidade_id")
    )
    private List<Habilidade> habilidades = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "pokemon_movimento",
            joinColumns = @JoinColumn(name = "pokemon_id"),
            inverseJoinColumns = @JoinColumn(name = "movimento_id")
    )
    private List<Movimento> movimentosConhecidos = new ArrayList<>();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public PerfilJogador getPerfil() { return perfil; }
    public void setPerfil(PerfilJogador perfil) { this.perfil = perfil; }
    public Integer getOrdemTime() { return ordemTime; }
    public void setOrdemTime(Integer ordemTime) { this.ordemTime = ordemTime; }
    public int getPokedexId() { return pokedexId; }
    public void setPokedexId(int pokedexId) { this.pokedexId = pokedexId; }
    public String getEspecie() { return especie; }
    public void setEspecie(String especie) { this.especie = especie; }
    public String getApelido() { return apelido; }
    public void setApelido(String apelido) { this.apelido = apelido; }
    public String getImagemUrl() { return imagemUrl; }
    public void setImagemUrl(String imagemUrl) { this.imagemUrl = imagemUrl; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
    public Genero getGenero() { return genero; }
    public void setGenero(Genero genero) { this.genero = genero; }
    public boolean isShiny() { return shiny; }
    public void setShiny(boolean shiny) { this.shiny = shiny; }
    public Tipagem getTipoPrimario() { return tipoPrimario; }
    public void setTipoPrimario(Tipagem tipoPrimario) { this.tipoPrimario = tipoPrimario; }
    public Tipagem getTipoSecundario() { return tipoSecundario; }
    public void setTipoSecundario(Tipagem tipoSecundario) { this.tipoSecundario = tipoSecundario; }
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
    public int getHpMaximo() { return hpMaximo; }
    public void setHpMaximo(int hpMaximo) { this.hpMaximo = hpMaximo; }
    public int getHpAtual() { return hpAtual; }
    public void setHpAtual(int hpAtual) { this.hpAtual = hpAtual; }
    public int getHpTemporario() { return hpTemporario; }
    public void setHpTemporario(int hpTemporario) { this.hpTemporario = hpTemporario; }
    public int getStaminaMaxima() { return staminaMaxima; }
    public void setStaminaMaxima(int staminaMaxima) { this.staminaMaxima = staminaMaxima; }
    public int getStaminaAtual() { return staminaAtual; }
    public void setStaminaAtual(int staminaAtual) { this.staminaAtual = staminaAtual; }
    public int getStaminaTemporaria() { return staminaTemporaria; }
    public void setStaminaTemporaria(int staminaTemporaria) { this.staminaTemporaria = staminaTemporaria; }
    public int getAtaque() { return ataque; }
    public void setAtaque(int ataque) { this.ataque = ataque; }
    public int getAtaqueEspecial() { return ataqueEspecial; }
    public void setAtaqueEspecial(int ataqueEspecial) { this.ataqueEspecial = ataqueEspecial; }
    public int getDefesa() { return defesa; }
    public void setDefesa(int defesa) { this.defesa = defesa; }
    public int getDefesaEspecial() { return defesaEspecial; }
    public void setDefesaEspecial(int defesaEspecial) { this.defesaEspecial = defesaEspecial; }
    public int getSpeed() { return speed; }
    public void setSpeed(int speed) { this.speed = speed; }
    public int getTecnica() { return tecnica; }
    public void setTecnica(int tecnica) { this.tecnica = tecnica; }
    public int getRespeito() { return respeito; }
    public void setRespeito(int respeito) { this.respeito = respeito; }
    public List<CondicaoStatus> getStatusAtuais() { return statusAtuais; }
    public void setStatusAtuais(List<CondicaoStatus> statusAtuais) { this.statusAtuais = statusAtuais; }
    public List<Habilidade> getHabilidades() { return habilidades; }
    public void setHabilidades(List<Habilidade> habilidades) { this.habilidades = habilidades; }
    public List<Movimento> getMovimentosConhecidos() { return movimentosConhecidos; }
    public void setMovimentosConhecidos(List<Movimento> movimentosConhecidos) { this.movimentosConhecidos = movimentosConhecidos; }
}
