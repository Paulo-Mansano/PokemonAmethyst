package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.Pokemon;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PokemonStatServiceTest {

    private final PokemonStatService service = new PokemonStatService();

    @Test
    void custoNaoHpStaminaSegueFaixasCorretas() {
        Pokemon pokemon = new Pokemon();

        pokemon.setAtrAtaque(0);
        assertThat(service.custoParaProximoPonto(pokemon, "atr_ataque")).isEqualTo(1);

        pokemon.setAtrAtaque(5);
        assertThat(service.custoParaProximoPonto(pokemon, "atr_ataque")).isEqualTo(2);

        pokemon.setAtrAtaque(10);
        assertThat(service.custoParaProximoPonto(pokemon, "atr_ataque")).isEqualTo(3);
    }

    @Test
    void custoHpEStaminaPermaneceUm() {
        Pokemon pokemon = new Pokemon();
        pokemon.setAtrHp(99);
        pokemon.setAtrStamina(99);

        assertThat(service.custoParaProximoPonto(pokemon, "atr_hp")).isEqualTo(1);
        assertThat(service.custoParaProximoPonto(pokemon, "atr_stamina")).isEqualTo(1);
    }
}
