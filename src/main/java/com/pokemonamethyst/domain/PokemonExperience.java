package com.pokemonamethyst.domain;

/**
 * Sistema de experiência cumulativa linear: o XP total define o nível com a regra
 * {@code XP para subir de n para n+1 = n*10}.
 */
public final class PokemonExperience {

    public static final int MIN_LEVEL = 1;
    public static final int MAX_LEVEL = 100;

    private PokemonExperience() {}

    /**
     * XP total cumulativo necessário para <strong>atingir</strong> o nível {@code level}.
     * No nível 1 o Pokémon começa com 0 XP.
     *
     * O parâmetro {@code growthRate} é mantido por compatibilidade e não influencia o cálculo.
     */
    public static int getTotalXpForLevel(int level, GrowthRate growthRate) {
        if (level <= MIN_LEVEL) {
            return 0;
        }
        int lv = Math.min(level, MAX_LEVEL);
        long n = lv - 1L;
        long total = 5L * n * (n + 1L);
        return (int) Math.min(Integer.MAX_VALUE, total);
    }

    /**
     * Maior nível L tal que {@code xpTotal >= getTotalXpForLevel(L)} (limitado a 100).
     *
     * O parâmetro {@code growthRate} é mantido por compatibilidade e não influencia o cálculo.
     */
    public static int calculateLevelFromXp(int xpTotal, GrowthRate growthRate) {
        int xp = Math.max(0, xpTotal);
        int maxXp = getTotalXpForLevel(MAX_LEVEL, growthRate);
        if (xp >= maxXp) {
            return MAX_LEVEL;
        }
        int lo = MIN_LEVEL;
        int hi = MAX_LEVEL;
        while (lo < hi) {
            int mid = (lo + hi + 1) >>> 1;
            if (getTotalXpForLevel(mid, growthRate) <= xp) {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }
        return lo;
    }

    /**
     * XP necessário para subir do nível {@code nivelAtual} para o próximo.
     * No nível 100 retorna 0.
     *
     * O parâmetro {@code growthRate} é mantido por compatibilidade e não influencia o cálculo.
     */
    public static int getXpToNextLevel(int nivelAtual, GrowthRate growthRate) {
        if (nivelAtual >= MAX_LEVEL) {
            return 0;
        }
        int n = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL - 1, nivelAtual));
        return n * 10;
    }

    /**
     * Quanto XP falta até o próximo limiar de nível, dado o XP total atual.
     *
     * O parâmetro {@code growthRate} é mantido por compatibilidade e não influencia o cálculo.
     */
    public static int getXpRestanteParaProximoNivel(int xpTotal, int nivelAtual, GrowthRate growthRate) {
        if (nivelAtual >= MAX_LEVEL) {
            return 0;
        }
        int proximo = getTotalXpForLevel(nivelAtual + 1, growthRate);
        return Math.max(0, proximo - Math.max(0, xpTotal));
    }

    public static int clampXpTotal(int xpTotal, GrowthRate growthRate) {
        return Math.max(0, Math.min(xpTotal, getTotalXpForLevel(MAX_LEVEL, growthRate)));
    }
}
