package com.pokemonamethyst.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class PokemonGanharXpRequestDto {

    @NotNull
    @Min(1)
    private Integer xpGanho;

    public Integer getXpGanho() {
        return xpGanho;
    }

    public void setXpGanho(Integer xpGanho) {
        this.xpGanho = xpGanho;
    }
}

