package com.pokemonamethyst.domain;

/**
 * Fórmulas oficiais (Gen III+): HP e demais status usam o mesmo termo interno;
 * HP adiciona (nível + 10), os outros adicionam +5. Natureza (1,1 / 1,1 / 0,9) fica para quando existir no sistema.
 */
public final class PokemonStatsCalculator {

    public static final int IV_MAX = 31;
    public static final int EV_MAX_POR_STAT = 252;
    public static final int EV_MAX_TOTAL = 510;

    private PokemonStatsCalculator() {}

    /**
     * floor(0,01 × (2×Base + IV + floor(0,25×EV)) × Nível) + Nível + 10
     */
    public static int hpMaximo(int base, int iv, int ev, int nivel) {
        return termoInterno(base, iv, ev, nivel) + nivel + 10;
    }

    /**
     * floor(0,01 × (2×Base + IV + floor(0,25×EV)) × Nível) + 5 — sem multiplicador de natureza.
     */
    public static int statNaoHp(int base, int iv, int ev, int nivel) {
        return termoInterno(base, iv, ev, nivel) + 5;
    }

    private static int termoInterno(int base, int iv, int ev, int nivel) {
        int b = Math.max(1, base);
        int ivc = clamp(iv, 0, IV_MAX);
        int evc = clamp(ev, 0, EV_MAX_POR_STAT);
        int evTerm = evc / 4;
        long inner = (long) (2 * b + ivc + evTerm) * Math.max(1, nivel);
        return (int) (inner / 100);
    }

    private static int clamp(int v, int min, int max) {
        return Math.max(min, Math.min(max, v));
    }
}
