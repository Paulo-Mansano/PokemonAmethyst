package com.pokemonamethyst.domain;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "perfil_jogador")
public class PerfilJogador {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private String id = UUID.randomUUID().toString();

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", unique = true, nullable = false)
    private Usuario usuario;

    @Column(name = "nome_personagem", nullable = false)
    private String nomePersonagem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ClasseJogador classe;

    @Column(nullable = false)
    private int pokedolares = 0;

    @Column(nullable = false)
    private int nivel = 1;

    @Column(name = "xp_atual", nullable = false)
    private int xpAtual = 0;

    @Column(name = "hp_maximo", nullable = false)
    private int hpMaximo;

    @Column(name = "stamina_maxima", nullable = false)
    private int staminaMaxima;

    @Column(nullable = false)
    private int habilidade = 0;

    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "forca", column = @Column(name = "atr_forca")),
            @AttributeOverride(name = "speed", column = @Column(name = "atr_speed")),
            @AttributeOverride(name = "inteligencia", column = @Column(name = "atr_inteligencia")),
            @AttributeOverride(name = "tecnica", column = @Column(name = "atr_tecnica")),
            @AttributeOverride(name = "sabedoria", column = @Column(name = "atr_sabedoria")),
            @AttributeOverride(name = "percepcao", column = @Column(name = "atr_percepcao")),
            @AttributeOverride(name = "dominio", column = @Column(name = "atr_dominio")),
            @AttributeOverride(name = "respeito", column = @Column(name = "atr_respeito"))
    })
    private Atributos atributos = new Atributos();

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "mochila_id", unique = true)
    private Mochila mochila;

    @OneToMany(mappedBy = "perfil", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordemTime ASC")
    private List<Pokemon> pokemons = new ArrayList<>();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public String getNomePersonagem() { return nomePersonagem; }
    public void setNomePersonagem(String nomePersonagem) { this.nomePersonagem = nomePersonagem; }
    public ClasseJogador getClasse() { return classe; }
    public void setClasse(ClasseJogador classe) { this.classe = classe; }
    public int getPokedolares() { return pokedolares; }
    public void setPokedolares(int pokedolares) { this.pokedolares = pokedolares; }
    public int getNivel() { return nivel; }
    public void setNivel(int nivel) { this.nivel = nivel; }
    public int getXpAtual() { return xpAtual; }
    public void setXpAtual(int xpAtual) { this.xpAtual = xpAtual; }
    public int getHpMaximo() { return hpMaximo; }
    public void setHpMaximo(int hpMaximo) { this.hpMaximo = hpMaximo; }
    public int getStaminaMaxima() { return staminaMaxima; }
    public void setStaminaMaxima(int staminaMaxima) { this.staminaMaxima = staminaMaxima; }
    public int getHabilidade() { return habilidade; }
    public void setHabilidade(int habilidade) { this.habilidade = habilidade; }
    public Atributos getAtributos() { return atributos; }
    public void setAtributos(Atributos atributos) { this.atributos = atributos; }
    public Mochila getMochila() { return mochila; }
    public void setMochila(Mochila mochila) { this.mochila = mochila; }
    public List<Pokemon> getPokemons() { return pokemons; }
    public void setPokemons(List<Pokemon> pokemons) { this.pokemons = pokemons; }
}
