package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.domain.PerfilJogador;
import com.pokemonamethyst.domain.Pokemon;
import com.pokemonamethyst.security.UsuarioPrincipal;
import com.pokemonamethyst.service.PerfilJogadorService;
import com.pokemonamethyst.service.PokemonLearnsetService;
import com.pokemonamethyst.service.PokemonService;
import com.pokemonamethyst.web.dto.MovimentoResponseDto;
import com.pokemonamethyst.web.dto.PokemonAtualizarRequestDto;
import com.pokemonamethyst.web.dto.PokemonGanharXpRequestDto;
import com.pokemonamethyst.web.dto.PokemonGanharXpResponseDto;
import com.pokemonamethyst.web.dto.PokemonRequestDto;
import com.pokemonamethyst.web.dto.PokemonAtualizarComAprendizagemResponseDto;
import com.pokemonamethyst.web.dto.PokemonMovimentoAprendidoRequestDto;
import com.pokemonamethyst.web.dto.PokemonResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/perfis/meu/pokemons")
public class PokemonController {

    private final PerfilJogadorService perfilService;
    private final PokemonService pokemonService;
    private final PokemonLearnsetService pokemonLearnsetService;

    public PokemonController(PerfilJogadorService perfilService, PokemonService pokemonService, PokemonLearnsetService pokemonLearnsetService) {
        this.perfilService = perfilService;
        this.pokemonService = pokemonService;
        this.pokemonLearnsetService = pokemonLearnsetService;
    }

    private String perfilId(UsuarioPrincipal principal) {
        return perfilService.buscarMeuPerfil(principal.getId()).getId();
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<PokemonResponseDto>> listar(@AuthenticationPrincipal UsuarioPrincipal principal) {
        String perfilId = perfilId(principal);
        List<Pokemon> lista = pokemonService.listarPorPerfil(perfilId);
        return ResponseEntity.ok(lista.stream().map(PokemonResponseDto::from).toList());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<PokemonResponseDto> criar(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @Valid @RequestBody PokemonRequestDto dto) {
        String perfilId = perfilId(principal);
        Pokemon pokemon = pokemonService.criar(
                perfilId,
                dto.getPokedexId(),
                dto.getApelido(),
                dto.getGenero(),
                dto.getPokebolaCaptura(),
                dto.getStaminaMaximaOrDefault(),
                dto.getMovimentoIds(),
                dto.getPersonalidadeId()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(PokemonResponseDto.from(pokemon));
    }

    @PostMapping("/{id}/xp/ganhar")
    @Transactional
    public ResponseEntity<PokemonGanharXpResponseDto> ganharXp(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody PokemonGanharXpRequestDto dto) {
        String perfilId = perfilId(principal);
        PokemonGanharXpResponseDto response = pokemonService.ganharXp(id, perfilId, dto.getXpGanho());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/movimentos-aprendendo/aceitar")
    @Transactional
    public ResponseEntity<PokemonResponseDto> aceitarMovimentoAprendido(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody PokemonMovimentoAprendidoRequestDto dto) {
        String perfilId = perfilId(principal);
        Pokemon pokemon = pokemonService.aceitarMovimentoAprendido(id, perfilId, dto.getMovimentoId(), dto.getSubstituirMovimentoId());
        return ResponseEntity.ok(PokemonResponseDto.from(pokemon));
    }

    @PostMapping("/{id}/movimentos-aprendendo/recusar")
    @Transactional
    public ResponseEntity<PokemonResponseDto> recusarMovimentoAprendido(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @Valid @RequestBody PokemonMovimentoAprendidoRequestDto dto) {
        String perfilId = perfilId(principal);
        Pokemon pokemon = pokemonService.recusarMovimentoAprendido(id, perfilId, dto.getMovimentoId());
        return ResponseEntity.ok(PokemonResponseDto.from(pokemon));
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<PokemonResponseDto> buscar(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id) {
        String perfilId = perfilId(principal);
        Pokemon pokemon = pokemonService.buscarPorIdEPerfil(id, perfilId);
        return ResponseEntity.ok(PokemonResponseDto.from(pokemon));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<PokemonAtualizarComAprendizagemResponseDto> atualizar(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestBody PokemonAtualizarRequestDto dto) {
        String perfilId = perfilId(principal);
        PokemonAtualizarComAprendizagemResponseDto resultado = pokemonService.atualizar(
                id, perfilId,
                dto.getPokedexId(),
                dto.getApelido(), dto.getNotas(),
                dto.getGenero(), dto.getShiny(), dto.getPersonalidadeId(),
                dto.getEspecializacao(), dto.getBerryFavorita(), dto.getNivelDeVinculo(),
                dto.getNivel(), dto.getXpAtual(), dto.getPokebolaCaptura(), dto.getItemSeguradoId(),
                dto.getTecnica(), dto.getRespeito(), dto.getStatusAtuais(),
                dto.getMovimentoIds(), dto.getHabilidadeId()
        );
        return ResponseEntity.ok(resultado);
    }

    @GetMapping("/{id}/movimentos-disponiveis")
    @Transactional(readOnly = true)
    public ResponseEntity<List<MovimentoResponseDto>> listarMovimentosDisponiveis(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id) {
        String perfilId = perfilId(principal);
        Pokemon pokemon = pokemonService.buscarPorIdEPerfil(id, perfilId);
        List<MovimentoResponseDto> movimentos = pokemonLearnsetService
                .listarMovimentosDisponiveis(pokemon.getSpecies(), pokemon.getNivel(), null)
                .stream()
                .map(MovimentoResponseDto::from)
                .toList();
        return ResponseEntity.ok(movimentos);
    }

    @PutMapping("/{id}/time")
    @Transactional
    public ResponseEntity<PokemonResponseDto> colocarNoTime(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestBody Map<String, Integer> body) {
        String perfilId = perfilId(principal);
        Integer ordem = body != null ? body.get("ordem") : null;
        if (ordem == null) ordem = 1;
        Pokemon pokemon = pokemonService.colocarNoTime(id, perfilId, ordem);
        return ResponseEntity.ok(PokemonResponseDto.from(pokemon));
    }

    @DeleteMapping("/{id}/time")
    @Transactional
    public ResponseEntity<PokemonResponseDto> removerDoTime(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id) {
        String perfilId = perfilId(principal);
        Pokemon pokemon = pokemonService.removerDoTime(id, perfilId);
        return ResponseEntity.ok(PokemonResponseDto.from(pokemon));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id) {
        String perfilId = perfilId(principal);
        pokemonService.excluir(id, perfilId);
        return ResponseEntity.noContent().build();
    }
}
