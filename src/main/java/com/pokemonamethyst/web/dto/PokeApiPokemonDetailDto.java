package com.pokemonamethyst.web.dto;

public class PokeApiPokemonDetailDto {

    private int id;
    private String name;
    private String imageUrl;
    private String tipoPrimario;
    private String tipoSecundario;

    public PokeApiPokemonDetailDto() {}

    public PokeApiPokemonDetailDto(int id, String name, String imageUrl, String tipoPrimario, String tipoSecundario) {
        this.id = id;
        this.name = name;
        this.imageUrl = imageUrl;
        this.tipoPrimario = tipoPrimario;
        this.tipoSecundario = tipoSecundario;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public String getTipoPrimario() { return tipoPrimario; }
    public void setTipoPrimario(String tipoPrimario) { this.tipoPrimario = tipoPrimario; }
    public String getTipoSecundario() { return tipoSecundario; }
    public void setTipoSecundario(String tipoSecundario) { this.tipoSecundario = tipoSecundario; }
}
