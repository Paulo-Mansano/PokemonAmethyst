package com.pokemonamethyst.web.dto;

import jakarta.validation.constraints.NotBlank;

public class PokemonMovimentoAprendidoRequestDto {

    @NotBlank
    private String movimentoId;

    // Opcional: quando o Pokémon já tiver no limite de ataques (6), define qual movimento será substituído.
    private String substituirMovimentoId;

    public String getMovimentoId() {
        return movimentoId;
    }

    public void setMovimentoId(String movimentoId) {
        this.movimentoId = movimentoId;
    }

    public String getSubstituirMovimentoId() {
        return substituirMovimentoId;
    }

    public void setSubstituirMovimentoId(String substituirMovimentoId) {
        this.substituirMovimentoId = substituirMovimentoId;
    }
}

