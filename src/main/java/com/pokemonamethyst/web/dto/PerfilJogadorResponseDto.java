package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.PerfilJogador;

import java.util.List;
import java.util.stream.Collectors;

public class PerfilJogadorResponseDto {

    private String id;
    private String nomePersonagem;
    private String classe;
    private int pokedolares;
    private int nivel;
    private int xpAtual;
    private int xpProximoNivel;
    private int hpMaximo;
    private int staminaMaxima;
    private int habilidade;
    private AtributosDto atributos;
    private List<PokemonResponseDto> timePrincipal;
    private List<PokemonResponseDto> box;

    public PerfilJogadorResponseDto() {}
    public PerfilJogadorResponseDto(String id, String nomePersonagem, String classe, int pokedolares, int nivel, int xpAtual, int xpProximoNivel, int hpMaximo, int staminaMaxima, int habilidade, AtributosDto atributos, List<PokemonResponseDto> timePrincipal, List<PokemonResponseDto> box) {
        this.id = id;
        this.nomePersonagem = nomePersonagem;
        this.classe = classe;
        this.pokedolares = pokedolares;
        this.nivel = nivel;
        this.xpAtual = xpAtual;
        this.xpProximoNivel = xpProximoNivel;
        this.hpMaximo = hpMaximo;
        this.staminaMaxima = staminaMaxima;
        this.habilidade = habilidade;
        this.atributos = atributos;
        this.timePrincipal = timePrincipal;
        this.box = box;
    }

    public static PerfilJogadorResponseDto from(PerfilJogador p, List<com.pokemonamethyst.domain.Pokemon> time, List<com.pokemonamethyst.domain.Pokemon> box) {
        if (p == null) return null;
        String nome = p.getNomePersonagem();
        if (nome == null) nome = "";
        String classe = p.getClasse() != null ? p.getClasse().name() : "TREINADOR";
        AtributosDto atr = AtributosDto.from(p.getAtributos());
        if (atr == null) atr = new AtributosDto();
        return new PerfilJogadorResponseDto(
                p.getId(),
                nome,
                classe,
                p.getPokedolares(),
                p.getNivel(),
                p.getXpAtual(),
                p.getNivel() * 10,
                p.getHpMaximo(),
                p.getStaminaMaxima(),
                p.getHabilidade(),
                atr,
                time != null ? time.stream().map(PokemonResponseDto::from).collect(Collectors.toList()) : List.of(),
                box != null ? box.stream().map(PokemonResponseDto::from).collect(Collectors.toList()) : List.of()
        );
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getNomePersonagem() { return nomePersonagem; }
    public void setNomePersonagem(String nomePersonagem) { this.nomePersonagem = nomePersonagem; }
    public String getClasse() { return classe; }
    public void setClasse(String classe) { this.classe = classe; }
    public int getPokedolares() { return pokedolares; }
    public void setPokedolares(int pokedolares) { this.pokedolares = pokedolares; }
    public int getNivel() { return nivel; }
    public void setNivel(int nivel) { this.nivel = nivel; }
    public int getXpAtual() { return xpAtual; }
    public void setXpAtual(int xpAtual) { this.xpAtual = xpAtual; }
    public int getXpProximoNivel() { return xpProximoNivel; }
    public void setXpProximoNivel(int xpProximoNivel) { this.xpProximoNivel = xpProximoNivel; }
    public int getHpMaximo() { return hpMaximo; }
    public void setHpMaximo(int hpMaximo) { this.hpMaximo = hpMaximo; }
    public int getStaminaMaxima() { return staminaMaxima; }
    public void setStaminaMaxima(int staminaMaxima) { this.staminaMaxima = staminaMaxima; }
    public int getHabilidade() { return habilidade; }
    public void setHabilidade(int habilidade) { this.habilidade = habilidade; }
    public AtributosDto getAtributos() { return atributos; }
    public void setAtributos(AtributosDto atributos) { this.atributos = atributos; }
    public List<PokemonResponseDto> getTimePrincipal() { return timePrincipal; }
    public void setTimePrincipal(List<PokemonResponseDto> timePrincipal) { this.timePrincipal = timePrincipal; }
    public List<PokemonResponseDto> getBox() { return box; }
    public void setBox(List<PokemonResponseDto> box) { this.box = box; }
}
