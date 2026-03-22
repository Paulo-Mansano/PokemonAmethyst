package com.pokemonamethyst.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class PokemonBatalhaAplicarDanoRequestDto {
    @NotBlank
    private String atacanteId;

    @NotBlank
    private String defensorId;

    @NotNull
    @Min(0)
    private Integer danoAplicado;

    public String getAtacanteId() {
        return atacanteId;
    }

    public void setAtacanteId(String atacanteId) {
        this.atacanteId = atacanteId;
    }

    public String getDefensorId() {
        return defensorId;
    }

    public void setDefensorId(String defensorId) {
        this.defensorId = defensorId;
    }

    public Integer getDanoAplicado() {
        return danoAplicado;
    }

    public void setDanoAplicado(Integer danoAplicado) {
        this.danoAplicado = danoAplicado;
    }
}
