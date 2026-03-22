package com.pokemonamethyst.service;

import com.pokemonamethyst.domain.Habilidade;
import com.pokemonamethyst.domain.MoveLearnMethod;
import com.pokemonamethyst.domain.Movimento;
import com.pokemonamethyst.domain.PokemonSpecies;
import com.pokemonamethyst.domain.PokemonSpeciesHabilidade;
import com.pokemonamethyst.domain.PokemonSpeciesMovimento;
import com.pokemonamethyst.exception.RecursoNaoEncontradoException;
import com.pokemonamethyst.exception.RegraNegocioException;
import com.pokemonamethyst.repository.HabilidadeRepository;
import com.pokemonamethyst.repository.MovimentoRepository;
import com.pokemonamethyst.repository.PokemonSpeciesHabilidadeRepository;
import com.pokemonamethyst.repository.PokemonSpeciesMovimentoRepository;
import com.pokemonamethyst.repository.PokemonSpeciesRepository;
import com.pokemonamethyst.web.dto.PokemonSpeciesConfigResponseDto;
import com.pokemonamethyst.web.dto.PokemonSpeciesConfigUpdateRequestDto;
import com.pokemonamethyst.web.dto.PokemonSpeciesResumoDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class PokemonSpeciesConfigService {

    private static final int LISTAGEM_MAX = 200;

    private final PokemonSpeciesRepository speciesRepository;
    private final HabilidadeRepository habilidadeRepository;
    private final MovimentoRepository movimentoRepository;
    private final PokemonSpeciesHabilidadeRepository speciesHabilidadeRepository;
    private final PokemonSpeciesMovimentoRepository speciesMovimentoRepository;
    private final PokemonAbilityService pokemonAbilityService;
    private final PokemonLearnsetService pokemonLearnsetService;

    public PokemonSpeciesConfigService(
            PokemonSpeciesRepository speciesRepository,
            HabilidadeRepository habilidadeRepository,
            MovimentoRepository movimentoRepository,
            PokemonSpeciesHabilidadeRepository speciesHabilidadeRepository,
            PokemonSpeciesMovimentoRepository speciesMovimentoRepository,
            PokemonAbilityService pokemonAbilityService,
            PokemonLearnsetService pokemonLearnsetService
    ) {
        this.speciesRepository = speciesRepository;
        this.habilidadeRepository = habilidadeRepository;
        this.movimentoRepository = movimentoRepository;
        this.speciesHabilidadeRepository = speciesHabilidadeRepository;
        this.speciesMovimentoRepository = speciesMovimentoRepository;
        this.pokemonAbilityService = pokemonAbilityService;
        this.pokemonLearnsetService = pokemonLearnsetService;
    }

    @Transactional(readOnly = true)
    public List<PokemonSpeciesResumoDto> listarSpecies(String nome, Integer pokedexId, Integer limit) {
        int limite = Math.max(1, Math.min(limit == null ? 50 : limit, LISTAGEM_MAX));
        if (pokedexId != null && pokedexId > 0) {
            return speciesRepository.findByPokedexId(pokedexId)
                    .stream()
                    .map(PokemonSpeciesResumoDto::from)
                    .toList();
        }
        String filtro = nome == null ? "" : nome.trim();
        List<PokemonSpecies> found = filtro.isBlank()
                ? speciesRepository.findTop200ByOrderByPokedexIdAsc()
                : speciesRepository.findTop200ByNomeContainingIgnoreCaseOrderByPokedexIdAsc(filtro);
        return found.stream().limit(limite).map(PokemonSpeciesResumoDto::from).toList();
    }

    @Transactional(readOnly = true)
    public PokemonSpeciesConfigResponseDto buscarConfig(String speciesId) {
        PokemonSpecies species = speciesRepository.findById(speciesId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Espécie não encontrada."));
        List<PokemonSpeciesHabilidade> habilidades = speciesHabilidadeRepository.findBySpeciesIdComHabilidade(speciesId);
        List<PokemonSpeciesMovimento> learnset = speciesMovimentoRepository.findBySpeciesIdComMovimento(speciesId);
        return toConfigDto(species, habilidades, learnset);
    }

    @Transactional(readOnly = true)
    public PokemonSpecies buscarSpeciesPorId(String speciesId) {
        return speciesRepository.findById(speciesId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Espécie não encontrada."));
    }

    /**
     * Reordena o learnset da espécie (campo {@code ordem}) segundo a ordem canônica de aprendizado.
     */
    @Transactional
    public PokemonSpeciesConfigResponseDto normalizarOrdemLearnset(String speciesId) {
        buscarSpeciesPorId(speciesId);
        pokemonLearnsetService.renormalizarOrdemPorSpecies(speciesId);
        return buscarConfig(speciesId);
    }

    @Transactional
    public PokemonSpeciesConfigResponseDto atualizarConfig(
            String speciesId,
            PokemonSpeciesConfigUpdateRequestDto dto
    ) {
        PokemonSpecies species = speciesRepository.findById(speciesId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Espécie não encontrada."));
        if (dto == null) {
            throw new RegraNegocioException("Body da configuração é obrigatório.");
        }

        speciesHabilidadeRepository.deleteBySpeciesId(speciesId);
        speciesMovimentoRepository.deleteBySpeciesId(speciesId);

        List<PokemonSpeciesConfigUpdateRequestDto.HabilidadeVinculoRequestDto> habilidades =
                dto.getHabilidades() == null ? List.of() : dto.getHabilidades();
        for (int i = 0; i < habilidades.size(); i++) {
            PokemonSpeciesConfigUpdateRequestDto.HabilidadeVinculoRequestDto item = habilidades.get(i);
            if (item == null || item.getHabilidadeId() == null || item.getHabilidadeId().isBlank()) {
                continue;
            }
            Habilidade habilidade = habilidadeRepository.findById(item.getHabilidadeId())
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Habilidade não encontrada: " + item.getHabilidadeId()));
            int slot = item.getSlot() == null ? 1 : item.getSlot();
            if (slot <= 0) {
                throw new RegraNegocioException("Slot de habilidade deve ser >= 1.");
            }
            PokemonSpeciesHabilidade rel = new PokemonSpeciesHabilidade();
            rel.setSpecies(species);
            rel.setHabilidade(habilidade);
            rel.setSlot(slot);
            rel.setHidden(Boolean.TRUE.equals(item.getHidden()));
            speciesHabilidadeRepository.save(rel);
        }

        List<PokemonSpeciesConfigUpdateRequestDto.LearnsetVinculoRequestDto> learnset =
                dto.getLearnset() == null ? List.of() : dto.getLearnset();
        for (int i = 0; i < learnset.size(); i++) {
            PokemonSpeciesConfigUpdateRequestDto.LearnsetVinculoRequestDto item = learnset.get(i);
            if (item == null || item.getMovimentoId() == null || item.getMovimentoId().isBlank()) {
                continue;
            }
            Movimento movimento = movimentoRepository.findById(item.getMovimentoId())
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Movimento não encontrado: " + item.getMovimentoId()));
            MoveLearnMethod method = item.getLearnMethod() == null ? MoveLearnMethod.LEVEL_UP : item.getLearnMethod();
            Integer level = item.getLevel();
            if (method == MoveLearnMethod.LEVEL_UP) {
                if (level == null || level <= 0) {
                    throw new RegraNegocioException("Learnset LEVEL_UP exige level > 0.");
                }
            } else {
                level = null;
            }

            PokemonSpeciesMovimento rel = new PokemonSpeciesMovimento();
            rel.setSpecies(species);
            rel.setMovimento(movimento);
            rel.setLearnMethod(method);
            rel.setLevel(level);
            rel.setOrdem(item.getOrdem() != null ? item.getOrdem() : i);
            speciesMovimentoRepository.save(rel);
        }

        pokemonAbilityService.invalidarCacheSpecies(speciesId);
        pokemonLearnsetService.invalidarCacheSpecies(speciesId);

        PokemonSpecies atualizado = speciesRepository.findById(speciesId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Espécie não encontrada."));
        List<PokemonSpeciesHabilidade> habilidadesDepois = speciesHabilidadeRepository.findBySpeciesIdComHabilidade(speciesId);
        List<PokemonSpeciesMovimento> learnsetDepois = speciesMovimentoRepository.findBySpeciesIdComMovimento(speciesId);
        return toConfigDto(atualizado, habilidadesDepois, learnsetDepois);
    }

    private PokemonSpeciesConfigResponseDto toConfigDto(
            PokemonSpecies species,
            List<PokemonSpeciesHabilidade> habilidades,
            List<PokemonSpeciesMovimento> learnset
    ) {
        PokemonSpeciesConfigResponseDto dto = new PokemonSpeciesConfigResponseDto();
        dto.setSpeciesId(species.getId());
        dto.setPokedexId(species.getPokedexId());
        dto.setNome(species.getNome());
        dto.setImagemUrl(species.getImagemUrl());
        List<PokemonSpeciesHabilidade> habList = habilidades == null ? List.of() : habilidades;
        List<PokemonSpeciesMovimento> movList = learnset == null ? List.of() : learnset;
        dto.setHabilidades(
                habList.stream()
                        .sorted(Comparator.comparingInt(PokemonSpeciesHabilidade::getSlot))
                        .map(link -> {
                            PokemonSpeciesConfigResponseDto.HabilidadeVinculoDto item = new PokemonSpeciesConfigResponseDto.HabilidadeVinculoDto();
                            if (link.getHabilidade() != null) {
                                item.setHabilidadeId(link.getHabilidade().getId());
                                item.setHabilidadeNome(link.getHabilidade().getNome());
                                item.setHabilidadeNomeEn(link.getHabilidade().getNomeEn());
                            }
                            item.setSlot(link.getSlot());
                            item.setHidden(link.isHidden());
                            return item;
                        })
                        .toList()
        );
        dto.setLearnset(
                movList.stream()
                        .sorted(PokemonLearnsetService.COMPARATOR_LEARNSET)
                        .map(link -> {
                            PokemonSpeciesConfigResponseDto.LearnsetVinculoDto item = new PokemonSpeciesConfigResponseDto.LearnsetVinculoDto();
                            if (link.getMovimento() != null) {
                                item.setMovimentoId(link.getMovimento().getId());
                                item.setMovimentoNome(link.getMovimento().getNome());
                                item.setMovimentoNomeEn(link.getMovimento().getNomeEn());
                            }
                            item.setLearnMethod(link.getLearnMethod() != null ? link.getLearnMethod().name() : MoveLearnMethod.OTHER.name());
                            item.setLevel(link.getLevel());
                            item.setOrdem(link.getOrdem());
                            return item;
                        })
                        .toList()
        );
        return dto;
    }
}
