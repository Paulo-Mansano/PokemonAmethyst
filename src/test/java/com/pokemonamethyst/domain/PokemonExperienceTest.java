package com.pokemonamethyst.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PokemonExperienceTest {

    @Test
    void totaisNivel100_batemComTabelasOficiais() {
        assertThat(PokemonExperience.getTotalXpForLevel(100, GrowthRate.MEDIUM_FAST)).isEqualTo(1_000_000);
        assertThat(PokemonExperience.getTotalXpForLevel(100, GrowthRate.FAST)).isEqualTo(800_000);
        assertThat(PokemonExperience.getTotalXpForLevel(100, GrowthRate.SLOW)).isEqualTo(1_250_000);
        assertThat(PokemonExperience.getTotalXpForLevel(100, GrowthRate.ERRATIC)).isEqualTo(600_000);
        assertThat(PokemonExperience.getTotalXpForLevel(100, GrowthRate.FLUCTUATING)).isEqualTo(1_640_000);
        assertThat(PokemonExperience.getTotalXpForLevel(100, GrowthRate.MEDIUM_SLOW)).isEqualTo(1_059_860);
    }

    @Test
    void mediumFast_nivelCalculadoPeloXpCumulativo() {
        assertThat(PokemonExperience.calculateLevelFromXp(7, GrowthRate.MEDIUM_FAST)).isEqualTo(1);
        assertThat(PokemonExperience.calculateLevelFromXp(8, GrowthRate.MEDIUM_FAST)).isEqualTo(2);
        assertThat(PokemonExperience.calculateLevelFromXp(999_999, GrowthRate.MEDIUM_FAST)).isEqualTo(99);
        assertThat(PokemonExperience.calculateLevelFromXp(1_000_000, GrowthRate.MEDIUM_FAST)).isEqualTo(100);
    }

    @Test
    void xpParaProximoNivel_mediumFastNivel1() {
        assertThat(PokemonExperience.getXpToNextLevel(1, GrowthRate.MEDIUM_FAST)).isEqualTo(8);
    }

    @Test
    void pokeApiSlug_mediumEhMediumSlow() {
        assertThat(GrowthRate.fromPokeApiSlug("medium")).isEqualTo(GrowthRate.MEDIUM_SLOW);
        assertThat(GrowthRate.fromPokeApiSlug("medium-slow")).isEqualTo(GrowthRate.MEDIUM_FAST);
        assertThat(GrowthRate.fromPokeApiSlug("slow-then-very-fast")).isEqualTo(GrowthRate.ERRATIC);
        assertThat(GrowthRate.fromPokeApiSlug("fast-then-very-slow")).isEqualTo(GrowthRate.FLUCTUATING);
    }
}
