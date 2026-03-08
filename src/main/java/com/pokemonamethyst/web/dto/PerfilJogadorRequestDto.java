package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.ClasseJogador;
import jakarta.validation.constraints.NotNull;

public class PerfilJogadorRequestDto {

    @NotNull(message = "Nome do personagem é obrigatório")
    private String nomePersonagem;

    @NotNull(message = "Classe é obrigatória")
    private ClasseJogador classe;

    private Integer pokedolares;
    private Integer nivel;
    private Integer xpAtual;
    private Integer hpMaximo;
    private Integer hpAtual;
    private Integer staminaMaxima;
    private Integer staminaAtual;
    private Integer habilidade;
    private AtributosDto atributos;

    public String getNomePersonagem() { return nomePersonagem; }
    public void setNomePersonagem(String nomePersonagem) { this.nomePersonagem = nomePersonagem; }
    public ClasseJogador getClasse() { return classe; }
    public void setClasse(ClasseJogador classe) { this.classe = classe; }
    public Integer getPokedolares() { return pokedolares; }
    public void setPokedolares(Integer pokedolares) { this.pokedolares = pokedolares; }
    public Integer getNivel() { return nivel; }
    public void setNivel(Integer nivel) { this.nivel = nivel; }
    public Integer getXpAtual() { return xpAtual; }
    public void setXpAtual(Integer xpAtual) { this.xpAtual = xpAtual; }
    public Integer getHpMaximo() { return hpMaximo; }
    public void setHpMaximo(Integer hpMaximo) { this.hpMaximo = hpMaximo; }
    public Integer getHpAtual() { return hpAtual; }
    public void setHpAtual(Integer hpAtual) { this.hpAtual = hpAtual; }
    public Integer getStaminaMaxima() { return staminaMaxima; }
    public void setStaminaMaxima(Integer staminaMaxima) { this.staminaMaxima = staminaMaxima; }
    public Integer getStaminaAtual() { return staminaAtual; }
    public void setStaminaAtual(Integer staminaAtual) { this.staminaAtual = staminaAtual; }
    public Integer getHabilidade() { return habilidade; }
    public void setHabilidade(Integer habilidade) { this.habilidade = habilidade; }
    public AtributosDto getAtributos() { return atributos; }
    public void setAtributos(AtributosDto atributos) { this.atributos = atributos; }
}
