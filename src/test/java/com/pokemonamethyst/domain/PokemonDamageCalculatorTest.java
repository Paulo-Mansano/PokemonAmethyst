package com.pokemonamethyst.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PokemonDamageCalculatorTest {

    @Test
    void calculaFaixaComCriticoStabEType() {
        PokemonDamageCalculator.DamageInput input = new PokemonDamageCalculator.DamageInput(
                50,
                90,
                120,
                100,
                true,
                true,
                false,
                1.5,
                2.0,
                1.0,
                0.85,
                1.0,
                0.93
        );
        PokemonDamageCalculator.DamageResult result = PokemonDamageCalculator.calcular(input);
        assertThat(result.danoMinimo()).isPositive();
        assertThat(result.danoMaximo()).isGreaterThanOrEqualTo(result.danoMinimo());
        assertThat(result.danoAplicado()).isBetween(result.danoMinimo(), result.danoMaximo());
        assertThat(result.multiplicadores()).containsEntry("critical", 1.5);
        assertThat(result.multiplicadores()).containsEntry("stab", 1.5);
        assertThat(result.multiplicadores()).containsEntry("type", 2.0);
    }

    @Test
    void typeZeroZeraDano() {
        PokemonDamageCalculator.DamageInput input = new PokemonDamageCalculator.DamageInput(
                50,
                90,
                120,
                100,
                true,
                false,
                false,
                1.0,
                0.0,
                1.0,
                0.85,
                1.0,
                1.0
        );
        PokemonDamageCalculator.DamageResult result = PokemonDamageCalculator.calcular(input);
        assertThat(result.danoMinimo()).isZero();
        assertThat(result.danoMaximo()).isZero();
        assertThat(result.danoAplicado()).isZero();
    }

    @Test
    void burnApenasFisico() {
        PokemonDamageCalculator.DamageInput fisico = new PokemonDamageCalculator.DamageInput(
                50, 90, 120, 100, true, false, true, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0
        );
        PokemonDamageCalculator.DamageInput especial = new PokemonDamageCalculator.DamageInput(
                50, 90, 120, 100, false, false, true, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0
        );
        int danoFisico = PokemonDamageCalculator.calcular(fisico).danoAplicado();
        int danoEspecial = PokemonDamageCalculator.calcular(especial).danoAplicado();
        assertThat(danoFisico).isLessThan(danoEspecial);
    }
}
