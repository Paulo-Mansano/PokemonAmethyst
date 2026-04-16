package com.pokemonamethyst.web.dto;

public class PokemonEvolucaoOpcaoDto {

    private int pokedexId;
    private String especie;
    private String triggerType;
    private Integer minLevel;
    private String itemName;
    private boolean disponivelAgora;

    public int getPokedexId() { return pokedexId; }
    public void setPokedexId(int pokedexId) { this.pokedexId = pokedexId; }
    public String getEspecie() { return especie; }
    public void setEspecie(String especie) { this.especie = especie; }
    public String getTriggerType() { return triggerType; }
    public void setTriggerType(String triggerType) { this.triggerType = triggerType; }
    public Integer getMinLevel() { return minLevel; }
    public void setMinLevel(Integer minLevel) { this.minLevel = minLevel; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public boolean isDisponivelAgora() { return disponivelAgora; }
    public void setDisponivelAgora(boolean disponivelAgora) { this.disponivelAgora = disponivelAgora; }
}
