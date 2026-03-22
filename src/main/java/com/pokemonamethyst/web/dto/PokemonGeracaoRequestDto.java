package com.pokemonamethyst.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public class PokemonGeracaoRequestDto {
    private Integer pokedexId;

    @Min(1)
    @Max(100)
    private Integer nivel;

    public Integer getPokedexId() {
        return pokedexId;
    }

    public void setPokedexId(Integer pokedexId) {
        this.pokedexId = pokedexId;
    }

    public Integer getNivel() {
        return nivel;
    }

    public void setNivel(Integer nivel) {
        this.nivel = nivel;
    }
}
