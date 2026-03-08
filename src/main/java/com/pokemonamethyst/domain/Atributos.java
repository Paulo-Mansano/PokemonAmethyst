package com.pokemonamethyst.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class Atributos {

    private int forca;
    private int speed;
    private int inteligencia;
    private int tecnica;
    private int sabedoria;
    private int percepcao;
    private int dominio;
    private int respeito;

    public Atributos() {}

    public Atributos(int forca, int speed, int inteligencia, int tecnica, int sabedoria, int percepcao, int dominio, int respeito) {
        this.forca = forca;
        this.speed = speed;
        this.inteligencia = inteligencia;
        this.tecnica = tecnica;
        this.sabedoria = sabedoria;
        this.percepcao = percepcao;
        this.dominio = dominio;
        this.respeito = respeito;
    }

    public int getForca() { return forca; }
    public void setForca(int forca) { this.forca = forca; }
    public int getSpeed() { return speed; }
    public void setSpeed(int speed) { this.speed = speed; }
    public int getInteligencia() { return inteligencia; }
    public void setInteligencia(int inteligencia) { this.inteligencia = inteligencia; }
    public int getTecnica() { return tecnica; }
    public void setTecnica(int tecnica) { this.tecnica = tecnica; }
    public int getSabedoria() { return sabedoria; }
    public void setSabedoria(int sabedoria) { this.sabedoria = sabedoria; }
    public int getPercepcao() { return percepcao; }
    public void setPercepcao(int percepcao) { this.percepcao = percepcao; }
    public int getDominio() { return dominio; }
    public void setDominio(int dominio) { this.dominio = dominio; }
    public int getRespeito() { return respeito; }
    public void setRespeito(int respeito) { this.respeito = respeito; }
}
