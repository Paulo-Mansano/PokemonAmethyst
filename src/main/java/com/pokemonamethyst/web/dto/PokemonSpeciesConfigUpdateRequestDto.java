package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.MoveLearnMethod;

import java.util.List;

public class PokemonSpeciesConfigUpdateRequestDto {

    private List<HabilidadeVinculoRequestDto> habilidades;
    private List<LearnsetVinculoRequestDto> learnset;

    public List<HabilidadeVinculoRequestDto> getHabilidades() {
        return habilidades;
    }

    public void setHabilidades(List<HabilidadeVinculoRequestDto> habilidades) {
        this.habilidades = habilidades;
    }

    public List<LearnsetVinculoRequestDto> getLearnset() {
        return learnset;
    }

    public void setLearnset(List<LearnsetVinculoRequestDto> learnset) {
        this.learnset = learnset;
    }

    public static class HabilidadeVinculoRequestDto {
        private String habilidadeId;
        private Integer slot;
        private Boolean hidden;

        public String getHabilidadeId() {
            return habilidadeId;
        }

        public void setHabilidadeId(String habilidadeId) {
            this.habilidadeId = habilidadeId;
        }

        public Integer getSlot() {
            return slot;
        }

        public void setSlot(Integer slot) {
            this.slot = slot;
        }

        public Boolean getHidden() {
            return hidden;
        }

        public void setHidden(Boolean hidden) {
            this.hidden = hidden;
        }
    }

    public static class LearnsetVinculoRequestDto {
        private String movimentoId;
        private MoveLearnMethod learnMethod;
        private Integer level;
        private Integer ordem;

        public String getMovimentoId() {
            return movimentoId;
        }

        public void setMovimentoId(String movimentoId) {
            this.movimentoId = movimentoId;
        }

        public MoveLearnMethod getLearnMethod() {
            return learnMethod;
        }

        public void setLearnMethod(MoveLearnMethod learnMethod) {
            this.learnMethod = learnMethod;
        }

        public Integer getLevel() {
            return level;
        }

        public void setLevel(Integer level) {
            this.level = level;
        }

        public Integer getOrdem() {
            return ordem;
        }

        public void setOrdem(Integer ordem) {
            this.ordem = ordem;
        }
    }
}
