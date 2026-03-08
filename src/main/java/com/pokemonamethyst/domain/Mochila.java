package com.pokemonamethyst.domain;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "mochila")
public class Mochila {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private String id = UUID.randomUUID().toString();

    @Column(name = "peso_maximo", nullable = false)
    private double pesoMaximo;

    @OneToMany(mappedBy = "mochila", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MochilaItem> conteudos = new ArrayList<>();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public double getPesoMaximo() { return pesoMaximo; }
    public void setPesoMaximo(double pesoMaximo) { this.pesoMaximo = pesoMaximo; }
    public List<MochilaItem> getConteudos() { return conteudos; }
    public void setConteudos(List<MochilaItem> conteudos) { this.conteudos = conteudos; }
}
