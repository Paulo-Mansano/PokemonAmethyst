package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.Habilidade;
import com.pokemonamethyst.domain.PokemonSpecies;
import com.pokemonamethyst.domain.PokemonSpeciesHabilidade;
import com.pokemonamethyst.repository.PokemonSpeciesHabilidadeRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PokemonAbilityServiceTest {

    @Test
    void devePriorizarHiddenQuandoChanceFor100() {
        PokemonSpeciesHabilidadeRepository repository = mock(PokemonSpeciesHabilidadeRepository.class);
        PokemonAbilityService service = new PokemonAbilityService(repository, 100);

        PokemonSpecies species = new PokemonSpecies();
        species.setId("species-1");

        Habilidade normal = new Habilidade();
        normal.setId("h1");
        normal.setNome("Overgrow");

        Habilidade hidden = new Habilidade();
        hidden.setId("h2");
        hidden.setNome("Chlorophyll");

        PokemonSpeciesHabilidade normalEntry = new PokemonSpeciesHabilidade();
        normalEntry.setSpecies(species);
        normalEntry.setHabilidade(normal);
        normalEntry.setSlot(1);
        normalEntry.setHidden(false);

        PokemonSpeciesHabilidade hiddenEntry = new PokemonSpeciesHabilidade();
        hiddenEntry.setSpecies(species);
        hiddenEntry.setHabilidade(hidden);
        hiddenEntry.setSlot(3);
        hiddenEntry.setHidden(true);

        when(repository.findBySpeciesIdComHabilidade("species-1")).thenReturn(List.of(normalEntry, hiddenEntry));

        Habilidade escolhida = service.sortearHabilidadeAtiva(species);

        assertThat(escolhida.getId()).isEqualTo("h2");
    }

    @Test
    void deveFazerFallbackParaNormalQuandoNaoHaHidden() {
        PokemonSpeciesHabilidadeRepository repository = mock(PokemonSpeciesHabilidadeRepository.class);
        PokemonAbilityService service = new PokemonAbilityService(repository, 100);

        PokemonSpecies species = new PokemonSpecies();
        species.setId("species-1");

        Habilidade normal = new Habilidade();
        normal.setId("h1");
        normal.setNome("Overgrow");

        PokemonSpeciesHabilidade normalEntry = new PokemonSpeciesHabilidade();
        normalEntry.setSpecies(species);
        normalEntry.setHabilidade(normal);
        normalEntry.setSlot(1);
        normalEntry.setHidden(false);

        when(repository.findBySpeciesIdComHabilidade("species-1")).thenReturn(List.of(normalEntry));

        Habilidade escolhida = service.sortearHabilidadeAtiva(species);

        assertThat(escolhida.getId()).isEqualTo("h1");
    }
}
