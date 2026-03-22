package com.pokemonamethyst.web.dto;

public class PokemonCapturaResponseDto {
    private boolean sucesso;
    private PokemonResponseDto pokemon;

    public PokemonCapturaResponseDto() {
    }

    public PokemonCapturaResponseDto(boolean sucesso, PokemonResponseDto pokemon) {
        this.sucesso = sucesso;
        this.pokemon = pokemon;
    }

    public boolean isSucesso() {
        return sucesso;
    }

    public void setSucesso(boolean sucesso) {
        this.sucesso = sucesso;
    }

    public PokemonResponseDto getPokemon() {
        return pokemon;
    }

    public void setPokemon(PokemonResponseDto pokemon) {
        this.pokemon = pokemon;
    }
}
