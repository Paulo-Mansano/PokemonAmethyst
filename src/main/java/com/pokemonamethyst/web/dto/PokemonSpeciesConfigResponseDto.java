package com.pokemonamethyst.web.dto;

import java.util.List;

public class PokemonSpeciesConfigResponseDto {

    private String speciesId;
    private int pokedexId;
    private String nome;
    private String imagemUrl;
    private List<HabilidadeVinculoDto> habilidades;
    private List<LearnsetVinculoDto> learnset;

    public String getSpeciesId() {
        return speciesId;
    }

    public void setSpeciesId(String speciesId) {
        this.speciesId = speciesId;
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

    public List<HabilidadeVinculoDto> getHabilidades() {
        return habilidades;
    }

    public void setHabilidades(List<HabilidadeVinculoDto> habilidades) {
        this.habilidades = habilidades;
    }

    public List<LearnsetVinculoDto> getLearnset() {
        return learnset;
    }

    public void setLearnset(List<LearnsetVinculoDto> learnset) {
        this.learnset = learnset;
    }

    public static class HabilidadeVinculoDto {
        private String habilidadeId;
        private String habilidadeNome;
        private String habilidadeNomeEn;
        private int slot;
        private boolean hidden;

        public String getHabilidadeId() {
            return habilidadeId;
        }

        public void setHabilidadeId(String habilidadeId) {
            this.habilidadeId = habilidadeId;
        }

        public String getHabilidadeNome() {
            return habilidadeNome;
        }

        public void setHabilidadeNome(String habilidadeNome) {
            this.habilidadeNome = habilidadeNome;
        }

        public String getHabilidadeNomeEn() {
            return habilidadeNomeEn;
        }

        public void setHabilidadeNomeEn(String habilidadeNomeEn) {
            this.habilidadeNomeEn = habilidadeNomeEn;
        }

        public int getSlot() {
            return slot;
        }

        public void setSlot(int slot) {
            this.slot = slot;
        }

        public boolean isHidden() {
            return hidden;
        }

        public void setHidden(boolean hidden) {
            this.hidden = hidden;
        }
    }

    public static class LearnsetVinculoDto {
        private String movimentoId;
        private String movimentoNome;
        private String movimentoNomeEn;
        private String learnMethod;
        private Integer level;
        private Integer ordem;

        public String getMovimentoId() {
            return movimentoId;
        }

        public void setMovimentoId(String movimentoId) {
            this.movimentoId = movimentoId;
        }

        public String getMovimentoNome() {
            return movimentoNome;
        }

        public void setMovimentoNome(String movimentoNome) {
            this.movimentoNome = movimentoNome;
        }

        public String getMovimentoNomeEn() {
            return movimentoNomeEn;
        }

        public void setMovimentoNomeEn(String movimentoNomeEn) {
            this.movimentoNomeEn = movimentoNomeEn;
        }

        public String getLearnMethod() {
            return learnMethod;
        }

        public void setLearnMethod(String learnMethod) {
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
