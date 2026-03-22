package com.pokemonamethyst.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PokemonStatsCalculatorTest {

    @Test
    void hpNivel100SemIvSemEv_bateExemploPadrao() {
        // Base 100, IV 0, EV 0, L100: inner = 200*100/100 = 200 → HP = 200+100+10 = 310
        assertThat(PokemonStatsCalculator.hpMaximo(100, 0, 0, 100)).isEqualTo(310);
    }

    @Test
    void statNaoHpNivel100SemIvSemEv() {
        assertThat(PokemonStatsCalculator.statNaoHp(100, 0, 0, 100)).isEqualTo(205);
    }

    @Test
    void hpCom252EvConsideraFloorEvSobre4() {
        // inner = (2*78 + 0 + 63) * 50 / 100 = 219*50/100 = 109 → HP = 109+50+10 = 169 (ex.: base 78, EV 252)
        assertThat(PokemonStatsCalculator.hpMaximo(78, 0, 252, 50)).isEqualTo(169);
    }

    @Test
    void ivsLimitadosA31() {
        assertThat(PokemonStatsCalculator.hpMaximo(50, 999, 0, 20))
                .isEqualTo(PokemonStatsCalculator.hpMaximo(50, 31, 0, 20));
    }

    @Test
    void evsLimitadosA252PorStat() {
        assertThat(PokemonStatsCalculator.statNaoHp(55, 0, 999, 50))
                .isEqualTo(PokemonStatsCalculator.statNaoHp(55, 0, 252, 50));
    }
}
