package com.pokemonamethyst.web.dto;

import java.util.Map;

public class PokemonBatalhaCalculoResponseDto {
    private int danoMinimo;
    private int danoMaximo;
    private int danoAplicado;
    private String formula;
    private Map<String, Double> multiplicadores;
    private String atacanteId;
    private String defensorId;
    private int hpAtualDefensor;
    private int hpMaximoDefensor;

    public int getDanoMinimo() {
        return danoMinimo;
    }

    public void setDanoMinimo(int danoMinimo) {
        this.danoMinimo = danoMinimo;
    }

    public int getDanoMaximo() {
        return danoMaximo;
    }

    public void setDanoMaximo(int danoMaximo) {
        this.danoMaximo = danoMaximo;
    }

    public int getDanoAplicado() {
        return danoAplicado;
    }

    public void setDanoAplicado(int danoAplicado) {
        this.danoAplicado = danoAplicado;
    }

    public String getFormula() {
        return formula;
    }

    public void setFormula(String formula) {
        this.formula = formula;
    }

    public Map<String, Double> getMultiplicadores() {
        return multiplicadores;
    }

    public void setMultiplicadores(Map<String, Double> multiplicadores) {
        this.multiplicadores = multiplicadores;
    }

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

    public int getHpAtualDefensor() {
        return hpAtualDefensor;
    }

    public void setHpAtualDefensor(int hpAtualDefensor) {
        this.hpAtualDefensor = hpAtualDefensor;
    }

    public int getHpMaximoDefensor() {
        return hpMaximoDefensor;
    }

    public void setHpMaximoDefensor(int hpMaximoDefensor) {
        this.hpMaximoDefensor = hpMaximoDefensor;
    }
}
