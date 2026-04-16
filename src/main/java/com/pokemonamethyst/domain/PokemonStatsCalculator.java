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

    public static int hpMaximo(Pokemon pokemon) {
        if (pokemon == null) {
            return 1;
        }
        int base = Math.max(0, pokemon.getHpBaseRng());
        int investido = Math.max(0, pokemon.getAtrHp());
        return base + investido + bonusAutomaticoHpStamina(pokemon.getNivel());
    }

    public static int staminaMaxima(Pokemon pokemon) {
        if (pokemon == null) {
            return 1;
        }
        int base = Math.max(0, pokemon.getStaminaBaseRng());
        int investido = Math.max(0, pokemon.getAtrStamina());
        return base + investido + bonusAutomaticoHpStamina(pokemon.getNivel());
    }

    public static int statLivre(Pokemon pokemon, String atributo) {
        if (pokemon == null || atributo == null) {
            return 0;
        }
        return switch (atributo) {
            case "atr_ataque" -> Math.max(0, pokemon.getAtrAtaque());
            case "atr_defesa" -> Math.max(0, pokemon.getAtrDefesa());
            case "atr_ataque_especial" -> Math.max(0, pokemon.getAtrAtaqueEspecial());
            case "atr_defesa_especial" -> Math.max(0, pokemon.getAtrDefesaEspecial());
            case "atr_speed" -> Math.max(0, pokemon.getAtrSpeed());
            case "atr_hp" -> Math.max(0, pokemon.getAtrHp());
            case "atr_stamina" -> Math.max(0, pokemon.getAtrStamina());
            case "atr_tecnica" -> Math.max(0, pokemon.getAtrTecnica());
            case "atr_respeito" -> Math.max(0, pokemon.getAtrRespeito());
            default -> 0;
        };
    }

    public static int bonusAutomaticoHpStamina(int nivel) {
        return Math.max(0, Math.min(9, Math.max(1, nivel) - 1));
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
