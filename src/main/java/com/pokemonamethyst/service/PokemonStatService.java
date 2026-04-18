package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.Pokemon;
import com.pokemonamethyst.domain.PokemonIVClass;
import com.pokemonamethyst.domain.PokemonStatsCalculator;
import com.pokemonamethyst.exception.RegraNegocioException;
import org.springframework.stereotype.Service;

@Service
public class PokemonStatService {

    public int calcularHpMaximo(Pokemon pokemon) {
        return PokemonStatsCalculator.hpMaximo(pokemon);
    }

    public int calcularStaminaMaxima(Pokemon pokemon) {
        return PokemonStatsCalculator.staminaMaxima(pokemon);
    }

    public int calcularAtaque(Pokemon pokemon) {
        return PokemonStatsCalculator.statLivre(pokemon, "atr_ataque");
    }

    public int calcularDefesa(Pokemon pokemon) {
        return PokemonStatsCalculator.statLivre(pokemon, "atr_defesa");
    }

    public int calcularAtaqueEspecial(Pokemon pokemon) {
        return PokemonStatsCalculator.statLivre(pokemon, "atr_ataque_especial");
    }

    public int calcularDefesaEspecial(Pokemon pokemon) {
        return PokemonStatsCalculator.statLivre(pokemon, "atr_defesa_especial");
    }

    public int calcularSpeed(Pokemon pokemon) {
        return PokemonStatsCalculator.statLivre(pokemon, "atr_speed");
    }

    public int calcularTecnica(Pokemon pokemon) {
        return PokemonStatsCalculator.statLivre(pokemon, "atr_tecnica");
    }

    public int calcularRespeito(Pokemon pokemon) {
        return PokemonStatsCalculator.statLivre(pokemon, "atr_respeito");
    }

    public void sincronizarMaximos(Pokemon pokemon) {
        if (pokemon == null) {
            return;
        }
        int hpMaximo = calcularHpMaximo(pokemon);
        pokemon.setHpAtual(pokemon.getHpAtual() == null ? hpMaximo : Math.max(0, Math.min(pokemon.getHpAtual(), hpMaximo)));
        pokemon.setStaminaMaxima(calcularStaminaMaxima(pokemon));
    }

    public void concederPontosPorNivel(Pokemon pokemon, int nivelAnterior, int nivelNovo) {
        if (pokemon == null || nivelNovo <= nivelAnterior) {
            return;
        }
        PokemonIVClass classe = pokemon.getIvClass();
        if (classe == null) {
            classe = PokemonIVClass.fromBst(0);
        }
        int pontos = 0;
        for (int nivel = nivelAnterior + 1; nivel <= nivelNovo; nivel++) {
            pontos += classe.getPontosPorNivel();
        }
        pokemon.setPontosDistribuicaoDisponiveis(Math.max(0, pokemon.getPontosDistribuicaoDisponiveis() + pontos));
    }

    public void alocarPontos(Pokemon pokemon, String atributo, int quantidade) {
        alocarPontos(pokemon, atributo, quantidade, false);
    }

    public void alocarPontos(Pokemon pokemon, String atributo, int quantidade, boolean ignorarLimiteDeSaldo) {
        if (pokemon == null) {
            throw new RegraNegocioException("Pokémon inválido.");
        }
        if (atributo == null || atributo.isBlank()) {
            throw new RegraNegocioException("Atributo inválido.");
        }
        if (quantidade <= 0) {
            throw new RegraNegocioException("Quantidade deve ser maior que zero.");
        }
        for (int i = 0; i < quantidade; i++) {
            alocarUmPonto(pokemon, atributo, ignorarLimiteDeSaldo);
        }
        sincronizarMaximos(pokemon);
    }

    public int custoParaProximoPonto(Pokemon pokemon, String atributo) {
        int valorAtual = obterValorAtual(pokemon, atributo);
        return custoPorRegra(atributo, valorAtual);
    }

