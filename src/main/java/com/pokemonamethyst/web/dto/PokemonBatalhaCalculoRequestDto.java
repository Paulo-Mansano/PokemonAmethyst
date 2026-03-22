package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.CategoriaMovimento;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class PokemonBatalhaCalculoRequestDto {
    @NotBlank
    private String atacanteId;

    @NotBlank
    private String defensorId;

    @NotNull
    @Min(1)
    @Max(300)
    private Integer poder;

    private CategoriaMovimento categoria;
    private String movimentoNome;
    private String movimentoTipo;

    @NotNull
    private Double stabMultiplier = 1.0;

    @NotNull
    private Double typeMultiplier = 1.0;

    private boolean critico;
    private boolean queimado;

    @NotNull
    private Double otherMultiplier = 1.0;

    private Double randomMin = 0.85;
    private Double randomMax = 1.0;
    private Double randomValue;

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

    public Integer getPoder() {
        return poder;
    }

    public void setPoder(Integer poder) {
        this.poder = poder;
    }

    public CategoriaMovimento getCategoria() {
        return categoria;
    }

    public void setCategoria(CategoriaMovimento categoria) {
        this.categoria = categoria;
    }

    public String getMovimentoNome() {
        return movimentoNome;
    }

    public void setMovimentoNome(String movimentoNome) {
        this.movimentoNome = movimentoNome;
    }

    public String getMovimentoTipo() {
        return movimentoTipo;
    }

    public void setMovimentoTipo(String movimentoTipo) {
        this.movimentoTipo = movimentoTipo;
    }

    public Double getStabMultiplier() {
        return stabMultiplier;
    }

    public void setStabMultiplier(Double stabMultiplier) {
        this.stabMultiplier = stabMultiplier;
    }

    public Double getTypeMultiplier() {
        return typeMultiplier;
    }

    public void setTypeMultiplier(Double typeMultiplier) {
        this.typeMultiplier = typeMultiplier;
    }

    public boolean isCritico() {
        return critico;
    }

    public void setCritico(boolean critico) {
        this.critico = critico;
    }

    public boolean isQueimado() {
        return queimado;
    }

    public void setQueimado(boolean queimado) {
        this.queimado = queimado;
    }

    public Double getOtherMultiplier() {
        return otherMultiplier;
    }

    public void setOtherMultiplier(Double otherMultiplier) {
        this.otherMultiplier = otherMultiplier;
    }

    public Double getRandomMin() {
        return randomMin;
    }

    public void setRandomMin(Double randomMin) {
        this.randomMin = randomMin;
    }

    public Double getRandomMax() {
        return randomMax;
    }

    public void setRandomMax(Double randomMax) {
        this.randomMax = randomMax;
    }

    public Double getRandomValue() {
        return randomValue;
    }

    public void setRandomValue(Double randomValue) {
        this.randomValue = randomValue;
    }
}
