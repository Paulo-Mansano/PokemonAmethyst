package com.pokemonamethyst.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PokemonBattleExperienceTest {

    @Test
    void retornaPeloMenosUm() {
        assertThat(PokemonBattleExperience.xpPorDerrota(50, 5, 50)).isGreaterThanOrEqualTo(1);
    }
}
