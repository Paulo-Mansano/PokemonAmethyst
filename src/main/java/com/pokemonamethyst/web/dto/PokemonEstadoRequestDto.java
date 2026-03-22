package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.EstadoPokemon;
import jakarta.validation.constraints.NotNull;

public class PokemonEstadoRequestDto {
    @NotNull
    private EstadoPokemon estado;

    public EstadoPokemon getEstado() {
        return estado;
    }

    public void setEstado(EstadoPokemon estado) {
        this.estado = estado;
    }
}
