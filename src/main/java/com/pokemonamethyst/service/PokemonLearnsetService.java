package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.MoveLearnMethod;
import com.pokemonamethyst.domain.Movimento;
import com.pokemonamethyst.domain.PokemonSpecies;
import com.pokemonamethyst.domain.PokemonSpeciesMovimento;
import com.pokemonamethyst.exception.RegraNegocioException;
import com.pokemonamethyst.repository.PokemonSpeciesMovimentoRepository;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class PokemonLearnsetService {

    private final PokemonSpeciesMovimentoRepository speciesMovimentoRepository;

    public PokemonLearnsetService(PokemonSpeciesMovimentoRepository speciesMovimentoRepository) {
        this.speciesMovimentoRepository = speciesMovimentoRepository;
    }

    public List<PokemonSpeciesMovimento> listarLearnset(String speciesId) {
        return speciesMovimentoRepository.findBySpeciesId(speciesId);
    }

    public List<Movimento> listarMovimentosDisponiveis(PokemonSpecies species, int nivel, Set<MoveLearnMethod> metodosPermitidos) {
        if (species == null || species.getId() == null) {
            throw new RegraNegocioException("Espécie inválida para consulta de learnset.");
        }
        int nivelSeguro = Math.max(1, nivel);
        Set<MoveLearnMethod> metodos = (metodosPermitidos == null || metodosPermitidos.isEmpty())
                ? EnumSet.of(MoveLearnMethod.LEVEL_UP)
                : EnumSet.copyOf(metodosPermitidos);

        List<PokemonSpeciesMovimento> entries = listarLearnset(species.getId()).stream()
                .filter(entry -> metodos.contains(entry.getLearnMethod()))
                .filter(entry -> entry.getLevel() == null || entry.getLevel() <= nivelSeguro)
                .toList();

        Map<String, Movimento> porMovimento = new LinkedHashMap<>();
        entries.stream()
                .sorted(Comparator
                        .comparing((PokemonSpeciesMovimento e) -> e.getLevel() == null ? Integer.MIN_VALUE : e.getLevel())
                        .thenComparing(PokemonSpeciesMovimento::getId))
                .map(PokemonSpeciesMovimento::getMovimento)
                .filter(Objects::nonNull)
                .forEach(movimento -> porMovimento.putIfAbsent(movimento.getId(), movimento));

        return List.copyOf(porMovimento.values());
    }

    public List<Movimento> listarMovimentosIniciais(PokemonSpecies species, int nivelInicial, int limite) {
        List<Movimento> disponiveis = listarMovimentosDisponiveis(species, nivelInicial, EnumSet.of(MoveLearnMethod.LEVEL_UP));
        if (disponiveis.size() <= limite) {
            return disponiveis;
        }
        return disponiveis.subList(disponiveis.size() - limite, disponiveis.size());
    }

    public void validarMovimentosPermitidos(PokemonSpecies species, int nivel, Collection<String> movimentoIds) {
        if (movimentoIds == null || movimentoIds.isEmpty()) {
            return;
        }
        Set<String> permitidos = listarMovimentosDisponiveis(
                species,
                nivel,
                EnumSet.of(MoveLearnMethod.LEVEL_UP, MoveLearnMethod.MACHINE, MoveLearnMethod.TUTOR, MoveLearnMethod.EGG)
        ).stream().map(Movimento::getId).collect(java.util.stream.Collectors.toSet());
        for (String movimentoId : movimentoIds) {
            if (!permitidos.contains(movimentoId)) {
                throw new RegraNegocioException("Movimento não disponível para a espécie/nível atual: " + movimentoId);
            }
        }
    }

    /** Reservado para futura invalidação de cache; evite cachear entidades JPA diretamente. */
    public void invalidarCacheSpecies(String speciesId) {
        // no-op
    }
}
