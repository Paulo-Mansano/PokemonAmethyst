package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.MoveLearnMethod;
import com.pokemonamethyst.domain.Movimento;
import com.pokemonamethyst.domain.PokemonSpecies;
import com.pokemonamethyst.domain.PokemonSpeciesMovimento;
import com.pokemonamethyst.exception.RegraNegocioException;
import com.pokemonamethyst.repository.PokemonSpeciesMovimentoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class PokemonLearnsetService {

    /** Máximo de golpes conhecidos por Pokémon (deve alinhar com {@code PokemonService}). */
    public static final int MAX_MOVIMENTOS_POR_POKEMON = 6;

    /**
     * Ordem canônica do learnset: método (LEVEL_UP primeiro), nível crescente, ordem da PokéAPI, id.
     * Usada na importação, na UI de mestre e na escolha de movimentos ao criar Pokémon.
     */
    public static final Comparator<PokemonSpeciesMovimento> COMPARATOR_LEARNSET = Comparator
            .comparing((PokemonSpeciesMovimento e) -> e.getLearnMethod() == MoveLearnMethod.LEVEL_UP ? 0 : 1)
            .thenComparing(PokemonSpeciesMovimento::getLearnMethod, Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing((PokemonSpeciesMovimento e) -> e.getLevel() == null ? Integer.MAX_VALUE : e.getLevel())
            .thenComparing((PokemonSpeciesMovimento e) -> e.getOrdem() == null ? Integer.MAX_VALUE : e.getOrdem())
            .thenComparing(PokemonSpeciesMovimento::getId, Comparator.nullsLast(Long::compareTo));

    private final PokemonSpeciesMovimentoRepository speciesMovimentoRepository;

    public PokemonLearnsetService(PokemonSpeciesMovimentoRepository speciesMovimentoRepository) {
        this.speciesMovimentoRepository = speciesMovimentoRepository;
    }

    public List<PokemonSpeciesMovimento> listarLearnset(String speciesId) {
        return speciesMovimentoRepository.findBySpeciesIdComMovimento(speciesId);
    }

    /**
     * Learnset ordenado de forma consistente (nível, ordem, método).
     */
    public List<PokemonSpeciesMovimento> listarLearnsetOrdenado(String speciesId) {
        return listarLearnset(speciesId).stream()
                .sorted(COMPARATOR_LEARNSET)
                .toList();
    }

    /**
     * Reatribui {@code ordem} 0..n-1 segundo {@link #COMPARATOR_LEARNSET} e persiste.
     * Útil após edições manuais ou dados antigos fora de ordem.
     */
    @Transactional
    public void renormalizarOrdemPorSpecies(String speciesId) {
        List<PokemonSpeciesMovimento> rows = speciesMovimentoRepository.findBySpeciesId(speciesId);
        rows.sort(COMPARATOR_LEARNSET);
        for (int i = 0; i < rows.size(); i++) {
            rows.get(i).setOrdem(i);
        }
        speciesMovimentoRepository.saveAll(rows);
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
                .sorted(COMPARATOR_LEARNSET)
                .toList();

        Map<String, Movimento> porMovimento = new LinkedHashMap<>();
        for (PokemonSpeciesMovimento e : entries) {
            Movimento mov = e.getMovimento();
            if (mov == null || mov.getId() == null) {
                continue;
            }
            porMovimento.putIfAbsent(mov.getId(), mov);
        }

        return List.copyOf(porMovimento.values());
    }

    /**
     * Movimentos ao criar um Pokémon (sem lista explícita).
     * <ul>
     *   <li>Nível 1: todos os LEVEL_UP de nível 1, na ordem do learnset, até {@link #MAX_MOVIMENTOS_POR_POKEMON}.</li>
     *   <li>Nível &gt; 1: todos os LEVEL_UP com nível &le; nível atual (movimentos distintos, ordem canônica);
     *       se houver mais que o limite, escolhe aleatoriamente entre eles.</li>
     * </ul>
     */
    public List<Movimento> escolherMovimentosAoCriarPokemon(PokemonSpecies species, int nivel) {
        if (species == null || species.getId() == null) {
            throw new RegraNegocioException("Espécie inválida para escolha de movimentos iniciais.");
        }
        int nivelSeguro = Math.max(1, Math.min(100, nivel));

        List<PokemonSpeciesMovimento> levelUp = listarLearnsetOrdenado(species.getId()).stream()
                .filter(e -> e.getLearnMethod() == MoveLearnMethod.LEVEL_UP)
                .filter(e -> e.getLevel() != null)
                .toList();

        if (nivelSeguro == 1) {
            if (levelUp.isEmpty()) {
                return List.of();
            }
            // Bloco inicial do learnset (em geral nível 1). Se não houver nível 1 na base, usa o menor nível LEVEL_UP.
            int nivelInicial = levelUp.get(0).getLevel();
            List<Movimento> nivel1 = new ArrayList<>();
            for (PokemonSpeciesMovimento e : levelUp) {
                if (!Integer.valueOf(nivelInicial).equals(e.getLevel())) {
                    break;
                }
                Movimento m = e.getMovimento();
                if (m == null || m.getId() == null) {
                    continue;
                }
                boolean novo = nivel1.stream().noneMatch(x -> x.getId().equals(m.getId()));
                if (novo) {
                    nivel1.add(m);
                    if (nivel1.size() >= MAX_MOVIMENTOS_POR_POKEMON) {
                        break;
                    }
                }
            }
            return nivel1;
        }

        List<Movimento> pool = new ArrayList<>();
        for (PokemonSpeciesMovimento e : levelUp) {
            if (e.getLevel() > nivelSeguro) {
                continue;
            }
            Movimento m = e.getMovimento();
            if (m == null || m.getId() == null) {
                continue;
            }
            boolean ja = pool.stream().anyMatch(x -> x.getId().equals(m.getId()));
            if (!ja) {
                pool.add(m);
            }
        }

        if (pool.size() <= MAX_MOVIMENTOS_POR_POKEMON) {
            return pool;
        }
        List<Movimento> embaralhado = new ArrayList<>(pool);
        Collections.shuffle(embaralhado, ThreadLocalRandom.current());
        return new ArrayList<>(embaralhado.subList(0, MAX_MOVIMENTOS_POR_POKEMON));
    }

    /**
     * @deprecated Usar {@link #escolherMovimentosAoCriarPokemon(PokemonSpecies, int)}.
     */
    @Deprecated
    public List<Movimento> listarMovimentosIniciais(PokemonSpecies species, int nivelInicial, int limite) {
        List<Movimento> todos = escolherMovimentosAoCriarPokemon(species, nivelInicial);
        int n = Math.min(Math.max(0, limite), todos.size());
        return List.copyOf(todos.subList(0, n));
    }

    public void validarMovimentosPermitidos(PokemonSpecies species, int nivel, Collection<String> movimentoIds) {
        validarMovimentosPermitidos(
                species,
                nivel,
                movimentoIds,
                EnumSet.of(MoveLearnMethod.LEVEL_UP, MoveLearnMethod.MACHINE, MoveLearnMethod.TUTOR, MoveLearnMethod.EGG)
        );
    }

    public void validarMovimentosPermitidos(
            PokemonSpecies species,
            int nivel,
            Collection<String> movimentoIds,
            Set<MoveLearnMethod> metodosPermitidos
    ) {
        if (movimentoIds == null || movimentoIds.isEmpty()) {
            return;
        }
        Set<String> permitidos = listarMovimentosDisponiveis(
                species,
                nivel,
                metodosPermitidos
        ).stream().map(Movimento::getId).collect(Collectors.toSet());
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
