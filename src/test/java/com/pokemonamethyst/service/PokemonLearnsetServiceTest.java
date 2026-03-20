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

        when(repository.findBySpeciesId("species-1")).thenReturn(List.of(moveLevel1, moveLevel20, machineMove));

        List<Movimento> disponiveis = service.listarMovimentosDisponiveis(
                species,
                10,
                EnumSet.of(MoveLearnMethod.LEVEL_UP)
        );

        assertThat(disponiveis).extracting(Movimento::getId).containsExactly("m1");
    }
}
