package com.pokemonamethyst.web.dto;

import jakarta.validation.constraints.NotNull;

public class PokemonCapturaRequestDto {
    @NotNull
    private Boolean sucesso;

    public Boolean getSucesso() {
        return sucesso;
    }

    public void setSucesso(Boolean sucesso) {
        this.sucesso = sucesso;
    }
}
