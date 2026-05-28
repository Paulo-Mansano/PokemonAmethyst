package com.pokemonamethyst.web.dto;

public class PokemonLevelDownPreviewDto {

    private int nivelAntes;
    private int nivelDepois;
    private int pontosExcedentes;

    public PokemonLevelDownPreviewDto() {}

    public PokemonLevelDownPreviewDto(int nivelAntes, int nivelDepois, int pontosExcedentes) {
        this.nivelAntes = nivelAntes;
        this.nivelDepois = nivelDepois;
        this.pontosExcedentes = pontosExcedentes;
    }

    public int getNivelAntes() { return nivelAntes; }
    public void setNivelAntes(int nivelAntes) { this.nivelAntes = nivelAntes; }

    public int getNivelDepois() { return nivelDepois; }
    public void setNivelDepois(int nivelDepois) { this.nivelDepois = nivelDepois; }

    public int getPontosExcedentes() { return pontosExcedentes; }
    public void setPontosExcedentes(int pontosExcedentes) { this.pontosExcedentes = pontosExcedentes; }
}
