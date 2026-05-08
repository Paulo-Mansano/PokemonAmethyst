package com.pokemonamethyst.domain;

import java.util.concurrent.ThreadLocalRandom;

public enum PokemonIVClass {
    S(601, Integer.MAX_VALUE, 85, 100, 90, 100, 75, 100, 5),
    A(600, 600, 50, 55, 40, 50, 40, 50, 5),
    B(520, 599, 35, 40, 30, 35, 30, 35, 4),
    C(450, 519, 25, 30, 25, 30, 25, 30, 3),
    D(380, 449, 20, 25, 20, 25, 20, 25, 3),
    E(300, 379, 12, 15, 15, 20, 15, 15, 2),
    F(0, 299, 7, 10, 10, 15, 10, 15, 2);

    private final int bstMin;
    private final int bstMax;
    private final int pontosMin;
    private final int pontosMax;
    private final int hpMin;
    private final int hpMax;
    private final int staminaMin;
    private final int staminaMax;
    private final int pontosPorNivel;

    PokemonIVClass(int bstMin,
                   int bstMax,
                   int pontosMin,
                   int pontosMax,
                   int hpMin,
                   int hpMax,
                   int staminaMin,
                   int staminaMax,
                   int pontosPorNivel) {
        this.bstMin = bstMin;
        this.bstMax = bstMax;
        this.pontosMin = pontosMin;
        this.pontosMax = pontosMax;
        this.hpMin = hpMin;
        this.hpMax = hpMax;
        this.staminaMin = staminaMin;
        this.staminaMax = staminaMax;
        this.pontosPorNivel = pontosPorNivel;
    }

    public int getPontosPorNivel() {
        return pontosPorNivel;
    }

    public int rolarPontosDistribuicaoIniciais() {
        return rolarInclusivo(pontosMin, pontosMax);
    }

    public int rolarHpBaseRngInicial() {
        return rolarInclusivo(hpMin, hpMax);
    }

    public int rolarStaminaBaseRngInicial() {
        return rolarInclusivo(staminaMin, staminaMax);
    }

    public int getPontosMin() { return pontosMin; }
    public int getPontosMax() { return pontosMax; }
    public static PokemonIVClass fromBst(int bst) {
        int bstSeguro = Math.max(0, bst);
        for (PokemonIVClass value : values()) {
            if (bstSeguro >= value.bstMin && bstSeguro <= value.bstMax) {
                return value;
            }
        }
        return F;
    }

    private static int rolarInclusivo(int min, int max) {
        if (max <= min) {
            return min;
        }
        return ThreadLocalRandom.current().nextInt(min, max + 1);
    }
}
