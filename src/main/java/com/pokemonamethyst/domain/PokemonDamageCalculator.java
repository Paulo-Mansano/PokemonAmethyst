package com.pokemonamethyst.domain;

import java.util.LinkedHashMap;
import java.util.Map;

public final class PokemonDamageCalculator {

    private PokemonDamageCalculator() {
    }

    public static DamageResult calcular(DamageInput input) {
        int level = clamp(input.level(), 1, 100);
        int power = Math.max(1, input.power());
        int attack = Math.max(1, input.attack());
        int defense = Math.max(1, input.defense());

        double base = (((((2.0 * level) / 5.0) + 2.0) * power * ((double) attack / defense)) / 50.0) + 2.0;

        double critico = input.critico() ? 1.5 : 1.0;
        double stab = sanitizeMultiplier(input.stabMultiplier(), 1.0);
        double type = sanitizeMultiplier(input.typeMultiplier(), 1.0);
        double burn = input.categoriaFisica() && input.queimado() ? 0.5 : 1.0;
        double other = sanitizeMultiplier(input.otherMultiplier(), 1.0);
        double randomMin = clampDouble(input.randomMin(), 0.85, 1.0);
        double randomMax = clampDouble(input.randomMax(), randomMin, 1.0);
        double randomApplied = input.randomValue() == null
                ? randomMax
                : clampDouble(input.randomValue(), randomMin, randomMax);

        double semRandom = critico * stab * type * burn * other;
        int danoMin = finalizeDamage(base * semRandom * randomMin, type);
        int danoMax = finalizeDamage(base * semRandom * randomMax, type);
        int danoAplicado = finalizeDamage(base * semRandom * randomApplied, type);

        Map<String, Double> multiplicadores = new LinkedHashMap<>();
        multiplicadores.put("critical", critico);
        multiplicadores.put("random", randomApplied);
        multiplicadores.put("stab", stab);
        multiplicadores.put("type", type);
        multiplicadores.put("burn", burn);
        multiplicadores.put("other", other);

        String formula = "Damage = (((((2*L)/5)+2)*P*(A/D))/50)+2; Modifier = Critical*Random*STAB*Type*Burn*Other";
        return new DamageResult(danoMin, danoMax, danoAplicado, formula, multiplicadores);
    }

    private static int finalizeDamage(double rawDamage, double typeMultiplier) {
        if (typeMultiplier <= 0d) {
            return 0;
        }
        int value = (int) Math.floor(rawDamage);
        return Math.max(1, value);
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private static double sanitizeMultiplier(Double value, double fallback) {
        if (value == null || value.isNaN() || value.isInfinite()) {
            return fallback;
        }
        return Math.max(0d, value);
    }

    private static double clampDouble(Double value, double min, double max) {
        if (value == null || value.isNaN() || value.isInfinite()) {
            return min;
        }
        return Math.max(min, Math.min(max, value));
    }

    public record DamageInput(
            int level,
            int power,
            int attack,
            int defense,
            boolean categoriaFisica,
            boolean critico,
            boolean queimado,
            Double stabMultiplier,
            Double typeMultiplier,
            Double otherMultiplier,
            Double randomMin,
            Double randomMax,
            Double randomValue
    ) {
    }

    public record DamageResult(
            int danoMinimo,
            int danoMaximo,
            int danoAplicado,
            String formula,
            Map<String, Double> multiplicadores
    ) {
    }
}
