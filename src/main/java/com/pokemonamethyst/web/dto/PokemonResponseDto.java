package com.pokemonamethyst.web.dto;

import com.pokemonamethyst.domain.Movimento;
import com.pokemonamethyst.domain.Pokemon;
import com.pokemonamethyst.domain.GrowthRate;
import com.pokemonamethyst.domain.PokemonExperience;
import com.pokemonamethyst.domain.PokemonSpecies;
import com.pokemonamethyst.domain.PokemonStatsCalculator;

import java.util.List;
import java.util.stream.Collectors;

public class PokemonResponseDto {

    private String id;
    private Integer ordemTime;
    private int pokedexId;
    private String especie;
    private String apelido;
    private String imagemUrl;
    private String notas;
    private String genero;
    private boolean shiny;
    private String tipoPrimario;
    private String tipoSecundario;
    /** Tipos da espécie na Pokédex (sem override do mestre). */
    private String tipoPrimarioEspecie;
    private String tipoSecundarioEspecie;
    private boolean tiposComOverride;
    private String personalidade;
    private String personalidadeId;
    private String especializacao;
    private String berryFavorita;
    private int nivelDeVinculo;
    private int nivel;
    private int xpAtual;
    /** Slug da PokéAPI (ex.: {@code medium}, {@code medium-slow}). */
    private String taxaCrescimento;
    /** XP cumulativo mínimo do nível atual (limiar inferior). */
    private int xpCumulativoInicioNivel;
    /** XP cumulativo necessário para o próximo nível (ou teto no nível 100). */
    private int xpCumulativoProximoNivel;
    /** Quanto falta até {@link #xpCumulativoProximoNivel}. */
    private int xpRestanteParaProximoNivel;
    private String pokebolaCaptura;
    private String itemSeguradoId;
    private int hpMaximo;
    private int hpAtual;
    private int staminaMaxima;
    private int ataque;
    private int ataqueEspecial;
    private int defesa;
    private int defesaEspecial;
    private int speed;
    private int tecnica;
    private int respeito;
    private int evHp;
    private int evAtaque;
    private int evDefesa;
    private int evAtaqueEspecial;
    private int evDefesaEspecial;
    private int evSpeed;
    private String habilidadeAtivaId;
    private String habilidadeAtivaNome;
    private String origem;
    private String estado;
    private List<String> statusAtuais;
    private List<MovimentoResponseDto> movimentosConhecidos;

    public PokemonResponseDto() {}
    public PokemonResponseDto(String id, Integer ordemTime, int pokedexId, String especie, String apelido, String imagemUrl, String notas, String genero, boolean shiny, String tipoPrimario, String tipoSecundario, String personalidade, String especializacao, String berryFavorita, int nivelDeVinculo, int nivel, int xpAtual, String pokebolaCaptura, String itemSeguradoId, int hpMaximo, int staminaMaxima, int ataque, int ataqueEspecial, int defesa, int defesaEspecial, int speed, int tecnica, int respeito, List<String> statusAtuais) {
        this.id = id;
        this.ordemTime = ordemTime;
        this.pokedexId = pokedexId;
        this.especie = especie;
        this.apelido = apelido;
        this.imagemUrl = imagemUrl;
        this.notas = notas;
        this.genero = genero;
        this.shiny = shiny;
        this.tipoPrimario = tipoPrimario;
        this.tipoSecundario = tipoSecundario;
        this.personalidade = personalidade;
        this.especializacao = especializacao;
        this.berryFavorita = berryFavorita;
        this.nivelDeVinculo = nivelDeVinculo;
        this.nivel = nivel;
        this.xpAtual = xpAtual;
        this.pokebolaCaptura = pokebolaCaptura;
        this.itemSeguradoId = itemSeguradoId;
        this.hpMaximo = hpMaximo;
        this.staminaMaxima = staminaMaxima;
        this.ataque = ataque;
        this.ataqueEspecial = ataqueEspecial;
        this.defesa = defesa;
        this.defesaEspecial = defesaEspecial;
        this.speed = speed;
        this.tecnica = tecnica;
        this.respeito = respeito;
        this.statusAtuais = statusAtuais;
    }

