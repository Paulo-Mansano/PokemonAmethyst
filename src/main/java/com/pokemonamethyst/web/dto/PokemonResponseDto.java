package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.Movimento;
import com.pokemonamethyst.domain.Pokemon;

import java.util.List;
import java.util.stream.Collectors;

public class PokemonResponseDto {

    private String id;
    private Integer ordemTime;
    private int pokedexId;
    private String especie;
    private String apelido;
    private String imagemUrl;
    private String notas;
    private String genero;
    private boolean shiny;
    private String tipoPrimario;
    private String tipoSecundario;
    private String personalidade;
    private String personalidadeId;
    private String especializacao;
    private String berryFavorita;
    private int nivelDeVinculo;
    private int nivel;
    private int xpAtual;
    private String pokebolaCaptura;
    private String itemSeguradoId;
    private int hpMaximo;
    private int hpAtual;
    private int hpTemporario;
    private int staminaMaxima;
    private int staminaAtual;
    private int staminaTemporaria;
    private int ataque;
    private int ataqueEspecial;
    private int defesa;
    private int defesaEspecial;
    private int speed;
    private int tecnica;
    private int respeito;
    private List<String> statusAtuais;
    private List<MovimentoResponseDto> movimentosConhecidos;

    public PokemonResponseDto() {}
    public PokemonResponseDto(String id, Integer ordemTime, int pokedexId, String especie, String apelido, String imagemUrl, String notas, String genero, boolean shiny, String tipoPrimario, String tipoSecundario, String personalidade, String especializacao, String berryFavorita, int nivelDeVinculo, int nivel, int xpAtual, String pokebolaCaptura, String itemSeguradoId, int hpMaximo, int hpAtual, int hpTemporario, int staminaMaxima, int staminaAtual, int staminaTemporaria, int ataque, int ataqueEspecial, int defesa, int defesaEspecial, int speed, int tecnica, int respeito, List<String> statusAtuais) {
        this.id = id;
        this.ordemTime = ordemTime;
        this.pokedexId = pokedexId;
        this.especie = especie;
        this.apelido = apelido;
        this.imagemUrl = imagemUrl;
        this.notas = notas;
        this.genero = genero;
        this.shiny = shiny;
        this.tipoPrimario = tipoPrimario;
        this.tipoSecundario = tipoSecundario;
        this.personalidade = personalidade;
        this.especializacao = especializacao;
        this.berryFavorita = berryFavorita;
        this.nivelDeVinculo = nivelDeVinculo;
        this.nivel = nivel;
        this.xpAtual = xpAtual;
        this.pokebolaCaptura = pokebolaCaptura;
        this.itemSeguradoId = itemSeguradoId;
        this.hpMaximo = hpMaximo;
        this.hpAtual = hpAtual;
        this.hpTemporario = hpTemporario;
        this.staminaMaxima = staminaMaxima;
        this.staminaAtual = staminaAtual;
        this.staminaTemporaria = staminaTemporaria;
        this.ataque = ataque;
        this.ataqueEspecial = ataqueEspecial;
        this.defesa = defesa;
        this.defesaEspecial = defesaEspecial;
        this.speed = speed;
        this.tecnica = tecnica;
        this.respeito = respeito;
        this.statusAtuais = statusAtuais;
    }

