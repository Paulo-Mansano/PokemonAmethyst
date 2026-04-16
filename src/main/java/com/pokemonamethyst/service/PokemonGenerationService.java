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
        pokemon.setPontosDistribuicaoDisponiveis(ivClass.rolarPontosDistribuicaoIniciais());
        pokemon.setHpBaseRng(ivClass.rolarHpBaseRngInicial());
        pokemon.setStaminaBaseRng(ivClass.rolarStaminaBaseRngInicial());
        zerarAtributosInvestidos(pokemon);
    }

    public void reinicializarParaEvolucao(Pokemon pokemon, PokemonSpecies novaSpecies) {
        if (pokemon == null) {
            return;
        }
        pokemon.setSpecies(novaSpecies);
        PokemonIVClass ivClass = classificar(novaSpecies);
        pokemon.setIvClass(ivClass);
        pokemon.setHpBaseRng(ivClass.rolarHpBaseRngInicial());
        pokemon.setStaminaBaseRng(ivClass.rolarStaminaBaseRngInicial());
        zerarAtributosInvestidos(pokemon);
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
