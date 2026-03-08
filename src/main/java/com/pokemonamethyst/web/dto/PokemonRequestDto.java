package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class PokemonRequestDto {

    @NotNull @Min(1)
    private Integer pokedexId;

    @NotBlank(message = "Espécie é obrigatória")
    private String especie;

    @NotNull(message = "Tipo primário é obrigatório")
    private Tipagem tipoPrimario;

    private String apelido;
    private String imagemUrl;
    private Tipagem tipoSecundario;
    private Genero genero;
    private Boolean shiny;
    private Personalidade personalidade;
    private Especializacao especializacao;
    private String berryFavorita;
    private Integer nivelDeVinculo;
    private Integer nivel;
    private Integer xpAtual;
    private Pokebola pokebolaCaptura;
    private String itemSeguradoId;
    private Integer hpMaximo;
    private Integer staminaMaxima;

    public int getHpMaximoOrDefault() {
        return hpMaximo != null ? hpMaximo : 20;
    }

    public int getStaminaMaximaOrDefault() {
        return staminaMaxima != null ? staminaMaxima : 10;
    }

    public Integer getPokedexId() { return pokedexId; }
    public void setPokedexId(Integer pokedexId) { this.pokedexId = pokedexId; }
    public String getEspecie() { return especie; }
    public void setEspecie(String especie) { this.especie = especie; }
    public Tipagem getTipoPrimario() { return tipoPrimario; }
    public void setTipoPrimario(Tipagem tipoPrimario) { this.tipoPrimario = tipoPrimario; }
    public String getApelido() { return apelido; }
    public void setApelido(String apelido) { this.apelido = apelido; }
    public String getImagemUrl() { return imagemUrl; }
    public void setImagemUrl(String imagemUrl) { this.imagemUrl = imagemUrl; }
    public Tipagem getTipoSecundario() { return tipoSecundario; }
    public void setTipoSecundario(Tipagem tipoSecundario) { this.tipoSecundario = tipoSecundario; }
    public Genero getGenero() { return genero; }
    public void setGenero(Genero genero) { this.genero = genero; }
    public Boolean getShiny() { return shiny; }
    public void setShiny(Boolean shiny) { this.shiny = shiny; }
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
    public Integer getHpMaximo() { return hpMaximo; }
    public void setHpMaximo(Integer hpMaximo) { this.hpMaximo = hpMaximo; }
    public Integer getStaminaMaxima() { return staminaMaxima; }
    public void setStaminaMaxima(Integer staminaMaxima) { this.staminaMaxima = staminaMaxima; }
}
