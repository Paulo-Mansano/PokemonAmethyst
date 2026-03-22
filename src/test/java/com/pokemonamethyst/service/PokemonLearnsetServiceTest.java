package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.MoveLearnMethod;
import com.pokemonamethyst.domain.Movimento;
import com.pokemonamethyst.domain.PokemonSpecies;
import com.pokemonamethyst.domain.PokemonSpeciesMovimento;
import com.pokemonamethyst.repository.PokemonSpeciesMovimentoRepository;
import org.junit.jupiter.api.Test;

import java.util.EnumSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PokemonLearnsetServiceTest {

    @Test
    void deveFiltrarPorNivelEMetodo() {
        PokemonSpeciesMovimentoRepository repository = mock(PokemonSpeciesMovimentoRepository.class);
        PokemonLearnsetService service = new PokemonLearnsetService(repository);

        PokemonSpecies species = new PokemonSpecies();
        species.setId("species-1");

        Movimento tackle = new Movimento();
        tackle.setId("m1");
        tackle.setNome("Tackle");

        Movimento solarBeam = new Movimento();
        solarBeam.setId("m2");
        solarBeam.setNome("Solar Beam");

        PokemonSpeciesMovimento moveLevel1 = new PokemonSpeciesMovimento();
        moveLevel1.setSpecies(species);
        moveLevel1.setMovimento(tackle);
        moveLevel1.setLearnMethod(MoveLearnMethod.LEVEL_UP);
        moveLevel1.setLevel(1);

        PokemonSpeciesMovimento moveLevel20 = new PokemonSpeciesMovimento();
        moveLevel20.setSpecies(species);
        moveLevel20.setMovimento(solarBeam);
        moveLevel20.setLearnMethod(MoveLearnMethod.LEVEL_UP);
        moveLevel20.setLevel(20);

        PokemonSpeciesMovimento machineMove = new PokemonSpeciesMovimento();
        machineMove.setSpecies(species);
        machineMove.setMovimento(solarBeam);
        machineMove.setLearnMethod(MoveLearnMethod.MACHINE);
        machineMove.setLevel(null);

        when(repository.findBySpeciesIdComMovimento("species-1")).thenReturn(List.of(moveLevel1, moveLevel20, machineMove));

        List<Movimento> disponiveis = service.listarMovimentosDisponiveis(
                species,
                10,
                EnumSet.of(MoveLearnMethod.LEVEL_UP)
        );

        assertThat(disponiveis).extracting(Movimento::getId).containsExactly("m1");
    }

    @Test
    void movimentosIniciaisDeprecatedRespeitaLimiteSobreEscolhaCompleta() {
        PokemonSpeciesMovimentoRepository repository = mock(PokemonSpeciesMovimentoRepository.class);
        PokemonLearnsetService service = new PokemonLearnsetService(repository);

        PokemonSpecies species = new PokemonSpecies();
        species.setId("species-2");

        Movimento a = new Movimento();
        a.setId("a");
        Movimento b = new Movimento();
        b.setId("b");
        Movimento c = new Movimento();
        c.setId("c");
        Movimento d = new Movimento();
        d.setId("d");

        PokemonSpeciesMovimento e1 = entry(species, a, 1, 0);
        PokemonSpeciesMovimento e2 = entry(species, b, 1, 1);
        PokemonSpeciesMovimento e3 = entry(species, c, 1, 2);
        PokemonSpeciesMovimento e4 = entry(species, d, 1, 3);

        when(repository.findBySpeciesIdComMovimento("species-2")).thenReturn(List.of(e1, e2, e3, e4));

        List<Movimento> iniciais = service.listarMovimentosIniciais(species, 1, 3);

        assertThat(iniciais).extracting(Movimento::getId).containsExactly("a", "b", "c");
    }

    @Test
    void escolherMovimentosAoCriarNivel1PegaTodosAtaquesDeNivel1NaOrdem() {
        PokemonSpeciesMovimentoRepository repository = mock(PokemonSpeciesMovimentoRepository.class);
        PokemonLearnsetService service = new PokemonLearnsetService(repository);

        PokemonSpecies species = new PokemonSpecies();
        species.setId("species-lv1");

        Movimento a = new Movimento();
        a.setId("a");
        Movimento b = new Movimento();
        b.setId("b");
        Movimento x = new Movimento();
        x.setId("x");

        PokemonSpeciesMovimento e1 = entry(species, a, 1, 2);
        PokemonSpeciesMovimento e2 = entry(species, b, 1, 0);
        PokemonSpeciesMovimento e3 = entry(species, x, 5, 1);

        when(repository.findBySpeciesIdComMovimento("species-lv1")).thenReturn(List.of(e1, e2, e3));

        List<Movimento> moves = service.escolherMovimentosAoCriarPokemon(species, 1);

        assertThat(moves).extracting(Movimento::getId).containsExactly("b", "a");
    }

    private static PokemonSpeciesMovimento entry(PokemonSpecies species, Movimento m, int level, int ordem) {
        PokemonSpeciesMovimento e = new PokemonSpeciesMovimento();
        e.setSpecies(species);
        e.setMovimento(m);
        e.setLearnMethod(MoveLearnMethod.LEVEL_UP);
        e.setLevel(level);
        e.setOrdem(ordem);
        return e;
    }
}
