package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.PokemonIVClass;
import com.pokemonamethyst.domain.PokemonSpecies;

public class PokemonSpeciesResumoDto {

    private String id;
    private int pokedexId;
    private String nome;
    private String imagemUrl;
    private String tipoPrimario;
    private String tipoSecundario;
    private String ivClass;
    private int pontosMin;
    private int pontosMax;
    private int pontosPorNivel;

    public static PokemonSpeciesResumoDto from(PokemonSpecies species) {
        PokemonSpeciesResumoDto dto = new PokemonSpeciesResumoDto();
        dto.setId(species.getId());
        dto.setPokedexId(species.getPokedexId());
        dto.setNome(species.getNome());
        dto.setImagemUrl(species.getImagemUrl());
        dto.setTipoPrimario(species.getTipoPrimario() != null ? species.getTipoPrimario().name() : null);
        dto.setTipoSecundario(species.getTipoSecundario() != null ? species.getTipoSecundario().name() : null);
        int bst = species.getBaseHp() + species.getBaseAtaque() + species.getBaseDefesa()
                + species.getBaseAtaqueEspecial() + species.getBaseDefesaEspecial() + species.getBaseSpeed();
        PokemonIVClass classe = PokemonIVClass.fromBst(bst);
        dto.setIvClass(classe.name());
        dto.setPontosMin(classe.getPontosMin());
        dto.setPontosMax(classe.getPontosMax());
        dto.setPontosPorNivel(classe.getPontosPorNivel());
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

    public String getIvClass() { return ivClass; }
    public void setIvClass(String ivClass) { this.ivClass = ivClass; }

    public int getPontosMin() { return pontosMin; }
    public void setPontosMin(int pontosMin) { this.pontosMin = pontosMin; }

    public int getPontosMax() { return pontosMax; }
    public void setPontosMax(int pontosMax) { this.pontosMax = pontosMax; }

    public int getPontosPorNivel() { return pontosPorNivel; }
    public void setPontosPorNivel(int pontosPorNivel) { this.pontosPorNivel = pontosPorNivel; }
}
