package com.pokemonamethyst.domain;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "mochila_item", uniqueConstraints = @UniqueConstraint(columnNames = {"mochila_id", "item_id"}))
public class MochilaItem {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    private String id = UUID.randomUUID().toString();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mochila_id", nullable = false)
    private Mochila mochila;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(nullable = false)
    private int quantidade;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Mochila getMochila() { return mochila; }
    public void setMochila(Mochila mochila) { this.mochila = mochila; }
    public Item getItem() { return item; }
    public void setItem(Item item) { this.item = item; }
    public int getQuantidade() { return quantidade; }
    public void setQuantidade(int quantidade) { this.quantidade = quantidade; }
}
