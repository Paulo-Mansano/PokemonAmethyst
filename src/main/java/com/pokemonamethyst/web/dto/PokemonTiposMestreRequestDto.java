package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.Tipagem;

public class PokemonTiposMestreRequestDto {

    private Boolean resetTiposParaEspecie;
    private Tipagem tipoPrimario;
    private Tipagem tipoSecundario;

    public Boolean getResetTiposParaEspecie() {
        return resetTiposParaEspecie;
    }

    public void setResetTiposParaEspecie(Boolean resetTiposParaEspecie) {
        this.resetTiposParaEspecie = resetTiposParaEspecie;
    }

    public boolean isResetTiposParaEspecie() {
        return Boolean.TRUE.equals(resetTiposParaEspecie);
    }

    public Tipagem getTipoPrimario() {
        return tipoPrimario;
    }

    public void setTipoPrimario(Tipagem tipoPrimario) {
        this.tipoPrimario = tipoPrimario;
    }

    public Tipagem getTipoSecundario() {
        return tipoSecundario;
    }

    public void setTipoSecundario(Tipagem tipoSecundario) {
        this.tipoSecundario = tipoSecundario;
    }
}