    public static PokemonResponseDto from(Pokemon p) {
        if (p == null) return null;
        PokemonSpecies species = p.getSpecies();
        String especie = p.getEspecie();
        if (especie == null) especie = "";
        int nivel = Math.max(1, p.getNivel());
        int hpMaximo = PokemonStatsCalculator.hpMaximo(species != null ? species.getBaseHp() : 1, p.getIvHp(), p.getEvHp(), nivel);
        int ataque = PokemonStatsCalculator.statNaoHp(species != null ? species.getBaseAtaque() : 1, p.getIvAtaque(), p.getEvAtaque(), nivel);
        int ataqueEspecial = PokemonStatsCalculator.statNaoHp(species != null ? species.getBaseAtaqueEspecial() : 1, p.getIvAtaqueEspecial(), p.getEvAtaqueEspecial(), nivel);
        int defesa = PokemonStatsCalculator.statNaoHp(species != null ? species.getBaseDefesa() : 1, p.getIvDefesa(), p.getEvDefesa(), nivel);
        int defesaEspecial = PokemonStatsCalculator.statNaoHp(species != null ? species.getBaseDefesaEspecial() : 1, p.getIvDefesaEspecial(), p.getEvDefesaEspecial(), nivel);
        int speed = PokemonStatsCalculator.statNaoHp(species != null ? species.getBaseSpeed() : 1, p.getIvSpeed(), p.getEvSpeed(), nivel);
        PokemonResponseDto dto = new PokemonResponseDto(
                p.getId(),
                p.getOrdemTime(),
                p.getPokedexId(),
                especie,
                p.getApelido() != null ? p.getApelido() : null,
                p.getImagemUrl() != null ? p.getImagemUrl() : null,
                p.getNotas() != null ? p.getNotas() : null,
                p.getGenero() != null ? p.getGenero().name() : null,
                p.isShiny(),
                p.getTipoPrimario() != null ? p.getTipoPrimario().name() : null,
                p.getTipoSecundario() != null ? p.getTipoSecundario().name() : null,
                p.getPersonalidade() != null ? p.getPersonalidade().getNome() : null,
                p.getEspecializacao() != null ? p.getEspecializacao().name() : null,
                p.getBerryFavorita() != null ? p.getBerryFavorita() : null,
                p.getNivelDeVinculo(),
                nivel,
                p.getXpAtual(),
                p.getPokebolaCaptura() != null ? p.getPokebolaCaptura().name() : null,
                p.getItemSegurado() != null ? p.getItemSegurado().getId() : null,
                hpMaximo,
                p.getStaminaMaxima(),
                ataque,
                ataqueEspecial,
                defesa,
                defesaEspecial,
                speed,
                p.getTecnica(),
                p.getRespeito(),
                p.getStatusAtuais() != null ? p.getStatusAtuais().stream().map(Enum::name).toList() : List.of()
        );
        dto.setPersonalidadeId(p.getPersonalidade() != null ? p.getPersonalidade().getId() : null);
        dto.setHabilidadeAtivaId(p.getHabilidadeAtiva() != null ? p.getHabilidadeAtiva().getId() : null);
        dto.setHabilidadeAtivaNome(p.getHabilidadeAtiva() != null ? p.getHabilidadeAtiva().getNome() : null);
        dto.setEvHp(p.getEvHp());
        dto.setEvAtaque(p.getEvAtaque());
        dto.setEvDefesa(p.getEvDefesa());
        dto.setEvAtaqueEspecial(p.getEvAtaqueEspecial());
        dto.setEvDefesaEspecial(p.getEvDefesaEspecial());
        dto.setEvSpeed(p.getEvSpeed());
        int hpAtual = p.getHpAtual() == null ? hpMaximo : p.getHpAtual();
        dto.setHpAtual(Math.max(0, Math.min(hpAtual, hpMaximo)));
        dto.setOrigem(p.getOrigem() != null ? p.getOrigem().name() : null);
        dto.setEstado(p.getEstado() != null ? p.getEstado().name() : null);
        GrowthRate curva = GrowthRate.fromSpecies(species);
        int xpTotal = p.getXpAtual();
        int xpIni = PokemonExperience.getTotalXpForLevel(nivel, curva);
        int xpProx = nivel >= PokemonExperience.MAX_LEVEL
                ? PokemonExperience.getTotalXpForLevel(PokemonExperience.MAX_LEVEL, curva)
                : PokemonExperience.getTotalXpForLevel(nivel + 1, curva);
        dto.setTaxaCrescimento(species != null ? species.getGrowthRate() : null);
        dto.setXpCumulativoInicioNivel(xpIni);
        dto.setXpCumulativoProximoNivel(xpProx);
        dto.setXpRestanteParaProximoNivel(PokemonExperience.getXpRestanteParaProximoNivel(xpTotal, nivel, curva));
        if (p.getMovimentosConhecidos() != null && !p.getMovimentosConhecidos().isEmpty()) {
            dto.setMovimentosConhecidos(p.getMovimentosConhecidos().stream()
                    .map(MovimentoResponseDto::from)
                    .collect(Collectors.toList()));
        }
        dto.setTipoPrimarioEspecie(p.getTipoPrimarioDaEspecie() != null ? p.getTipoPrimarioDaEspecie().name() : null);
        dto.setTipoSecundarioEspecie(p.getTipoSecundarioDaEspecie() != null ? p.getTipoSecundarioDaEspecie().name() : null);
        dto.setTiposComOverride(p.isTiposPersonalizados());
        return dto;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public Integer getOrdemTime() { return ordemTime; }
    public void setOrdemTime(Integer ordemTime) { this.ordemTime = ordemTime; }
    public int getPokedexId() { return pokedexId; }
    public void setPokedexId(int pokedexId) { this.pokedexId = pokedexId; }
    public String getEspecie() { return especie; }
    public void setEspecie(String especie) { this.especie = especie; }
    public String getApelido() { return apelido; }
    public void setApelido(String apelido) { this.apelido = apelido; }
    public String getImagemUrl() { return imagemUrl; }
    public void setImagemUrl(String imagemUrl) { this.imagemUrl = imagemUrl; }
    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }
    public String getGenero() { return genero; }
    public void setGenero(String genero) { this.genero = genero; }
    public boolean isShiny() { return shiny; }
    public void setShiny(boolean shiny) { this.shiny = shiny; }
    public String getTipoPrimario() { return tipoPrimario; }
    public void setTipoPrimario(String tipoPrimario) { this.tipoPrimario = tipoPrimario; }
    public String getTipoSecundario() { return tipoSecundario; }
    public void setTipoSecundario(String tipoSecundario) { this.tipoSecundario = tipoSecundario; }
    public String getTipoPrimarioEspecie() { return tipoPrimarioEspecie; }
    public void setTipoPrimarioEspecie(String tipoPrimarioEspecie) { this.tipoPrimarioEspecie = tipoPrimarioEspecie; }
    public String getTipoSecundarioEspecie() { return tipoSecundarioEspecie; }
    public void setTipoSecundarioEspecie(String tipoSecundarioEspecie) { this.tipoSecundarioEspecie = tipoSecundarioEspecie; }
    public boolean isTiposComOverride() { return tiposComOverride; }
    public void setTiposComOverride(boolean tiposComOverride) { this.tiposComOverride = tiposComOverride; }
    public String getPersonalidade() { return personalidade; }
    public void setPersonalidade(String personalidade) { this.personalidade = personalidade; }
    public String getPersonalidadeId() { return personalidadeId; }
    public void setPersonalidadeId(String personalidadeId) { this.personalidadeId = personalidadeId; }
    public String getEspecializacao() { return especializacao; }
    public void setEspecializacao(String especializacao) { this.especializacao = especializacao; }
    public String getBerryFavorita() { return berryFavorita; }
    public void setBerryFavorita(String berryFavorita) { this.berryFavorita = berryFavorita; }
    public int getNivelDeVinculo() { return nivelDeVinculo; }
    public void setNivelDeVinculo(int nivelDeVinculo) { this.nivelDeVinculo = nivelDeVinculo; }
    public int getNivel() { return nivel; }
    public void setNivel(int nivel) { this.nivel = nivel; }
    public int getXpAtual() { return xpAtual; }
    public void setXpAtual(int xpAtual) { this.xpAtual = xpAtual; }
    public String getTaxaCrescimento() { return taxaCrescimento; }
    public void setTaxaCrescimento(String taxaCrescimento) { this.taxaCrescimento = taxaCrescimento; }
    public int getXpCumulativoInicioNivel() { return xpCumulativoInicioNivel; }
    public void setXpCumulativoInicioNivel(int xpCumulativoInicioNivel) { this.xpCumulativoInicioNivel = xpCumulativoInicioNivel; }
    public int getXpCumulativoProximoNivel() { return xpCumulativoProximoNivel; }
    public void setXpCumulativoProximoNivel(int xpCumulativoProximoNivel) { this.xpCumulativoProximoNivel = xpCumulativoProximoNivel; }
    public int getXpRestanteParaProximoNivel() { return xpRestanteParaProximoNivel; }
    public void setXpRestanteParaProximoNivel(int xpRestanteParaProximoNivel) { this.xpRestanteParaProximoNivel = xpRestanteParaProximoNivel; }
    public String getPokebolaCaptura() { return pokebolaCaptura; }
    public void setPokebolaCaptura(String pokebolaCaptura) { this.pokebolaCaptura = pokebolaCaptura; }
    public String getItemSeguradoId() { return itemSeguradoId; }
    public void setItemSeguradoId(String itemSeguradoId) { this.itemSeguradoId = itemSeguradoId; }
    public int getHpMaximo() { return hpMaximo; }
    public void setHpMaximo(int hpMaximo) { this.hpMaximo = hpMaximo; }
    public int getHpAtual() { return hpAtual; }
    public void setHpAtual(int hpAtual) { this.hpAtual = hpAtual; }
    public int getStaminaMaxima() { return staminaMaxima; }
    public void setStaminaMaxima(int staminaMaxima) { this.staminaMaxima = staminaMaxima; }
    public int getAtaque() { return ataque; }
    public void setAtaque(int ataque) { this.ataque = ataque; }
    public int getAtaqueEspecial() { return ataqueEspecial; }
    public void setAtaqueEspecial(int ataqueEspecial) { this.ataqueEspecial = ataqueEspecial; }
    public int getDefesa() { return defesa; }
    public void setDefesa(int defesa) { this.defesa = defesa; }
    public int getDefesaEspecial() { return defesaEspecial; }
    public void setDefesaEspecial(int defesaEspecial) { this.defesaEspecial = defesaEspecial; }
    public int getSpeed() { return speed; }
    public void setSpeed(int speed) { this.speed = speed; }
    public int getTecnica() { return tecnica; }
    public void setTecnica(int tecnica) { this.tecnica = tecnica; }
    public int getRespeito() { return respeito; }
    public void setRespeito(int respeito) { this.respeito = respeito; }
    public int getEvHp() { return evHp; }
    public void setEvHp(int evHp) { this.evHp = evHp; }
    public int getEvAtaque() { return evAtaque; }
    public void setEvAtaque(int evAtaque) { this.evAtaque = evAtaque; }
    public int getEvDefesa() { return evDefesa; }
    public void setEvDefesa(int evDefesa) { this.evDefesa = evDefesa; }
    public int getEvAtaqueEspecial() { return evAtaqueEspecial; }
    public void setEvAtaqueEspecial(int evAtaqueEspecial) { this.evAtaqueEspecial = evAtaqueEspecial; }
    public int getEvDefesaEspecial() { return evDefesaEspecial; }
    public void setEvDefesaEspecial(int evDefesaEspecial) { this.evDefesaEspecial = evDefesaEspecial; }
    public int getEvSpeed() { return evSpeed; }
    public void setEvSpeed(int evSpeed) { this.evSpeed = evSpeed; }
    public String getHabilidadeAtivaId() { return habilidadeAtivaId; }
    public void setHabilidadeAtivaId(String habilidadeAtivaId) { this.habilidadeAtivaId = habilidadeAtivaId; }
    public String getHabilidadeAtivaNome() { return habilidadeAtivaNome; }
    public void setHabilidadeAtivaNome(String habilidadeAtivaNome) { this.habilidadeAtivaNome = habilidadeAtivaNome; }
    public String getOrigem() { return origem; }
    public void setOrigem(String origem) { this.origem = origem; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public List<String> getStatusAtuais() { return statusAtuais; }
    public void setStatusAtuais(List<String> statusAtuais) { this.statusAtuais = statusAtuais; }
    public List<MovimentoResponseDto> getMovimentosConhecidos() { return movimentosConhecidos; }
    public void setMovimentosConhecidos(List<MovimentoResponseDto> movimentosConhecidos) { this.movimentosConhecidos = movimentosConhecidos; }
}
