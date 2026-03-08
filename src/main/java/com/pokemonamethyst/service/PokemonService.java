package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.*;
import com.pokemonamethyst.exception.RecursoNaoEncontradoException;
import com.pokemonamethyst.exception.RegraNegocioException;
import com.pokemonamethyst.repository.ItemRepository;
import com.pokemonamethyst.repository.PokemonRepository;
import com.pokemonamethyst.repository.PerfilJogadorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class PokemonService {

    private static final int MAX_POKEMONS_NO_TIME = 6;

    private final PokemonRepository pokemonRepository;
    private final PerfilJogadorRepository perfilRepository;
    private final ItemRepository itemRepository;

    public PokemonService(PokemonRepository pokemonRepository, PerfilJogadorRepository perfilRepository,
                          ItemRepository itemRepository) {
        this.pokemonRepository = pokemonRepository;
        this.perfilRepository = perfilRepository;
        this.itemRepository = itemRepository;
    }

    public List<Pokemon> listarPorPerfil(String perfilId) {
        return pokemonRepository.findByPerfilIdOrderByOrdemTimeAsc(perfilId);
    }

    public List<Pokemon> listarTimePrincipal(String perfilId) {
        return pokemonRepository.findTimePrincipalByPerfilId(perfilId);
    }

    public List<Pokemon> listarBox(String perfilId) {
        return pokemonRepository.findBoxByPerfilId(perfilId);
    }

    public Pokemon buscarPorIdEPerfil(String id, String perfilId) {
        return pokemonRepository.findByIdAndPerfilId(id, perfilId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Pokémon não encontrado."));
    }

    @Transactional
    public Pokemon criar(String perfilId, int pokedexId, String especie, Tipagem tipoPrimario,
                         String apelido, Tipagem tipoSecundario, Genero genero, Pokebola pokebolaCaptura,
                         int hpMaximo, int staminaMaxima, String imagemUrl) {
        PerfilJogador perfil = perfilRepository.findById(perfilId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Perfil não encontrado."));

        Pokemon pokemon = new Pokemon();
        pokemon.setPerfil(perfil);
        pokemon.setOrdemTime(null);
        pokemon.setPokedexId(pokedexId);
        pokemon.setEspecie(especie);
        pokemon.setTipoPrimario(tipoPrimario);
        pokemon.setTipoSecundario(tipoSecundario);
        pokemon.setGenero(genero != null ? genero : Genero.SEM_GENERO);
        pokemon.setPokebolaCaptura(pokebolaCaptura != null ? pokebolaCaptura : Pokebola.POKEBALL);
        pokemon.setApelido(apelido);
        if (imagemUrl != null && !imagemUrl.isBlank()) {
            pokemon.setImagemUrl(imagemUrl);
        }
        pokemon.setHpMaximo(hpMaximo);
        pokemon.setHpAtual(hpMaximo);
        pokemon.setStaminaMaxima(staminaMaxima);
        pokemon.setStaminaAtual(staminaMaxima);
        pokemon.setNivel(1);
        pokemon.setXpAtual(0);

        Pokemon salvo = pokemonRepository.save(pokemon);
        perfil.getPokemons().add(salvo);
        perfilRepository.save(perfil);
        return salvo;
    }

    @Transactional
    public Pokemon atualizar(String pokemonId, String perfilId, String apelido, String imagemUrl, String notas,
                            Genero genero, Boolean isShiny, Tipagem tipoSecundario, Personalidade personalidade,
                            Especializacao especializacao, String berryFavorita, Integer nivelDeVinculo,
                            Integer nivel, Integer xpAtual, Pokebola pokebolaCaptura, String itemSeguradoId,
                            Integer hpAtual, Integer hpTemporario, Integer staminaAtual, Integer staminaTemporaria,
                            Integer ataque, Integer ataqueEspecial, Integer defesa, Integer defesaEspecial,
                            Integer speed, Integer tecnica, Integer respeito, List<CondicaoStatus> statusAtuais) {
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
        if (apelido != null) pokemon.setApelido(apelido);
        if (imagemUrl != null) pokemon.setImagemUrl(imagemUrl);
        if (notas != null) pokemon.setNotas(notas);
        if (genero != null) pokemon.setGenero(genero);
        if (isShiny != null) pokemon.setShiny(isShiny);
        if (tipoSecundario != null) pokemon.setTipoSecundario(tipoSecundario);
        if (personalidade != null) pokemon.setPersonalidade(personalidade);
        if (especializacao != null) pokemon.setEspecializacao(especializacao);
        if (berryFavorita != null) pokemon.setBerryFavorita(berryFavorita);
        if (nivelDeVinculo != null) pokemon.setNivelDeVinculo(nivelDeVinculo);
        if (nivel != null) pokemon.setNivel(nivel);
        if (xpAtual != null) pokemon.setXpAtual(xpAtual);
        if (pokebolaCaptura != null) pokemon.setPokebolaCaptura(pokebolaCaptura);
        if (itemSeguradoId != null) {
            if (itemSeguradoId.isBlank()) {
                pokemon.setItemSegurado(null);
            } else {
                Item item = itemRepository.findById(itemSeguradoId).orElse(null);
                pokemon.setItemSegurado(item);
            }
        }
        if (hpAtual != null) pokemon.setHpAtual(hpAtual);
        if (hpTemporario != null) pokemon.setHpTemporario(hpTemporario);
        if (staminaAtual != null) pokemon.setStaminaAtual(staminaAtual);
        if (staminaTemporaria != null) pokemon.setStaminaTemporaria(staminaTemporaria);
        if (ataque != null) pokemon.setAtaque(ataque);
        if (ataqueEspecial != null) pokemon.setAtaqueEspecial(ataqueEspecial);
        if (defesa != null) pokemon.setDefesa(defesa);
        if (defesaEspecial != null) pokemon.setDefesaEspecial(defesaEspecial);
        if (speed != null) pokemon.setSpeed(speed);
        if (tecnica != null) pokemon.setTecnica(tecnica);
        if (respeito != null) pokemon.setRespeito(respeito);
        if (statusAtuais != null) pokemon.setStatusAtuais(statusAtuais);
        return pokemonRepository.save(pokemon);
    }

    @Transactional
    public Pokemon colocarNoTime(String pokemonId, String perfilId, int ordem) {
        if (ordem < 1 || ordem > MAX_POKEMONS_NO_TIME) {
            throw new RegraNegocioException("Ordem no time deve ser entre 1 e " + MAX_POKEMONS_NO_TIME + ".");
        }
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
        int noTime = pokemonRepository.countTimePrincipalByPerfilId(perfilId);
        if (pokemon.getOrdemTime() == null || pokemon.getOrdemTime() == 0) {
            if (noTime >= MAX_POKEMONS_NO_TIME) {
                throw new RegraNegocioException("Time principal já está cheio (máximo " + MAX_POKEMONS_NO_TIME + ").");
            }
        }
        pokemon.setOrdemTime(ordem);
        return pokemonRepository.save(pokemon);
    }

    @Transactional
    public Pokemon removerDoTime(String pokemonId, String perfilId) {
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
        pokemon.setOrdemTime(null);
        return pokemonRepository.save(pokemon);
    }

    @Transactional
    public void excluir(String pokemonId, String perfilId) {
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
        PerfilJogador perfil = pokemon.getPerfil();
        perfil.getPokemons().remove(pokemon);
        pokemonRepository.delete(pokemon);
    }
}
