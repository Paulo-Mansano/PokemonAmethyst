package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.*;
import com.pokemonamethyst.exception.RecursoNaoEncontradoException;
import com.pokemonamethyst.exception.RegraNegocioException;
import com.pokemonamethyst.repository.ItemRepository;
import com.pokemonamethyst.repository.PersonalidadeRepository;
import com.pokemonamethyst.repository.PokemonRepository;
import com.pokemonamethyst.repository.PerfilJogadorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class PokemonService {

    private static final int MAX_POKEMONS_NO_TIME = 6;
    private static final int MAX_MOVIMENTOS_POR_POKEMON = 8;

    private final PokemonRepository pokemonRepository;
    private final PerfilJogadorRepository perfilRepository;
    private final ItemRepository itemRepository;
    private final com.pokemonamethyst.repository.MovimentoRepository movimentoRepository;
    private final PersonalidadeRepository personalidadeRepository;

    public PokemonService(PokemonRepository pokemonRepository, PerfilJogadorRepository perfilRepository,
                          ItemRepository itemRepository, com.pokemonamethyst.repository.MovimentoRepository movimentoRepository,
                          PersonalidadeRepository personalidadeRepository) {
        this.pokemonRepository = pokemonRepository;
        this.perfilRepository = perfilRepository;
        this.itemRepository = itemRepository;
        this.movimentoRepository = movimentoRepository;
        this.personalidadeRepository = personalidadeRepository;
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

    /**
     * Cria um Pokémon vazio (espécie "???", tipo NORMAL, pokedexId 0) e coloca no time se houver vaga, senão na box.
     */
    @Transactional
    public Pokemon criarVazio(String perfilId) {
        PerfilJogador perfil = perfilRepository.findById(perfilId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Perfil não encontrado."));
        int noTime = pokemonRepository.countTimePrincipalByPerfilId(perfilId);
        Pokemon pokemon = new Pokemon();
        pokemon.setPerfil(perfil);
        pokemon.setPokedexId(0);
        pokemon.setEspecie("???");
        pokemon.setTipoPrimario(Tipagem.NORMAL);
        pokemon.setTipoSecundario(null);
        pokemon.setGenero(Genero.SEM_GENERO);
        pokemon.setPokebolaCaptura(Pokebola.POKEBALL);
        pokemon.setHpMaximo(20);
        pokemon.setHpAtual(20);
        pokemon.setStaminaMaxima(10);
        pokemon.setStaminaAtual(10);
        pokemon.setNivel(1);
        pokemon.setXpAtual(0);
        if (noTime < MAX_POKEMONS_NO_TIME) {
            pokemon.setOrdemTime(noTime + 1);
        } else {
            pokemon.setOrdemTime(null);
        }
        Pokemon salvo = pokemonRepository.save(pokemon);
        perfil.getPokemons().add(salvo);
        perfilRepository.save(perfil);
        return salvo;
    }

    @Transactional
    public Pokemon criar(String perfilId, Integer pokedexId, String especie, Tipagem tipoPrimario,
                         String apelido, Tipagem tipoSecundario, Genero genero, Pokebola pokebolaCaptura,
                         int hpMaximo, int staminaMaxima, String imagemUrl, List<String> movimentoIds,
                         String personalidadeId) {
        PerfilJogador perfil = perfilRepository.findById(perfilId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Perfil não encontrado."));

        if (movimentoIds != null && movimentoIds.size() > MAX_MOVIMENTOS_POR_POKEMON) {
            throw new RegraNegocioException("Máximo de " + MAX_MOVIMENTOS_POR_POKEMON + " ataques por Pokémon.");
        }

        int pokedexIdVal = (pokedexId != null && pokedexId >= 0) ? pokedexId : 0;
        Pokemon pokemon = new Pokemon();
        pokemon.setPerfil(perfil);
        pokemon.setOrdemTime(null);
        pokemon.setPokedexId(pokedexIdVal);
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
        if (personalidadeId != null && !personalidadeId.isBlank()) {
            personalidadeRepository.findById(personalidadeId).ifPresent(pokemon::setPersonalidade);
        }

        if (movimentoIds != null && !movimentoIds.isEmpty()) {
            List<Movimento> movimentos = new ArrayList<>();
            for (String id : movimentoIds) {
                Movimento m = movimentoRepository.findById(id)
                        .orElseThrow(() -> new RecursoNaoEncontradoException("Movimento não encontrado: " + id));
                movimentos.add(m);
            }
            pokemon.setMovimentosConhecidos(movimentos);
        }

        Pokemon salvo = pokemonRepository.save(pokemon);
        perfil.getPokemons().add(salvo);
        perfilRepository.save(perfil);
        return salvo;
    }

    @Transactional
    public Pokemon atualizar(String pokemonId, String perfilId, String especie, Tipagem tipoPrimario, Tipagem tipoSecundario,
                            Integer pokedexId, String apelido, String imagemUrl, String notas,
                            Genero genero, Boolean isShiny, String personalidadeId,
                            Especializacao especializacao, String berryFavorita, Integer nivelDeVinculo,
                            Integer nivel, Integer xpAtual, Pokebola pokebolaCaptura, String itemSeguradoId,
                            Integer hpAtual, Integer hpTemporario, Integer staminaAtual, Integer staminaTemporaria,
                            Integer ataque, Integer ataqueEspecial, Integer defesa, Integer defesaEspecial,
                            Integer speed, Integer tecnica, Integer respeito, List<CondicaoStatus> statusAtuais,
                            List<String> movimentoIds) {
        Pokemon pokemon = buscarPorIdEPerfil(pokemonId, perfilId);
        if (especie != null && !especie.isBlank()) pokemon.setEspecie(especie);
        if (tipoPrimario != null) pokemon.setTipoPrimario(tipoPrimario);
        if (tipoSecundario != null) pokemon.setTipoSecundario(tipoSecundario);
        if (pokedexId != null && pokedexId >= 0) pokemon.setPokedexId(pokedexId);
        if (apelido != null) pokemon.setApelido(apelido);
        if (imagemUrl != null) pokemon.setImagemUrl(imagemUrl);
        if (notas != null) pokemon.setNotas(notas);
        if (genero != null) pokemon.setGenero(genero);
        if (isShiny != null) pokemon.setShiny(isShiny);
        if (personalidadeId != null) {
            if (personalidadeId.isBlank()) {
                pokemon.setPersonalidade(null);
            } else {
                Personalidade personalidade = personalidadeRepository.findById(personalidadeId).orElse(null);
                pokemon.setPersonalidade(personalidade);
            }
        }
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
        if (movimentoIds != null) {
            if (movimentoIds.size() > MAX_MOVIMENTOS_POR_POKEMON) {
                throw new RegraNegocioException("Máximo de " + MAX_MOVIMENTOS_POR_POKEMON + " ataques por Pokémon.");
            }
            List<Movimento> movimentos = new ArrayList<>();
            for (String id : movimentoIds) {
                Movimento m = movimentoRepository.findById(id)
                        .orElseThrow(() -> new RecursoNaoEncontradoException("Movimento não encontrado: " + id));
                movimentos.add(m);
            }
            pokemon.getMovimentosConhecidos().clear();
            pokemon.getMovimentosConhecidos().addAll(movimentos);
        }
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
