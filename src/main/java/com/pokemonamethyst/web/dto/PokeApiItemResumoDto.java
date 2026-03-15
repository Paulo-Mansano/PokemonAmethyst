package com.pokemonamethyst.web.dto;

public class PokeApiItemResumoDto {

    private int pokeapiId;
    private String name;
    private boolean jaCadastrado;

    public PokeApiItemResumoDto() {}

    public PokeApiItemResumoDto(int pokeapiId, String name, boolean jaCadastrado) {
        this.pokeapiId = pokeapiId;
        this.name = name;
        this.jaCadastrado = jaCadastrado;
    }

    public int getPokeapiId() { return pokeapiId; }
    public void setPokeapiId(int pokeapiId) { this.pokeapiId = pokeapiId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public boolean isJaCadastrado() { return jaCadastrado; }
    public void setJaCadastrado(boolean jaCadastrado) { this.jaCadastrado = jaCadastrado; }
}
