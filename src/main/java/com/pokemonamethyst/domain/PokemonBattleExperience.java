package com.pokemonamethyst.domain;

/**
 * Estimativa de XP ao derrotar um Pokémon (combate). Usa {@code base_experience} da espécie inimiga e os dois níveis.
 * Fórmula deliberadamente simples e escalável: {@code (base × nívelInimigo) / (7 + nívelParticipante/2)}, mínimo 1.
 * Ajuste o denominador ou multiplique por um fator global de campanha se precisar de outro ritmo.
 */
public final class PokemonBattleExperience {

    private PokemonBattleExperience() {}

    /**
     * @param baseExperience   {@code base_experience} (PokéAPI) do inimigo
     * @param nivelInimigo     nível do Pokémon derrotado
     * @param nivelParticipante nível de quem recebe o XP
     */
    public static int xpPorDerrota(int baseExperience, int nivelInimigo, int nivelParticipante) {
        int b = Math.max(1, baseExperience);
        int li = Math.max(1, Math.min(PokemonExperience.MAX_LEVEL, nivelInimigo));
        int lp = Math.max(1, Math.min(PokemonExperience.MAX_LEVEL, nivelParticipante));
        long denom = 7L + (lp / 2L);
        long xp = (long) b * li / Math.max(1L, denom);
        if (xp < 1) {
            xp = 1;
        }
        return (int) Math.min(Integer.MAX_VALUE, xp);
    }
}
