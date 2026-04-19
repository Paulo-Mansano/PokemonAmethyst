package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.*;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public class PokemonRequestDto {

    @NotNull(message = "pokedexId é obrigatório para criar um Pokémon.")
    @Min(1)
    private Integer pokedexId;

    private String apelido;
    private Genero genero;
    private Boolean shiny;
    private String personalidadeId;
    private Especializacao especializacao;
    private String berryFavorita;
    private Integer nivelDeVinculo;
    private Integer nivel;
    private Integer xpAtual;
    private Pokebola pokebolaCaptura;
    private String itemSeguradoId;
    private Integer staminaMaxima;

    @Size(max = 6, message = "Máximo de 6 ataques")
    private List<String> movimentoIds;

    public int getStaminaMaximaOrDefault() {
        return staminaMaxima != null ? staminaMaxima : 10;
    }

    public Integer getPokedexId() { return pokedexId; }
    public void setPokedexId(Integer pokedexId) { this.pokedexId = pokedexId; }
    public String getApelido() { return apelido; }
    public void setApelido(String apelido) { this.apelido = apelido; }
    public Genero getGenero() { return genero; }
    public void setGenero(Genero genero) { this.genero = genero; }
    public Boolean getShiny() { return shiny; }
    public void setShiny(Boolean shiny) { this.shiny = shiny; }
    public String getPersonalidadeId() { return personalidadeId; }
    public void setPersonalidadeId(String personalidadeId) { this.personalidadeId = personalidadeId; }
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
    public Integer getStaminaMaxima() { return staminaMaxima; }
    public void setStaminaMaxima(Integer staminaMaxima) { this.staminaMaxima = staminaMaxima; }
    public List<String> getMovimentoIds() { return movimentoIds; }
    public void setMovimentoIds(List<String> movimentoIds) { this.movimentoIds = movimentoIds; }
}
