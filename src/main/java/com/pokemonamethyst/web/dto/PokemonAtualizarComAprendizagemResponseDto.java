package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.Movimento;
import com.pokemonamethyst.domain.Pokemon;

import java.util.List;

public class PokemonAtualizarComAprendizagemResponseDto {

    private PokemonResponseDto pokemon;
    private int nivelAntes;
    private int nivelDepois;
    private boolean nivelSubiu;
    private int xpAntes;
    private int xpDepois;
    private List<MovimentoResponseDto> movimentosAprendendo;

    public static PokemonAtualizarComAprendizagemResponseDto from(Pokemon pokemon,
                                                                     int nivelAntes,
                                                                     int nivelDepois,
                                                                     int xpAntes,
                                                                     int xpDepois,
                                                                     List<Movimento> movimentosAprendendo) {
        PokemonAtualizarComAprendizagemResponseDto dto = new PokemonAtualizarComAprendizagemResponseDto();
        dto.setPokemon(PokemonResponseDto.from(pokemon));
        dto.setNivelAntes(nivelAntes);
        dto.setNivelDepois(nivelDepois);
        dto.setNivelSubiu(nivelDepois > nivelAntes);
        dto.setXpAntes(xpAntes);
        dto.setXpDepois(xpDepois);
        dto.setMovimentosAprendendo(
                movimentosAprendendo == null
                        ? List.of()
                        : movimentosAprendendo.stream().map(MovimentoResponseDto::from).toList()
        );
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

    public int getXpAntes() {
        return xpAntes;
    }

    public void setXpAntes(int xpAntes) {
        this.xpAntes = xpAntes;
    }

    public int getXpDepois() {
        return xpDepois;
    }

    public void setXpDepois(int xpDepois) {
        this.xpDepois = xpDepois;
    }

    public List<MovimentoResponseDto> getMovimentosAprendendo() {
        return movimentosAprendendo;
    }

    public void setMovimentosAprendendo(List<MovimentoResponseDto> movimentosAprendendo) {
        this.movimentosAprendendo = movimentosAprendendo;
    }
}

