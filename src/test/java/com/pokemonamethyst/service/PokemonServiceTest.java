package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.Genero;
import com.pokemonamethyst.domain.EstadoPokemon;
import com.pokemonamethyst.domain.Especializacao;
import com.pokemonamethyst.domain.Habilidade;
import com.pokemonamethyst.domain.Item;
import com.pokemonamethyst.domain.OrigemPokemon;
import com.pokemonamethyst.domain.Personalidade;
import com.pokemonamethyst.domain.PerfilJogador;
import com.pokemonamethyst.domain.Pokemon;
import com.pokemonamethyst.domain.PokemonIVClass;
import com.pokemonamethyst.domain.PokemonSpecies;
import com.pokemonamethyst.repository.HabilidadeRepository;
import com.pokemonamethyst.repository.ItemRepository;
import com.pokemonamethyst.repository.MovimentoRepository;
import com.pokemonamethyst.repository.PerfilJogadorRepository;
import com.pokemonamethyst.repository.PersonalidadeRepository;
import com.pokemonamethyst.repository.PokemonRepository;
import com.pokemonamethyst.repository.PokemonSpeciesRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

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
        PokemonGenerationService pokemonGenerationService = new PokemonGenerationService();
        PokemonStatService pokemonStatService = new PokemonStatService();
        PokemonEvolutionService pokemonEvolutionService = mock(PokemonEvolutionService.class);
        PokemonSpeciesRepository pokemonSpeciesRepository = mock(PokemonSpeciesRepository.class);

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
                pokemonGenerationService,
                pokemonStatService,
                pokemonEvolutionService,
                pokemonSpeciesRepository,
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
        PokemonGenerationService pokemonGenerationService = new PokemonGenerationService();
        PokemonStatService pokemonStatService = new PokemonStatService();
        PokemonEvolutionService pokemonEvolutionService = mock(PokemonEvolutionService.class);
        PokemonSpeciesRepository pokemonSpeciesRepository = mock(PokemonSpeciesRepository.class);

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
                pokemonGenerationService,
                pokemonStatService,
                pokemonEvolutionService,
                pokemonSpeciesRepository,
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
        species.setBaseHp(60);
        species.setBaseAtaque(60);
        species.setBaseDefesa(60);
        species.setBaseAtaqueEspecial(60);
        species.setBaseDefesaEspecial(60);
        species.setBaseSpeed(60);

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
                null,
                null
        );

        ArgumentCaptor<Pokemon> captor = ArgumentCaptor.forClass(Pokemon.class);
        org.mockito.Mockito.verify(pokemonRepository).save(captor.capture());
        Pokemon salvo = captor.getValue();

        assertThat(criado.getHabilidadeAtiva()).isNotNull();
        assertThat(criado.isShiny()).isTrue();
        assertThat(criado.getGenero()).isEqualTo(Genero.FEMEA);
                assertThat(salvo.getIvClass()).isEqualTo(PokemonIVClass.E);
                assertThat(salvo.getPontosDistribuicaoDisponiveis()).isBetween(12, 15);
                assertThat(salvo.getHpBaseRng()).isBetween(15, 20);
                assertThat(salvo.getStaminaBaseRng()).isBetween(15, 20);
                assertThat(salvo.getAtrAtaque()).isZero();
                assertThat(salvo.getAtrHp()).isZero();
        assertThat(salvo.getHpAtual()).isNotNull().isPositive();
                assertThat(salvo.getStaminaMaxima()).isPositive();
        assertThat(salvo.getOrigem()).isEqualTo(OrigemPokemon.TREINADOR);
        assertThat(salvo.getEstado()).isEqualTo(EstadoPokemon.ATIVO);
    }

        @Test
        void criarAcimaDoNivelUmDeveConcederPontosPorNivel() {
                PokemonRepository pokemonRepository = mock(PokemonRepository.class);
                PerfilJogadorRepository perfilRepository = mock(PerfilJogadorRepository.class);
                ItemRepository itemRepository = mock(ItemRepository.class);
                MovimentoRepository movimentoRepository = mock(MovimentoRepository.class);
                HabilidadeRepository habilidadeRepository = mock(HabilidadeRepository.class);
                PersonalidadeRepository personalidadeRepository = mock(PersonalidadeRepository.class);
                PokeApiService pokeApiService = mock(PokeApiService.class);
                PokemonAbilityService pokemonAbilityService = mock(PokemonAbilityService.class);
                PokemonLearnsetService pokemonLearnsetService = mock(PokemonLearnsetService.class);
                PokemonGenerationService pokemonGenerationService = new PokemonGenerationService();
                PokemonStatService pokemonStatService = new PokemonStatService();
                PokemonEvolutionService pokemonEvolutionService = mock(PokemonEvolutionService.class);
                PokemonSpeciesRepository pokemonSpeciesRepository = mock(PokemonSpeciesRepository.class);

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
                                pokemonGenerationService,
                                pokemonStatService,
                                pokemonEvolutionService,
                                pokemonSpeciesRepository,
                                0,
                                false
                );

                PerfilJogador perfil = new PerfilJogador();
                perfil.setId("perfil-2");

                PokemonSpecies species = new PokemonSpecies();
                species.setId("species-2");
                species.setPokedexId(2);
                species.setNome("Teste");
                species.setGenderRate(8);
                species.setBaseHp(60);
                species.setBaseAtaque(60);
                species.setBaseDefesa(60);
                species.setBaseAtaqueEspecial(60);
                species.setBaseDefesaEspecial(60);
                species.setBaseSpeed(60);

                Habilidade ability = new Habilidade();
                ability.setId("ab-2");
                ability.setNome("Ability");

                when(perfilRepository.findById("perfil-2")).thenReturn(Optional.of(perfil));
                when(pokemonRepository.save(any(Pokemon.class))).thenAnswer(invocation -> invocation.getArgument(0));
                when(perfilRepository.save(any(PerfilJogador.class))).thenAnswer(invocation -> invocation.getArgument(0));
                when(pokeApiService.obterSpeciesParaCriacao(2)).thenReturn(species);
                when(pokemonAbilityService.sortearHabilidadeAtiva(species)).thenReturn(ability);
                when(pokemonLearnsetService.escolherMovimentosAoCriarPokemon(species, 5)).thenReturn(List.of());

                Pokemon criado = service.criar(
                                "perfil-2",
                                2,
                                "Lv5",
                                null,
                                null,
                                10,
                                null,
                                null,
                                5
                );

                assertThat(criado.getNivel()).isEqualTo(5);
                assertThat(criado.getXpAtual()).isEqualTo(100);
                assertThat(criado.getIvClass()).isEqualTo(PokemonIVClass.E);
                // Classe E: base entre 12-15 e +2 por nível acima do 1 (4 níveis => +8).
                assertThat(criado.getPontosDistribuicaoDisponiveis()).isBetween(20, 23);
                // Bônus automático de HP/ST até nível 10 deve aplicar na criação acima do nível 1.
                assertThat(criado.getHpAtual() - criado.getHpBaseRng() - criado.getAtrHp()).isEqualTo(5);
                assertThat(criado.getStaminaMaxima() - criado.getStaminaBaseRng() - criado.getAtrStamina()).isEqualTo(5);
        }

    @Test
    void atualizarDeveAplicarPontosDistribuicaoBonusNoSalvamento() {
        PokemonRepository pokemonRepository = mock(PokemonRepository.class);
        PerfilJogadorRepository perfilRepository = mock(PerfilJogadorRepository.class);
        ItemRepository itemRepository = mock(ItemRepository.class);
        MovimentoRepository movimentoRepository = mock(MovimentoRepository.class);
        HabilidadeRepository habilidadeRepository = mock(HabilidadeRepository.class);
        PersonalidadeRepository personalidadeRepository = mock(PersonalidadeRepository.class);
        PokeApiService pokeApiService = mock(PokeApiService.class);
        PokemonAbilityService pokemonAbilityService = mock(PokemonAbilityService.class);
        PokemonLearnsetService pokemonLearnsetService = mock(PokemonLearnsetService.class);
        PokemonGenerationService pokemonGenerationService = new PokemonGenerationService();
        PokemonStatService pokemonStatService = new PokemonStatService();
        PokemonEvolutionService pokemonEvolutionService = mock(PokemonEvolutionService.class);
        PokemonSpeciesRepository pokemonSpeciesRepository = mock(PokemonSpeciesRepository.class);

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
                pokemonGenerationService,
                pokemonStatService,
                pokemonEvolutionService,
                pokemonSpeciesRepository,
                0,
                false
        );

        PerfilJogador perfil = new PerfilJogador();
        perfil.setId("perfil-3");

        PokemonSpecies species = new PokemonSpecies();
        species.setId("species-3");
        species.setPokedexId(3);
        species.setNome("Teste");
        species.setGenderRate(8);
        species.setBaseHp(60);
        species.setBaseAtaque(60);
        species.setBaseDefesa(60);
        species.setBaseAtaqueEspecial(60);
        species.setBaseDefesaEspecial(60);
        species.setBaseSpeed(60);

        Pokemon pokemon = new Pokemon();
        pokemon.setId("pokemon-3");
        pokemon.setPerfil(perfil);
        pokemon.setSpecies(species);
        pokemon.setNivel(5);
        pokemon.setXpAtual(100);
        pokemon.setPontosDistribuicaoDisponiveis(4);
        pokemon.setHpAtual(50);
        pokemon.setMovimentosConhecidos(new java.util.ArrayList<>());

        when(pokemonRepository.findByIdAndPerfilId("pokemon-3", "perfil-3")).thenReturn(Optional.of(pokemon));
        when(pokemonRepository.save(any(Pokemon.class))).thenAnswer(invocation -> invocation.getArgument(0));

        com.pokemonamethyst.web.dto.PokemonAtualizarComAprendizagemResponseDto resultado = service.atualizar(
                "pokemon-3",
                "perfil-3",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                5,
                100,
                null,
                null,
                null,
                        null,
                        null,
                        3,
                        null,
                        null,
                        null,
                false
        );

        assertThat(resultado.getPokemon().getPontosDistribuicaoDisponiveis()).isEqualTo(7);
    }

        @Test
        void criarDeveSortearPersonalidadeBerryEEspecializacaoPorBaseStat() {
                PokemonRepository pokemonRepository = mock(PokemonRepository.class);
                PerfilJogadorRepository perfilRepository = mock(PerfilJogadorRepository.class);
                ItemRepository itemRepository = mock(ItemRepository.class);
                MovimentoRepository movimentoRepository = mock(MovimentoRepository.class);
                HabilidadeRepository habilidadeRepository = mock(HabilidadeRepository.class);
                PersonalidadeRepository personalidadeRepository = mock(PersonalidadeRepository.class);
                PokeApiService pokeApiService = mock(PokeApiService.class);
                PokemonAbilityService pokemonAbilityService = mock(PokemonAbilityService.class);
                PokemonLearnsetService pokemonLearnsetService = mock(PokemonLearnsetService.class);
                PokemonGenerationService pokemonGenerationService = new PokemonGenerationService();
                PokemonStatService pokemonStatService = new PokemonStatService();
                PokemonEvolutionService pokemonEvolutionService = mock(PokemonEvolutionService.class);
                PokemonSpeciesRepository pokemonSpeciesRepository = mock(PokemonSpeciesRepository.class);

                PokemonService service = new TestPokemonService(
                                pokemonRepository,
                                perfilRepository,
                                itemRepository,
                                movimentoRepository,
                                habilidadeRepository,
                                personalidadeRepository,
                                pokeApiService,
                                pokemonAbilityService,
                                pokemonLearnsetService,
                                pokemonGenerationService,
                                pokemonStatService,
                                pokemonEvolutionService,
                                pokemonSpeciesRepository,
                                100,
                                false,
                                false,
                                0
                );

                PerfilJogador perfil = new PerfilJogador();
                perfil.setId("perfil-4");

                PokemonSpecies species = novaSpecies("species-4", 4, 70, 120, 60, 80, 70, 90);
                Habilidade ability = new Habilidade();
                ability.setId("ab-4");
                ability.setNome("Ability");

                Personalidade personalidade = new Personalidade();
                personalidade.setId("pers-1");
                personalidade.setNome("Calma");

                Item berry = new Item();
                berry.setId("item-1");
                berry.setNome("Oran Berry");
                berry.setNomeEn("oran-berry");

                when(perfilRepository.findById("perfil-4")).thenReturn(Optional.of(perfil));
                when(pokemonRepository.save(any(Pokemon.class))).thenAnswer(invocation -> invocation.getArgument(0));
                when(perfilRepository.save(any(PerfilJogador.class))).thenAnswer(invocation -> invocation.getArgument(0));
                when(pokeApiService.obterSpeciesParaCriacao(4)).thenReturn(species);
                when(pokemonAbilityService.sortearHabilidadeAtiva(species)).thenReturn(ability);
                when(pokemonLearnsetService.escolherMovimentosAoCriarPokemon(species, 1)).thenReturn(List.of());
                when(personalidadeRepository.findAllByOrderByNome()).thenReturn(List.of(personalidade));
                when(itemRepository.findByNomeEnContainingIgnoreCaseOrderByNomeEn("berry")).thenReturn(List.of(berry));

                Pokemon criado = service.criar("perfil-4", 4, "Atk", null, null, 10, null, null, null);

                assertThat(criado.getPersonalidade()).isNotNull();
                assertThat(criado.getPersonalidade().getId()).isEqualTo("pers-1");
                assertThat(criado.getBerryFavorita()).isEqualTo("oran-berry");
                assertThat(criado.getEspecializacao()).isEqualTo(Especializacao.ATACANTE_FISICO);
        }

        @Test
        void criarDeveRespeitarPersonalidadeInformadaQuandoPresente() {
                PokemonRepository pokemonRepository = mock(PokemonRepository.class);
                PerfilJogadorRepository perfilRepository = mock(PerfilJogadorRepository.class);
                ItemRepository itemRepository = mock(ItemRepository.class);
                MovimentoRepository movimentoRepository = mock(MovimentoRepository.class);
                HabilidadeRepository habilidadeRepository = mock(HabilidadeRepository.class);
                PersonalidadeRepository personalidadeRepository = mock(PersonalidadeRepository.class);
                PokeApiService pokeApiService = mock(PokeApiService.class);
                PokemonAbilityService pokemonAbilityService = mock(PokemonAbilityService.class);
                PokemonLearnsetService pokemonLearnsetService = mock(PokemonLearnsetService.class);
                PokemonGenerationService pokemonGenerationService = new PokemonGenerationService();
                PokemonStatService pokemonStatService = new PokemonStatService();
                PokemonEvolutionService pokemonEvolutionService = mock(PokemonEvolutionService.class);
                PokemonSpeciesRepository pokemonSpeciesRepository = mock(PokemonSpeciesRepository.class);

                PokemonService service = new TestPokemonService(
                                pokemonRepository,
                                perfilRepository,
                                itemRepository,
                                movimentoRepository,
                                habilidadeRepository,
                                personalidadeRepository,
                                pokeApiService,
                                pokemonAbilityService,
                                pokemonLearnsetService,
                                pokemonGenerationService,
                                pokemonStatService,
                                pokemonEvolutionService,
                                pokemonSpeciesRepository,
                                100,
                                false,
                                false,
                                0
                );

                PerfilJogador perfil = new PerfilJogador();
                perfil.setId("perfil-5");

                PokemonSpecies species = novaSpecies("species-5", 5, 100, 50, 90, 70, 90, 40);
                Habilidade ability = new Habilidade();
                ability.setId("ab-5");
                ability.setNome("Ability");

                Personalidade informada = new Personalidade();
                informada.setId("pers-informada");
                informada.setNome("Firme");

                Item berry = new Item();
                berry.setId("item-5");
                berry.setNome("Sitrus Berry");
                berry.setNomeEn("sitrus-berry");

                when(perfilRepository.findById("perfil-5")).thenReturn(Optional.of(perfil));
                when(pokemonRepository.save(any(Pokemon.class))).thenAnswer(invocation -> invocation.getArgument(0));
                when(perfilRepository.save(any(PerfilJogador.class))).thenAnswer(invocation -> invocation.getArgument(0));
                when(pokeApiService.obterSpeciesParaCriacao(5)).thenReturn(species);
                when(pokemonAbilityService.sortearHabilidadeAtiva(species)).thenReturn(ability);
                when(pokemonLearnsetService.escolherMovimentosAoCriarPokemon(species, 1)).thenReturn(List.of());
                when(personalidadeRepository.findById("pers-informada")).thenReturn(Optional.of(informada));
                when(itemRepository.findByNomeEnContainingIgnoreCaseOrderByNomeEn("berry")).thenReturn(List.of(berry));

                Pokemon criado = service.criar("perfil-5", 5, "Tank", null, null, 10, null, "pers-informada", null);

                assertThat(criado.getPersonalidade()).isNotNull();
                assertThat(criado.getPersonalidade().getId()).isEqualTo("pers-informada");
                assertThat(criado.getEspecializacao()).isEqualTo(Especializacao.TANQUE);
                verify(personalidadeRepository, never()).findAllByOrderByNome();
        }

        @Test
        void criarDevePermitirSuporteMesmoQuandoMaiorStatForOfensivo() {
                PokemonRepository pokemonRepository = mock(PokemonRepository.class);
                PerfilJogadorRepository perfilRepository = mock(PerfilJogadorRepository.class);
                ItemRepository itemRepository = mock(ItemRepository.class);
                MovimentoRepository movimentoRepository = mock(MovimentoRepository.class);
                HabilidadeRepository habilidadeRepository = mock(HabilidadeRepository.class);
                PersonalidadeRepository personalidadeRepository = mock(PersonalidadeRepository.class);
                PokeApiService pokeApiService = mock(PokeApiService.class);
                PokemonAbilityService pokemonAbilityService = mock(PokemonAbilityService.class);
                PokemonLearnsetService pokemonLearnsetService = mock(PokemonLearnsetService.class);
                PokemonGenerationService pokemonGenerationService = new PokemonGenerationService();
                PokemonStatService pokemonStatService = new PokemonStatService();
                PokemonEvolutionService pokemonEvolutionService = mock(PokemonEvolutionService.class);
                PokemonSpeciesRepository pokemonSpeciesRepository = mock(PokemonSpeciesRepository.class);

                PokemonService service = new TestPokemonService(
                                pokemonRepository,
                                perfilRepository,
                                itemRepository,
                                movimentoRepository,
                                habilidadeRepository,
                                personalidadeRepository,
                                pokeApiService,
                                pokemonAbilityService,
                                pokemonLearnsetService,
                                pokemonGenerationService,
                                pokemonStatService,
                                pokemonEvolutionService,
                                pokemonSpeciesRepository,
                                100,
                                false,
                                true,
                                0
                );

                PerfilJogador perfil = new PerfilJogador();
                perfil.setId("perfil-6");

                PokemonSpecies species = novaSpecies("species-6", 6, 45, 120, 50, 50, 50, 95);
                Habilidade ability = new Habilidade();
                ability.setId("ab-6");
                ability.setNome("Ability");

                Item berry = new Item();
                berry.setId("item-6");
                berry.setNome("Lum Berry");
                berry.setNomeEn("lum-berry");

                when(perfilRepository.findById("perfil-6")).thenReturn(Optional.of(perfil));
                when(pokemonRepository.save(any(Pokemon.class))).thenAnswer(invocation -> invocation.getArgument(0));
                when(perfilRepository.save(any(PerfilJogador.class))).thenAnswer(invocation -> invocation.getArgument(0));
                when(pokeApiService.obterSpeciesParaCriacao(6)).thenReturn(species);
                when(pokemonAbilityService.sortearHabilidadeAtiva(species)).thenReturn(ability);
                when(pokemonLearnsetService.escolherMovimentosAoCriarPokemon(species, 1)).thenReturn(List.of());
                when(personalidadeRepository.findAllByOrderByNome()).thenReturn(List.of());
                when(itemRepository.findByNomeEnContainingIgnoreCaseOrderByNomeEn("berry")).thenReturn(List.of(berry));

                Pokemon criado = service.criar("perfil-6", 6, "Support", null, null, 10, null, null, null);

                assertThat(criado.getEspecializacao()).isEqualTo(Especializacao.SUPORTE);
                assertThat(criado.getBerryFavorita()).isEqualTo("lum-berry");
        }

        private static PokemonSpecies novaSpecies(String id, int pokedexId, int hp, int atk, int def, int spAtk, int spDef, int speed) {
                PokemonSpecies species = new PokemonSpecies();
                species.setId(id);
                species.setPokedexId(pokedexId);
                species.setNome("Teste");
                species.setGenderRate(8);
                species.setBaseHp(hp);
                species.setBaseAtaque(atk);
                species.setBaseDefesa(def);
                species.setBaseAtaqueEspecial(spAtk);
                species.setBaseDefesaEspecial(spDef);
                species.setBaseSpeed(speed);
                return species;
        }

        private static class TestPokemonService extends PokemonService {
                private final boolean suporteAleatorio;
                private final int indiceFixo;

                TestPokemonService(PokemonRepository pokemonRepository,
                                                   PerfilJogadorRepository perfilRepository,
                                                   ItemRepository itemRepository,
                                                   MovimentoRepository movimentoRepository,
                                                   HabilidadeRepository habilidadeRepository,
                                                   PersonalidadeRepository personalidadeRepository,
                                                   PokeApiService pokeApiService,
                                                   PokemonAbilityService pokemonAbilityService,
                                                   PokemonLearnsetService pokemonLearnsetService,
                                                   PokemonGenerationService pokemonGenerationService,
                                                   PokemonStatService pokemonStatService,
                                                   PokemonEvolutionService pokemonEvolutionService,
                                                   PokemonSpeciesRepository pokemonSpeciesRepository,
                                                   int shinyChancePercent,
                                                   boolean strictLocalRuntime,
                                                   boolean suporteAleatorio,
                                                   int indiceFixo) {
                        super(
                                        pokemonRepository,
                                        perfilRepository,
                                        itemRepository,
                                        movimentoRepository,
                                        habilidadeRepository,
                                        personalidadeRepository,
                                        pokeApiService,
                                        pokemonAbilityService,
                                        pokemonLearnsetService,
                                        pokemonGenerationService,
                                        pokemonStatService,
                                        pokemonEvolutionService,
                                        pokemonSpeciesRepository,
                                        shinyChancePercent,
                                        strictLocalRuntime
                        );
                        this.suporteAleatorio = suporteAleatorio;
                        this.indiceFixo = indiceFixo;
                }

                @Override
                protected int randomIndex(int bound) {
                        return Math.max(0, Math.min(bound - 1, indiceFixo));
                }

                @Override
                protected boolean sortearSuporteAleatorio() {
                        return suporteAleatorio;
                }
        }
}
