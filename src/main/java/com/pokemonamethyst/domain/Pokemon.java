package com.pokemonamethyst.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.BatchSize;

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

    /** Se não nulo, substitui o tipo primário da espécie para esta instância (decisão do mestre). */
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_primario_override")
    private Tipagem tipoPrimarioOverride;

    /** Usado em conjunto com {@link #tipoPrimarioOverride}; null = Pokémon de tipo único. */
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_secundario_override")
    private Tipagem tipoSecundarioOverride;

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

    @Column(name = "hp_atual")
    private Integer hpAtual;

    @Enumerated(EnumType.STRING)
    @Column(name = "origem", nullable = false)
    private OrigemPokemon origem = OrigemPokemon.TREINADOR;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoPokemon estado = EstadoPokemon.ATIVO;

    @Enumerated(EnumType.STRING)
    @Column(name = "pokebola_captura", nullable = false)
    private Pokebola pokebolaCaptura;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_segurado_id")
    private Item itemSegurado;

    @Column(name = "stamina_maxima", nullable = false)
    private int staminaMaxima;

    @Enumerated(EnumType.STRING)
    @Column(name = "iv_class")
    private PokemonIVClass ivClass;

    @Column(name = "pontos_distribuicao_disponiveis", nullable = false)
    private int pontosDistribuicaoDisponiveis;

    @Column(name = "hp_base_rng", nullable = false)
    private int hpBaseRng;

    @Column(name = "stamina_base_rng", nullable = false)
    private int staminaBaseRng;

    @Column(name = "atr_ataque", nullable = false)
    private int atrAtaque;

    @Column(name = "atr_defesa", nullable = false)
    private int atrDefesa;

    @Column(name = "atr_ataque_especial", nullable = false)
    private int atrAtaqueEspecial;

    @Column(name = "atr_defesa_especial", nullable = false)
    private int atrDefesaEspecial;

    @Column(name = "atr_speed", nullable = false)
    private int atrSpeed;

    @Column(name = "atr_hp", nullable = false)
    private int atrHp;

    @Column(name = "atr_stamina", nullable = false)
    private int atrStamina;

    @Column(name = "atr_tecnica", nullable = false)
    private int atrTecnica;

    @Column(name = "atr_respeito", nullable = false)
    private int atrRespeito;

    @ElementCollection(fetch = FetchType.LAZY)
    @BatchSize(size = 32)
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
    /** Sprite exibido: shiny quando aplicável e a espécie tiver URL shiny na PokéAPI; senão o sprite normal. */
    public String getImagemUrl() {
        if (species == null) {
            return null;
        }
        if (shiny) {
            String shinyUrl = species.getSpriteShinyUrl();
            if (shinyUrl != null && !shinyUrl.isBlank()) {
                return shinyUrl;
            }
        }
        return species.getImagemUrl();
    }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
    public Genero getGenero() { return genero; }
    public void setGenero(Genero genero) { this.genero = genero; }
    public boolean isShiny() { return shiny; }
    public void setShiny(boolean shiny) { this.shiny = shiny; }
    public Tipagem getTipoPrimario() {
        if (tipoPrimarioOverride != null) {
            return tipoPrimarioOverride;
        }
        return species != null ? species.getTipoPrimario() : Tipagem.NORMAL;
    }

    public Tipagem getTipoSecundario() {
        if (tipoPrimarioOverride != null) {
            return tipoSecundarioOverride;
        }
        return species != null ? species.getTipoSecundario() : null;
    }

    /** Tipos oficiais da espécie (ignora override). */
    public Tipagem getTipoPrimarioDaEspecie() {
        return species != null ? species.getTipoPrimario() : Tipagem.NORMAL;
    }

    public Tipagem getTipoSecundarioDaEspecie() {
        return species != null ? species.getTipoSecundario() : null;
    }

    public boolean isTiposPersonalizados() {
        return tipoPrimarioOverride != null;
    }

    public Tipagem getTipoPrimarioOverride() {
        return tipoPrimarioOverride;
    }

    public void setTipoPrimarioOverride(Tipagem tipoPrimarioOverride) {
        this.tipoPrimarioOverride = tipoPrimarioOverride;
    }

    public Tipagem getTipoSecundarioOverride() {
        return tipoSecundarioOverride;
    }

    public void setTipoSecundarioOverride(Tipagem tipoSecundarioOverride) {
        this.tipoSecundarioOverride = tipoSecundarioOverride;
    }
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
    public Integer getHpAtual() { return hpAtual; }
    public void setHpAtual(Integer hpAtual) { this.hpAtual = hpAtual; }
    public OrigemPokemon getOrigem() { return origem; }
    public void setOrigem(OrigemPokemon origem) { this.origem = origem; }
    public EstadoPokemon getEstado() { return estado; }
    public void setEstado(EstadoPokemon estado) { this.estado = estado; }
    public Pokebola getPokebolaCaptura() { return pokebolaCaptura; }
    public void setPokebolaCaptura(Pokebola pokebolaCaptura) { this.pokebolaCaptura = pokebolaCaptura; }
    public Item getItemSegurado() { return itemSegurado; }
    public void setItemSegurado(Item itemSegurado) { this.itemSegurado = itemSegurado; }
    public int getStaminaMaxima() { return staminaMaxima; }
    public void setStaminaMaxima(int staminaMaxima) { this.staminaMaxima = staminaMaxima; }
    public PokemonIVClass getIvClass() { return ivClass; }
    public void setIvClass(PokemonIVClass ivClass) { this.ivClass = ivClass; }
    public int getPontosDistribuicaoDisponiveis() { return pontosDistribuicaoDisponiveis; }
    public void setPontosDistribuicaoDisponiveis(int pontosDistribuicaoDisponiveis) { this.pontosDistribuicaoDisponiveis = pontosDistribuicaoDisponiveis; }
    public int getHpBaseRng() { return hpBaseRng; }
    public void setHpBaseRng(int hpBaseRng) { this.hpBaseRng = hpBaseRng; }
    public int getStaminaBaseRng() { return staminaBaseRng; }
    public void setStaminaBaseRng(int staminaBaseRng) { this.staminaBaseRng = staminaBaseRng; }
    public int getAtrAtaque() { return atrAtaque; }
    public void setAtrAtaque(int atrAtaque) { this.atrAtaque = atrAtaque; }
    public int getAtrDefesa() { return atrDefesa; }
    public void setAtrDefesa(int atrDefesa) { this.atrDefesa = atrDefesa; }
    public int getAtrAtaqueEspecial() { return atrAtaqueEspecial; }
    public void setAtrAtaqueEspecial(int atrAtaqueEspecial) { this.atrAtaqueEspecial = atrAtaqueEspecial; }
    public int getAtrDefesaEspecial() { return atrDefesaEspecial; }
    public void setAtrDefesaEspecial(int atrDefesaEspecial) { this.atrDefesaEspecial = atrDefesaEspecial; }
    public int getAtrSpeed() { return atrSpeed; }
    public void setAtrSpeed(int atrSpeed) { this.atrSpeed = atrSpeed; }
    public int getAtrHp() { return atrHp; }
    public void setAtrHp(int atrHp) { this.atrHp = atrHp; }
    public int getAtrStamina() { return atrStamina; }
    public void setAtrStamina(int atrStamina) { this.atrStamina = atrStamina; }
    public int getAtrTecnica() { return atrTecnica; }
    public void setAtrTecnica(int atrTecnica) { this.atrTecnica = atrTecnica; }
    public int getAtrRespeito() { return atrRespeito; }
    public void setAtrRespeito(int atrRespeito) { this.atrRespeito = atrRespeito; }

    // Compatibilidade temporária com as camadas ainda não migradas (Passos 3-5).
    public int getIvHp() { return hpBaseRng; }
    public void setIvHp(int ivHp) { this.hpBaseRng = ivHp; }
    public int getIvAtaque() { return 0; }
    public void setIvAtaque(int ivAtaque) { }
    public int getIvAtaqueEspecial() { return 0; }
    public void setIvAtaqueEspecial(int ivAtaqueEspecial) { }
    public int getIvDefesa() { return 0; }
    public void setIvDefesa(int ivDefesa) { }
    public int getIvDefesaEspecial() { return 0; }
    public void setIvDefesaEspecial(int ivDefesaEspecial) { }
    public int getIvSpeed() { return 0; }
    public void setIvSpeed(int ivSpeed) { }
    public int getEvHp() { return atrHp; }
    public void setEvHp(int evHp) { this.atrHp = evHp; }
    public int getEvAtaque() { return atrAtaque; }
    public void setEvAtaque(int evAtaque) { this.atrAtaque = evAtaque; }
    public int getEvDefesa() { return atrDefesa; }
    public void setEvDefesa(int evDefesa) { this.atrDefesa = evDefesa; }
    public int getEvAtaqueEspecial() { return atrAtaqueEspecial; }
    public void setEvAtaqueEspecial(int evAtaqueEspecial) { this.atrAtaqueEspecial = evAtaqueEspecial; }
    public int getEvDefesaEspecial() { return atrDefesaEspecial; }
    public void setEvDefesaEspecial(int evDefesaEspecial) { this.atrDefesaEspecial = evDefesaEspecial; }
    public int getEvSpeed() { return atrSpeed; }
    public void setEvSpeed(int evSpeed) { this.atrSpeed = evSpeed; }
    public int getTecnica() { return atrTecnica; }
    public void setTecnica(int tecnica) { this.atrTecnica = tecnica; }
    public int getRespeito() { return atrRespeito; }
    public void setRespeito(int respeito) { this.atrRespeito = respeito; }
    public List<CondicaoStatus> getStatusAtuais() { return statusAtuais; }
    public void setStatusAtuais(List<CondicaoStatus> statusAtuais) { this.statusAtuais = statusAtuais; }
    public Habilidade getHabilidadeAtiva() { return habilidadeAtiva; }
    public void setHabilidadeAtiva(Habilidade habilidadeAtiva) { this.habilidadeAtiva = habilidadeAtiva; }
    public List<Movimento> getMovimentosConhecidos() { return movimentosConhecidos; }
    public void setMovimentosConhecidos(List<Movimento> movimentosConhecidos) { this.movimentosConhecidos = movimentosConhecidos; }
}
