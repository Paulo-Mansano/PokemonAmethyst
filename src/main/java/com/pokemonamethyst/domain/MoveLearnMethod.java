package com.pokemonamethyst.domain;

public enum MoveLearnMethod {
    LEVEL_UP("level-up"),
    MACHINE("machine"),
    TUTOR("tutor"),
    EGG("egg"),
    OTHER("other");

    private final String pokeApiValue;

    MoveLearnMethod(String pokeApiValue) {
        this.pokeApiValue = pokeApiValue;
    }

    public String getPokeApiValue() {
        return pokeApiValue;
    }

    public static MoveLearnMethod fromPokeApi(String value) {
        if (value == null || value.isBlank()) {
            return OTHER;
        }
        for (MoveLearnMethod method : values()) {
            if (method.pokeApiValue.equalsIgnoreCase(value)) {
                return method;
            }
        }
        return OTHER;
    }
}