    public int totalAtributosInvestidos(Pokemon pokemon) {
        if (pokemon == null) {
            return 0;
        }
        return Math.max(0,
                pokemon.getAtrAtaque()
                        + pokemon.getAtrDefesa()
                        + pokemon.getAtrAtaqueEspecial()
                        + pokemon.getAtrDefesaEspecial()
                        + pokemon.getAtrSpeed()
                        + pokemon.getAtrHp()
                        + pokemon.getAtrStamina()
                        + pokemon.getAtrTecnica()
                        + pokemon.getAtrRespeito());
    }

    public int totalAtributosDistribuiveisReset(Pokemon pokemon) {
        return totalAtributosInvestidos(pokemon);
    }

    public void resetarAtributosInvestidos(Pokemon pokemon) {
        if (pokemon == null) {
            return;
        }
        int devolvidos = totalAtributosDistribuiveisReset(pokemon);
        pokemon.setPontosDistribuicaoDisponiveis(Math.max(0, pokemon.getPontosDistribuicaoDisponiveis() + devolvidos));
        pokemon.setAtrAtaque(0);
        pokemon.setAtrDefesa(0);
        pokemon.setAtrAtaqueEspecial(0);
        pokemon.setAtrDefesaEspecial(0);
        pokemon.setAtrSpeed(0);
        pokemon.setAtrHp(0);
        pokemon.setAtrStamina(0);
        pokemon.setAtrTecnica(0);
        pokemon.setAtrRespeito(0);
        sincronizarMaximos(pokemon);
    }

    private void alocarUmPonto(Pokemon pokemon, String atributo, boolean ignorarLimiteDeSaldo) {
        int custo = custoParaProximoPonto(pokemon, atributo);
        if (!ignorarLimiteDeSaldo && pokemon.getPontosDistribuicaoDisponiveis() < custo) {
            throw new RegraNegocioException("Pontos de distribuição insuficientes.");
        }
        int novoValor = obterValorAtual(pokemon, atributo) + 1;
        definirValorAtual(pokemon, atributo, novoValor);
        pokemon.setPontosDistribuicaoDisponiveis(pokemon.getPontosDistribuicaoDisponiveis() - custo);
    }

    private int custoPorRegra(String atributo, int valorAtual) {
        if ("atr_hp".equals(atributo) || "atr_stamina".equals(atributo)) {
            return 1;
        }
        if (valorAtual >= 10) {
            return 3;
        }
        if (valorAtual >= 5) {
            return 2;
        }
        return 1;
    }

    private int obterValorAtual(Pokemon pokemon, String atributo) {
        if (pokemon == null) {
            return 0;
        }
        return switch (atributo) {
            case "atr_ataque" -> pokemon.getAtrAtaque();
            case "atr_defesa" -> pokemon.getAtrDefesa();
            case "atr_ataque_especial" -> pokemon.getAtrAtaqueEspecial();
            case "atr_defesa_especial" -> pokemon.getAtrDefesaEspecial();
            case "atr_speed" -> pokemon.getAtrSpeed();
            case "atr_hp" -> pokemon.getAtrHp();
            case "atr_stamina" -> pokemon.getAtrStamina();
            case "atr_tecnica" -> pokemon.getAtrTecnica();
            case "atr_respeito" -> pokemon.getAtrRespeito();
            default -> throw new RegraNegocioException("Atributo desconhecido: " + atributo);
        };
    }

    private void definirValorAtual(Pokemon pokemon, String atributo, int valor) {
        switch (atributo) {
            case "atr_ataque" -> pokemon.setAtrAtaque(valor);
            case "atr_defesa" -> pokemon.setAtrDefesa(valor);
            case "atr_ataque_especial" -> pokemon.setAtrAtaqueEspecial(valor);
            case "atr_defesa_especial" -> pokemon.setAtrDefesaEspecial(valor);
            case "atr_speed" -> pokemon.setAtrSpeed(valor);
            case "atr_hp" -> pokemon.setAtrHp(valor);
            case "atr_stamina" -> pokemon.setAtrStamina(valor);
            case "atr_tecnica" -> pokemon.setAtrTecnica(valor);
            case "atr_respeito" -> pokemon.setAtrRespeito(valor);
            default -> throw new RegraNegocioException("Atributo desconhecido: " + atributo);
        }
    }
}
