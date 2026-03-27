package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.Genero;
import com.pokemonamethyst.domain.EstadoPokemon;
import com.pokemonamethyst.domain.Habilidade;
import com.pokemonamethyst.domain.OrigemPokemon;
import com.pokemonamethyst.domain.PerfilJogador;
import com.pokemonamethyst.domain.Pokemon;
import com.pokemonamethyst.domain.PokemonSpecies;
import com.pokemonamethyst.repository.HabilidadeRepository;
import com.pokemonamethyst.repository.ItemRepository;
import com.pokemonamethyst.repository.MovimentoRepository;
import com.pokemonamethyst.repository.PerfilJogadorRepository;
import com.pokemonamethyst.repository.PersonalidadeRepository;
import com.pokemonamethyst.repository.PokemonRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PokemonServiceTest {

    @Test
    void criarDeveFalharQuandoPokedexIdForZeroOuNulo() {
        PokemonRepository pokemonRepository = mock(PokemonRepository.class);
        PerfilJogadorRepository perfilRepository = mock(PerfilJogadorRepository.class);
        ItemRepository itemRepository = mock(ItemRepository.class);
        MovimentoRepository movimentoRepository = mock(MovimentoRepository.class);
        HabilidadeRepository habilidadeRepository = mock(HabilidadeRepository.class);
        PersonalidadeRepository personalidadeRepository = mock(PersonalidadeRepository.class);
        PokeApiService pokeApiService = mock(PokeApiService.class);
        PokemonAbilityService pokemonAbilityService = mock(PokemonAbilityService.class);
        PokemonLearnsetService pokemonLearnsetService = mock(PokemonLearnsetService.class);

        PokemonService service = new PokemonService(
                pokemonRepository,
                perfilRepository,
                itemRepository,
                movimentoRepository,
                habilidadeRepository,
                personalidadeRepository,
                pokeApiService,
                pokemonAbilityService,
                pokemonLearnsetService,
                100,
                false
        );

        assertThatThrownBy(() -> service.criar(
                "perfil-1",
                0,
                null,
                null,
                null,
                10,
                null,
                null
        )).isInstanceOf(com.pokemonamethyst.exception.RegraNegocioException.class)
                .hasMessageContaining("pokedexId");
    }

    @Test
    void criarDeveGerarIvsEHabilidadeAtiva() {
        PokemonRepository pokemonRepository = mock(PokemonRepository.class);
        PerfilJogadorRepository perfilRepository = mock(PerfilJogadorRepository.class);
        ItemRepository itemRepository = mock(ItemRepository.class);
        MovimentoRepository movimentoRepository = mock(MovimentoRepository.class);
        HabilidadeRepository habilidadeRepository = mock(HabilidadeRepository.class);
        PersonalidadeRepository personalidadeRepository = mock(PersonalidadeRepository.class);
        PokeApiService pokeApiService = mock(PokeApiService.class);
        PokemonAbilityService pokemonAbilityService = mock(PokemonAbilityService.class);
        PokemonLearnsetService pokemonLearnsetService = mock(PokemonLearnsetService.class);

        PokemonService service = new PokemonService(
                pokemonRepository,
                perfilRepository,
                itemRepository,
                movimentoRepository,
                habilidadeRepository,
                personalidadeRepository,
                pokeApiService,
                pokemonAbilityService,
                pokemonLearnsetService,
                100,
                false
        );

        PerfilJogador perfil = new PerfilJogador();
        perfil.setId("perfil-1");

        PokemonSpecies species = new PokemonSpecies();
        species.setId("species-1");
        species.setPokedexId(1);
        species.setNome("Bulbasaur");
        species.setGenderRate(8);

        Habilidade ability = new Habilidade();
        ability.setId("ab-1");
        ability.setNome("Overgrow");

        when(perfilRepository.findById("perfil-1")).thenReturn(Optional.of(perfil));
        when(pokemonRepository.save(any(Pokemon.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(perfilRepository.save(any(PerfilJogador.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(pokeApiService.obterSpeciesParaCriacao(1)).thenReturn(species);
        when(pokemonAbilityService.sortearHabilidadeAtiva(species)).thenReturn(ability);
        when(pokemonLearnsetService.escolherMovimentosAoCriarPokemon(species, 1)).thenReturn(List.of());

        Pokemon criado = service.criar(
                "perfil-1",
                1,
                "Seed",
                null,
                null,
                10,
                null,
                null
        );

        ArgumentCaptor<Pokemon> captor = ArgumentCaptor.forClass(Pokemon.class);
        org.mockito.Mockito.verify(pokemonRepository).save(captor.capture());
        Pokemon salvo = captor.getValue();

        assertThat(criado.getHabilidadeAtiva()).isNotNull();
        assertThat(criado.isShiny()).isTrue();
        assertThat(criado.getGenero()).isEqualTo(Genero.FEMEA);
        assertThat(salvo.getIvHp()).isBetween(0, 31);
        assertThat(salvo.getIvAtaque()).isBetween(0, 31);
        assertThat(salvo.getIvDefesa()).isBetween(0, 31);
        assertThat(salvo.getIvAtaqueEspecial()).isBetween(0, 31);
        assertThat(salvo.getIvDefesaEspecial()).isBetween(0, 31);
        assertThat(salvo.getIvSpeed()).isBetween(0, 31);
        assertThat(salvo.getHpAtual()).isNotNull().isPositive();
        assertThat(salvo.getOrigem()).isEqualTo(OrigemPokemon.TREINADOR);
        assertThat(salvo.getEstado()).isEqualTo(EstadoPokemon.ATIVO);
    }
}
