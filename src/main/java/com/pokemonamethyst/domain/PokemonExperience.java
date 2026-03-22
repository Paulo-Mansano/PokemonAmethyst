package com.pokemonamethyst.domain;

/**
 * Sistema de experiência cumulativa (Gen III+): o XP total define o nível; a curva depende da taxa de crescimento.
 * Valores em cache para níveis 1–100 (sem recalcular potências a cada request).
 */
public final class PokemonExperience {

    public static final int MIN_LEVEL = 1;
    public static final int MAX_LEVEL = 100;

    private static final int[][] TOTAL_XP_CACHE = new int[GrowthRate.values().length][MAX_LEVEL + 1];

    static {
        for (GrowthRate g : GrowthRate.values()) {
            for (int lv = 1; lv <= MAX_LEVEL; lv++) {
                TOTAL_XP_CACHE[g.ordinal()][lv] = computeTotalXpUncached(lv, g);
            }
        }
    }

    private PokemonExperience() {}

    /**
     * XP total cumulativo necessário para <strong>atingir</strong> o nível {@code level}
     * (no nível 1 o Pokémon começa com 0 XP).
     */
    public static int getTotalXpForLevel(int level, GrowthRate growthRate) {
        if (level <= MIN_LEVEL) {
            return 0;
        }
        if (level > MAX_LEVEL) {
            level = MAX_LEVEL;
        }
        return TOTAL_XP_CACHE[growthRate.ordinal()][level];
    }

    /**
     * Maior nível L tal que {@code xpTotal >= getTotalXpForLevel(L)} (limitado a 100).
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
     * XP necessário para subir do nível {@code nivelAtual} para o próximo (diferença entre limiares cumulativos).
     * No nível 100 retorna 0.
     */
    public static int getXpToNextLevel(int nivelAtual, GrowthRate growthRate) {
        if (nivelAtual >= MAX_LEVEL) {
            return 0;
        }
        int n = Math.max(MIN_LEVEL, Math.min(MAX_LEVEL - 1, nivelAtual));
        return getTotalXpForLevel(n + 1, growthRate) - getTotalXpForLevel(n, growthRate);
    }

    /**
     * Quanto XP falta até o próximo limiar de nível, dado o XP total atual.
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

    private static int computeTotalXpUncached(int level, GrowthRate g) {
        if (level <= 1) {
            return 0;
        }
        return switch (g) {
            case FAST -> fast(level);
            case MEDIUM_FAST -> mediumFast(level);
            case MEDIUM_SLOW -> mediumSlow(level);
            case SLOW -> slow(level);
            case ERRATIC -> erratic(level);
            case FLUCTUATING -> fluctuating(level);
        };
    }

    /** 4/5 × n³ */
    private static int fast(int n) {
        return (4 * n * n * n) / 5;
    }

    /** n³ */
    private static int mediumFast(int n) {
        return n * n * n;
    }

    /** 6/5 × n³ − 15n² + 100n − 140 */
    private static int mediumSlow(int n) {
        return (6 * n * n * n) / 5 - 15 * n * n + 100 * n - 140;
    }

    /** 5/4 × n³ */
    private static int slow(int n) {
        return (5 * n * n * n) / 4;
    }

    private static int erratic(int n) {
        long n3 = (long) n * n * n;
        if (n <= 50) {
            return (int) (n3 * (100 - n) / 50);
        }
        if (n <= 68) {
            return (int) (n3 * (150 - n) / 100);
        }
        if (n <= 98) {
            return (int) (n3 * ((1911 - 10 * n) / 3) / 100);
        }
        return (int) (n3 * (160 - n) / 100);
    }

    private static int fluctuating(int n) {
        long n3 = (long) n * n * n;
        if (n <= 15) {
            return (int) (n3 * (24 + (n + 1) / 3) / 50);
        }
        if (n <= 35) {
            return (int) (n3 * (14 + n) / 50);
        }
        return (int) (n3 * (32 + n / 2) / 50);
    }
}
