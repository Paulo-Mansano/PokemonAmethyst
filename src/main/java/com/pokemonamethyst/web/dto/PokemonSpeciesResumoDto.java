package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.PokemonSpecies;

public class PokemonSpeciesResumoDto {

    private String id;
    private int pokedexId;
    private String nome;
    private String imagemUrl;
    private String tipoPrimario;
    private String tipoSecundario;

    public static PokemonSpeciesResumoDto from(PokemonSpecies species) {
        PokemonSpeciesResumoDto dto = new PokemonSpeciesResumoDto();
        dto.setId(species.getId());
        dto.setPokedexId(species.getPokedexId());
        dto.setNome(species.getNome());
        dto.setImagemUrl(species.getImagemUrl());
        dto.setTipoPrimario(species.getTipoPrimario() != null ? species.getTipoPrimario().name() : null);
        dto.setTipoSecundario(species.getTipoSecundario() != null ? species.getTipoSecundario().name() : null);
        return dto;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public int getPokedexId() {
        return pokedexId;
    }

    public void setPokedexId(int pokedexId) {
        this.pokedexId = pokedexId;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getImagemUrl() {
        return imagemUrl;
    }

    public void setImagemUrl(String imagemUrl) {
        this.imagemUrl = imagemUrl;
    }

    public String getTipoPrimario() {
        return tipoPrimario;
    }

    public void setTipoPrimario(String tipoPrimario) {
        this.tipoPrimario = tipoPrimario;
    }

    public String getTipoSecundario() {
        return tipoSecundario;
    }

    public void setTipoSecundario(String tipoSecundario) {
        this.tipoSecundario = tipoSecundario;
    }
}
