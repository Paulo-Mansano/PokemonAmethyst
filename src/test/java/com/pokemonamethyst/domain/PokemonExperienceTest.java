package com.pokemonamethyst.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PokemonExperienceTest {

    @Test
    void totaisDeXpSeguemCurvaLinearCumulativa() {
        assertThat(PokemonExperience.getTotalXpForLevel(1, GrowthRate.MEDIUM_FAST)).isEqualTo(0);
        assertThat(PokemonExperience.getTotalXpForLevel(2, GrowthRate.MEDIUM_FAST)).isEqualTo(10);
        assertThat(PokemonExperience.getTotalXpForLevel(3, GrowthRate.MEDIUM_FAST)).isEqualTo(30);
        assertThat(PokemonExperience.getTotalXpForLevel(100, GrowthRate.MEDIUM_FAST)).isEqualTo(49_500);
    }

    @Test
    void nivelCalculadoPelosLimiaresLineares() {
        assertThat(PokemonExperience.calculateLevelFromXp(9, GrowthRate.MEDIUM_FAST)).isEqualTo(1);
        assertThat(PokemonExperience.calculateLevelFromXp(10, GrowthRate.MEDIUM_FAST)).isEqualTo(2);
        assertThat(PokemonExperience.calculateLevelFromXp(29, GrowthRate.MEDIUM_FAST)).isEqualTo(2);
        assertThat(PokemonExperience.calculateLevelFromXp(30, GrowthRate.MEDIUM_FAST)).isEqualTo(3);
        assertThat(PokemonExperience.calculateLevelFromXp(49_499, GrowthRate.MEDIUM_FAST)).isEqualTo(99);
        assertThat(PokemonExperience.calculateLevelFromXp(49_500, GrowthRate.MEDIUM_FAST)).isEqualTo(100);
    }

    @Test
    void xpParaProximoNivelSegueNivelAtualVezesDez() {
        assertThat(PokemonExperience.getXpToNextLevel(1, GrowthRate.MEDIUM_FAST)).isEqualTo(10);
        assertThat(PokemonExperience.getXpToNextLevel(2, GrowthRate.MEDIUM_FAST)).isEqualTo(20);
        assertThat(PokemonExperience.getXpToNextLevel(99, GrowthRate.MEDIUM_FAST)).isEqualTo(990);
        assertThat(PokemonExperience.getXpToNextLevel(100, GrowthRate.MEDIUM_FAST)).isZero();
    }

    @Test
    void curvaEhIndependenteDaTaxaDeCrescimento() {
        assertThat(PokemonExperience.getTotalXpForLevel(25, GrowthRate.FAST))
                .isEqualTo(PokemonExperience.getTotalXpForLevel(25, GrowthRate.SLOW));
    }

    @Test
    void pokeApiSlug_mediumEhMediumSlow() {
        assertThat(GrowthRate.fromPokeApiSlug("medium")).isEqualTo(GrowthRate.MEDIUM_FAST);
        assertThat(GrowthRate.fromPokeApiSlug("medium-slow")).isEqualTo(GrowthRate.MEDIUM_SLOW);
        assertThat(GrowthRate.fromPokeApiSlug("slow-then-very-fast")).isEqualTo(GrowthRate.ERRATIC);
        assertThat(GrowthRate.fromPokeApiSlug("fast-then-very-slow")).isEqualTo(GrowthRate.FLUCTUATING);
    }
}
