package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.Movimento;

import java.util.List;

public class PokemonXpPreviewResponseDto {

    private int xpAntes;
    private int xpDepois;
    private int nivelAntes;
    private int nivelDepois;
    private boolean nivelSubiu;
    private List<MovimentoResponseDto> movimentosAprendendo;

    public static PokemonXpPreviewResponseDto from(int xpAntes,
                                                   int xpDepois,
                                                   int nivelAntes,
                                                   int nivelDepois,
                                                   List<Movimento> movimentosAprendendo) {
        PokemonXpPreviewResponseDto dto = new PokemonXpPreviewResponseDto();
        dto.setXpAntes(xpAntes);
        dto.setXpDepois(xpDepois);
        dto.setNivelAntes(nivelAntes);
        dto.setNivelDepois(nivelDepois);
        dto.setNivelSubiu(nivelDepois > nivelAntes);
        dto.setMovimentosAprendendo(
                movimentosAprendendo == null
                        ? List.of()
                        : movimentosAprendendo.stream().map(MovimentoResponseDto::from).toList()
        );
        return dto;
    }

    public int getXpAntes() {
        return xpAntes;
    }

    public void setXpAntes(int xpAntes) {
        this.xpAntes = xpAntes;
    }

    public int getXpDepois() {
        return xpDepois;
    }

    public void setXpDepois(int xpDepois) {
        this.xpDepois = xpDepois;
    }

    public int getNivelAntes() {
        return nivelAntes;
    }

    public void setNivelAntes(int nivelAntes) {
        this.nivelAntes = nivelAntes;
    }

    public int getNivelDepois() {
        return nivelDepois;
    }

    public void setNivelDepois(int nivelDepois) {
        this.nivelDepois = nivelDepois;
    }

    public boolean isNivelSubiu() {
        return nivelSubiu;
    }

    public void setNivelSubiu(boolean nivelSubiu) {
        this.nivelSubiu = nivelSubiu;
    }

    public List<MovimentoResponseDto> getMovimentosAprendendo() {
        return movimentosAprendendo;
    }

    public void setMovimentosAprendendo(List<MovimentoResponseDto> movimentosAprendendo) {
        this.movimentosAprendendo = movimentosAprendendo;
    }
}
