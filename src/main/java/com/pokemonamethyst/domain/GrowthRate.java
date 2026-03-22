package com.pokemonamethyst.domain;

/**
 * Curvas de experiência oficiais (Gen III+). Os nomes da PokéAPI diferem dos nomes comuns em inglês;
 * {@link #fromPokeApiSlug(String)} aceita ambos.
 */
public enum GrowthRate {

    SLOW("slow"),
    /** PokéAPI: {@code medium} — curva "medium slow" nos jogos. */
    MEDIUM_SLOW("medium"),
    /** PokéAPI: {@code medium-slow} — curva "medium fast" nos jogos. */
    MEDIUM_FAST("medium-slow", "medium-fast"),
    FAST("fast"),
    /** PokéAPI: {@code slow-then-very-fast}. */
    ERRATIC("slow-then-very-fast", "erratic"),
    /** PokéAPI: {@code fast-then-very-slow}. */
    FLUCTUATING("fast-then-very-slow", "fluctuating");

    private final String[] pokeApiSlugs;

    GrowthRate(String... pokeApiSlugs) {
        this.pokeApiSlugs = pokeApiSlugs;
    }

    /**
     * Resolve a partir do texto em {@link PokemonSpecies#getGrowthRate()} (nome da PokéAPI ou alias).
     */
    public static GrowthRate fromPokeApiSlug(String raw) {
        if (raw == null || raw.isBlank()) {
            return MEDIUM_FAST;
        }
        String s = raw.trim().toLowerCase().replace('_', '-');
        for (GrowthRate g : values()) {
            for (String slug : g.pokeApiSlugs) {
                if (slug.equals(s)) {
                    return g;
                }
            }
        }
        return MEDIUM_FAST;
    }

    public static GrowthRate fromSpecies(PokemonSpecies species) {
        return species == null ? MEDIUM_FAST : fromPokeApiSlug(species.getGrowthRate());
    }
}
