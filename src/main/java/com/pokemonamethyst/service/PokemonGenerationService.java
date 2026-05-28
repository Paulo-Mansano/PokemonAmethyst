package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.Pokemon;
import com.pokemonamethyst.domain.PokemonIVClass;
import com.pokemonamethyst.domain.PokemonSpecies;
import org.springframework.stereotype.Service;

@Service
public class PokemonGenerationService {

    public int calcularBst(PokemonSpecies species) {
        if (species == null) {
            return 0;
        }
        return Math.max(0,
                species.getBaseHp()
                        + species.getBaseAtaque()
                        + species.getBaseDefesa()
                        + species.getBaseAtaqueEspecial()
                        + species.getBaseDefesaEspecial()
                        + species.getBaseSpeed());
    }

    public PokemonIVClass classificar(PokemonSpecies species) {
        return PokemonIVClass.fromBst(calcularBst(species));
    }

    public void inicializarPokemonNovo(Pokemon pokemon) {
        if (pokemon == null) {
            return;
        }
        PokemonIVClass ivClass = classificar(pokemon.getSpecies());
        pokemon.setIvClass(ivClass);
        int pontosIniciais = ivClass.rolarPontosDistribuicaoIniciais();
        pokemon.setPontosDistribuicaoDisponiveis(pontosIniciais);
        pokemon.setPontosRollInicial(pontosIniciais);
        pokemon.setHpBaseRng(ivClass.rolarHpBaseRngInicial());
        pokemon.setStaminaBaseRng(ivClass.rolarStaminaBaseRngInicial());
        zerarAtributosInvestidos(pokemon);
    }

    public void reinicializarParaEvolucao(Pokemon pokemon, PokemonSpecies novaSpecies) {
        if (pokemon == null) {
            return;
        }
        PokemonIVClass ivClassAntiga = pokemon.getIvClass() != null ? pokemon.getIvClass() : PokemonIVClass.fromBst(0);
        int hpRngAntigo = pokemon.getHpBaseRng();
        int staminaRngAntigo = pokemon.getStaminaBaseRng();

        pokemon.setSpecies(novaSpecies);
        PokemonIVClass ivClassNova = classificar(novaSpecies);
        pokemon.setIvClass(ivClassNova);

        pokemon.setHpBaseRng(traduzirPorcentil(hpRngAntigo,
                ivClassAntiga.getHpMin(), ivClassAntiga.getHpMax(),
                ivClassNova.getHpMin(), ivClassNova.getHpMax()));
        pokemon.setStaminaBaseRng(traduzirPorcentil(staminaRngAntigo,
                ivClassAntiga.getStaminaMin(), ivClassAntiga.getStaminaMax(),
                ivClassNova.getStaminaMin(), ivClassNova.getStaminaMax()));
        zerarAtributosInvestidos(pokemon);
    }

    public int traduzirPorcentil(int valorAntigo, int minAntigo, int maxAntigo, int minNovo, int maxNovo) {
        if (maxAntigo <= minAntigo) return minNovo;
        double percentil = Math.max(0.0, Math.min(1.0, (double)(valorAntigo - minAntigo) / (maxAntigo - minAntigo)));
        return (int) Math.round(minNovo + percentil * (maxNovo - minNovo));
    }

    public void zerarAtributosInvestidos(Pokemon pokemon) {
        if (pokemon == null) {
            return;
        }
        pokemon.setAtrAtaque(0);
        pokemon.setAtrDefesa(0);
        pokemon.setAtrAtaqueEspecial(0);
        pokemon.setAtrDefesaEspecial(0);
        pokemon.setAtrSpeed(0);
        pokemon.setAtrHp(0);
        pokemon.setAtrStamina(0);
        pokemon.setAtrTecnica(0);
        pokemon.setAtrRespeito(0);
    }
}
