package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.Pokemon;

import java.util.List;

public class PokemonGanharXpResponseDto {

    private PokemonResponseDto pokemon;
    private int nivelAntes;
    private int nivelDepois;
    private boolean nivelSubiu;
    private List<MovimentoResponseDto> movimentosAprendendo;

    public static PokemonGanharXpResponseDto from(Pokemon pokemon, int nivelAntes, int nivelDepois, List<MovimentoResponseDto> movimentosAprendendo) {
        PokemonGanharXpResponseDto dto = new PokemonGanharXpResponseDto();
        dto.setPokemon(PokemonResponseDto.from(pokemon));
        dto.setNivelAntes(nivelAntes);
        dto.setNivelDepois(nivelDepois);
        dto.setNivelSubiu(nivelDepois > nivelAntes);
        dto.setMovimentosAprendendo(movimentosAprendendo);
        return dto;
    }

    public PokemonResponseDto getPokemon() {
        return pokemon;
    }

    public void setPokemon(PokemonResponseDto pokemon) {
        this.pokemon = pokemon;
    }

    public int getNivelAntes() {
        return nivelAntes;
    }

    public void setNivelAntes(int nivelAntes) {
        this.nivelAntes = nivelAntes;
    }

    public int getNivelDepois() {
        return nivelDepois;
    }

    public void setNivelDepois(int nivelDepois) {
        this.nivelDepois = nivelDepois;
    }

    public boolean isNivelSubiu() {
        return nivelSubiu;
    }

    public void setNivelSubiu(boolean nivelSubiu) {
        this.nivelSubiu = nivelSubiu;
    }

    public List<MovimentoResponseDto> getMovimentosAprendendo() {
        return movimentosAprendendo;
    }

    public void setMovimentosAprendendo(List<MovimentoResponseDto> movimentosAprendendo) {
        this.movimentosAprendendo = movimentosAprendendo;
    }
}

