package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.*;

import java.util.List;

public class PokemonAtualizarRequestDto {

    private String apelido;
    private String imagemUrl;
    private String notas;
    private Genero genero;
    private Boolean shiny;
    private Tipagem tipoSecundario;
    private Personalidade personalidade;
    private Especializacao especializacao;
    private String berryFavorita;
    private Integer nivelDeVinculo;
    private Integer nivel;
    private Integer xpAtual;
    private Pokebola pokebolaCaptura;
    private String itemSeguradoId;
    private Integer hpAtual;
    private Integer hpTemporario;
    private Integer staminaAtual;
    private Integer staminaTemporaria;
    private Integer ataque;
    private Integer ataqueEspecial;
    private Integer defesa;
    private Integer defesaEspecial;
    private Integer speed;
    private Integer tecnica;
    private Integer respeito;
    private List<CondicaoStatus> statusAtuais;

    public String getApelido() { return apelido; }
    public void setApelido(String apelido) { this.apelido = apelido; }
    public String getImagemUrl() { return imagemUrl; }
    public void setImagemUrl(String imagemUrl) { this.imagemUrl = imagemUrl; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
    public Genero getGenero() { return genero; }
    public void setGenero(Genero genero) { this.genero = genero; }
    public Boolean getShiny() { return shiny; }
    public void setShiny(Boolean shiny) { this.shiny = shiny; }
    public Tipagem getTipoSecundario() { return tipoSecundario; }
    public void setTipoSecundario(Tipagem tipoSecundario) { this.tipoSecundario = tipoSecundario; }
    public Personalidade getPersonalidade() { return personalidade; }
    public void setPersonalidade(Personalidade personalidade) { this.personalidade = personalidade; }
    public Especializacao getEspecializacao() { return especializacao; }
    public void setEspecializacao(Especializacao especializacao) { this.especializacao = especializacao; }
    public String getBerryFavorita() { return berryFavorita; }
    public void setBerryFavorita(String berryFavorita) { this.berryFavorita = berryFavorita; }
    public Integer getNivelDeVinculo() { return nivelDeVinculo; }
    public void setNivelDeVinculo(Integer nivelDeVinculo) { this.nivelDeVinculo = nivelDeVinculo; }
    public Integer getNivel() { return nivel; }
    public void setNivel(Integer nivel) { this.nivel = nivel; }
    public Integer getXpAtual() { return xpAtual; }
    public void setXpAtual(Integer xpAtual) { this.xpAtual = xpAtual; }
    public Pokebola getPokebolaCaptura() { return pokebolaCaptura; }
    public void setPokebolaCaptura(Pokebola pokebolaCaptura) { this.pokebolaCaptura = pokebolaCaptura; }
    public String getItemSeguradoId() { return itemSeguradoId; }
    public void setItemSeguradoId(String itemSeguradoId) { this.itemSeguradoId = itemSeguradoId; }
    public Integer getHpAtual() { return hpAtual; }
    public void setHpAtual(Integer hpAtual) { this.hpAtual = hpAtual; }
    public Integer getHpTemporario() { return hpTemporario; }
    public void setHpTemporario(Integer hpTemporario) { this.hpTemporario = hpTemporario; }
    public Integer getStaminaAtual() { return staminaAtual; }
    public void setStaminaAtual(Integer staminaAtual) { this.staminaAtual = staminaAtual; }
    public Integer getStaminaTemporaria() { return staminaTemporaria; }
    public void setStaminaTemporaria(Integer staminaTemporaria) { this.staminaTemporaria = staminaTemporaria; }
    public Integer getAtaque() { return ataque; }
    public void setAtaque(Integer ataque) { this.ataque = ataque; }
    public Integer getAtaqueEspecial() { return ataqueEspecial; }
    public void setAtaqueEspecial(Integer ataqueEspecial) { this.ataqueEspecial = ataqueEspecial; }
    public Integer getDefesa() { return defesa; }
    public void setDefesa(Integer defesa) { this.defesa = defesa; }
    public Integer getDefesaEspecial() { return defesaEspecial; }
    public void setDefesaEspecial(Integer defesaEspecial) { this.defesaEspecial = defesaEspecial; }
    public Integer getSpeed() { return speed; }
    public void setSpeed(Integer speed) { this.speed = speed; }
    public Integer getTecnica() { return tecnica; }
    public void setTecnica(Integer tecnica) { this.tecnica = tecnica; }
    public Integer getRespeito() { return respeito; }
    public void setRespeito(Integer respeito) { this.respeito = respeito; }
    public List<CondicaoStatus> getStatusAtuais() { return statusAtuais; }
    public void setStatusAtuais(List<CondicaoStatus> statusAtuais) { this.statusAtuais = statusAtuais; }
}
