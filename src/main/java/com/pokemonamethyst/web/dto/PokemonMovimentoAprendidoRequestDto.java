package com.pokemonamethyst.web.dto;

import jakarta.validation.constraints.NotBlank;

public class PokemonMovimentoAprendidoRequestDto {

    @NotBlank
    private String movimentoId;

    private String substituirMovimentoId;

    private Integer nivelRascunho;

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

    public Integer getNivelRascunho() {
        return nivelRascunho;
    }

    public void setNivelRascunho(Integer nivelRascunho) {
        this.nivelRascunho = nivelRascunho;
    }
}