    public static PokemonResponseDto from(Pokemon p) {
        if (p == null) return null;
        String especie = p.getEspecie();
        if (especie == null) especie = "";
        PokemonResponseDto dto = new PokemonResponseDto(
                p.getId(),
                p.getOrdemTime(),
                p.getPokedexId(),
                especie,
                p.getApelido() != null ? p.getApelido() : null,
                p.getImagemUrl() != null ? p.getImagemUrl() : null,
                p.getNotas() != null ? p.getNotas() : null,
                p.getGenero() != null ? p.getGenero().name() : null,
                p.isShiny(),
                p.getTipoPrimario() != null ? p.getTipoPrimario().name() : null,
                p.getTipoSecundario() != null ? p.getTipoSecundario().name() : null,
                p.getPersonalidade() != null ? p.getPersonalidade().getNome() : null,
                p.getEspecializacao() != null ? p.getEspecializacao().name() : null,
                p.getBerryFavorita() != null ? p.getBerryFavorita() : null,
                p.getNivelDeVinculo(),
                p.getNivel(),
                p.getXpAtual(),
                p.getPokebolaCaptura() != null ? p.getPokebolaCaptura().name() : null,
                p.getItemSegurado() != null ? p.getItemSegurado().getId() : null,
                p.getHpMaximo(),
                p.getHpAtual(),
                p.getHpTemporario(),
                p.getStaminaMaxima(),
                p.getStaminaAtual(),
                p.getStaminaTemporaria(),
                p.getAtaque(),
                p.getAtaqueEspecial(),
                p.getDefesa(),
                p.getDefesaEspecial(),
                p.getSpeed(),
                p.getTecnica(),
                p.getRespeito(),
                p.getStatusAtuais() != null ? p.getStatusAtuais().stream().map(Enum::name).toList() : List.of()
        );
        dto.setPersonalidadeId(p.getPersonalidade() != null ? p.getPersonalidade().getId() : null);
        if (p.getMovimentosConhecidos() != null && !p.getMovimentosConhecidos().isEmpty()) {
            dto.setMovimentosConhecidos(p.getMovimentosConhecidos().stream()
                    .map(MovimentoResponseDto::from)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
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
    public String getGenero() { return genero; }
    public void setGenero(String genero) { this.genero = genero; }
    public boolean isShiny() { return shiny; }
    public void setShiny(boolean shiny) { this.shiny = shiny; }
    public String getTipoPrimario() { return tipoPrimario; }
    public void setTipoPrimario(String tipoPrimario) { this.tipoPrimario = tipoPrimario; }
    public String getTipoSecundario() { return tipoSecundario; }
    public void setTipoSecundario(String tipoSecundario) { this.tipoSecundario = tipoSecundario; }
    public String getPersonalidade() { return personalidade; }
    public void setPersonalidade(String personalidade) { this.personalidade = personalidade; }
    public String getPersonalidadeId() { return personalidadeId; }
    public void setPersonalidadeId(String personalidadeId) { this.personalidadeId = personalidadeId; }
    public String getEspecializacao() { return especializacao; }
    public void setEspecializacao(String especializacao) { this.especializacao = especializacao; }
    public String getBerryFavorita() { return berryFavorita; }
    public void setBerryFavorita(String berryFavorita) { this.berryFavorita = berryFavorita; }
    public int getNivelDeVinculo() { return nivelDeVinculo; }
    public void setNivelDeVinculo(int nivelDeVinculo) { this.nivelDeVinculo = nivelDeVinculo; }
    public int getNivel() { return nivel; }
    public void setNivel(int nivel) { this.nivel = nivel; }
    public int getXpAtual() { return xpAtual; }
    public void setXpAtual(int xpAtual) { this.xpAtual = xpAtual; }
    public String getPokebolaCaptura() { return pokebolaCaptura; }
    public void setPokebolaCaptura(String pokebolaCaptura) { this.pokebolaCaptura = pokebolaCaptura; }
    public String getItemSeguradoId() { return itemSeguradoId; }
    public void setItemSeguradoId(String itemSeguradoId) { this.itemSeguradoId = itemSeguradoId; }
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
    public List<String> getStatusAtuais() { return statusAtuais; }
    public void setStatusAtuais(List<String> statusAtuais) { this.statusAtuais = statusAtuais; }
    public List<MovimentoResponseDto> getMovimentosConhecidos() { return movimentosConhecidos; }
    public void setMovimentosConhecidos(List<MovimentoResponseDto> movimentosConhecidos) { this.movimentosConhecidos = movimentosConhecidos; }
}
