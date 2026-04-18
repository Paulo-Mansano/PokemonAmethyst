package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.domain.Pokemon;
import com.pokemonamethyst.security.UsuarioPrincipal;
import com.pokemonamethyst.service.PerfilJogadorService;
import com.pokemonamethyst.service.PokemonLearnsetService;
import com.pokemonamethyst.service.PokemonService;
import com.pokemonamethyst.web.dto.MovimentoResponseDto;
import com.pokemonamethyst.web.dto.PokemonAtualizarRequestDto;
import com.pokemonamethyst.web.dto.PokemonBatalhaAplicarDanoRequestDto;
import com.pokemonamethyst.web.dto.PokemonBatalhaCalculoRequestDto;
import com.pokemonamethyst.web.dto.PokemonBatalhaCalculoResponseDto;
import com.pokemonamethyst.web.dto.PokemonCapturaRequestDto;
import com.pokemonamethyst.web.dto.PokemonCapturaResponseDto;
import com.pokemonamethyst.web.dto.PokemonEstadoRequestDto;
import com.pokemonamethyst.web.dto.PokemonGeracaoRequestDto;
import com.pokemonamethyst.web.dto.PokemonGanharXpRequestDto;
import com.pokemonamethyst.web.dto.PokemonGanharXpResponseDto;
import com.pokemonamethyst.web.dto.PokemonXpPreviewResponseDto;
import com.pokemonamethyst.web.dto.PokemonRequestDto;
import com.pokemonamethyst.web.dto.PokemonAtualizarComAprendizagemResponseDto;
import com.pokemonamethyst.web.dto.PokemonMovimentoAprendidoRequestDto;
import com.pokemonamethyst.web.dto.PokemonResponseDto;
import com.pokemonamethyst.web.dto.PokemonEvoluirRequestDto;
import com.pokemonamethyst.web.dto.PokemonAlocarAtributoRequestDto;
import com.pokemonamethyst.web.dto.PokemonEvolucaoOpcaoDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.EnumSet;
import com.pokemonamethyst.domain.MoveLearnMethod;

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

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<PokemonResponseDto>> listar(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @RequestParam(value = "playerId", required = false) String playerId) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        List<Pokemon> lista = pokemonService.listarPorPerfil(perfilId);
        return ResponseEntity.ok(lista.stream().map(PokemonResponseDto::from).toList());
    }

    @GetMapping("/selvagens")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PokemonResponseDto>> listarSelvagens(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @RequestParam(value = "playerId", required = false) String playerId) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        List<Pokemon> lista = pokemonService.listarSelvagens(perfilId);
        return ResponseEntity.ok(lista.stream().map(PokemonResponseDto::from).toList());
    }

    @PostMapping
    @Transactional
    public ResponseEntity<PokemonResponseDto> criar(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @RequestParam(value = "playerId", required = false) String playerId,
            @Valid @RequestBody PokemonRequestDto dto) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        Pokemon pokemon = pokemonService.criar(
                perfilId,
                dto.getPokedexId(),
                dto.getApelido(),
                dto.getGenero(),
                dto.getPokebolaCaptura(),
                dto.getStaminaMaximaOrDefault(),
                dto.getMovimentoIds(),
                dto.getPersonalidadeId(),
                dto.getNivel()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(PokemonResponseDto.from(pokemon));
    }

    @PostMapping("/gerar-selvagem")
    @Transactional
    public ResponseEntity<PokemonResponseDto> gerarSelvagem(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @RequestParam(value = "playerId", required = false) String playerId,
            @Valid @RequestBody PokemonGeracaoRequestDto dto) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        Pokemon pokemon = pokemonService.gerarSelvagem(perfilId, dto.getPokedexId(), dto.getIdOuNome(), dto.getNivel());
        return ResponseEntity.status(HttpStatus.CREATED).body(PokemonResponseDto.from(pokemon));
    }

    @PostMapping("/batalha/calcular")
    @Transactional(readOnly = true)
    public ResponseEntity<PokemonBatalhaCalculoResponseDto> calcularDano(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @RequestParam(value = "playerId", required = false) String playerId,
            @Valid @RequestBody PokemonBatalhaCalculoRequestDto dto) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        return ResponseEntity.ok(pokemonService.calcularDano(perfilId, dto));
    }

    @PostMapping("/batalha/aplicar-dano")
    @Transactional
    public ResponseEntity<PokemonResponseDto> aplicarDano(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @RequestParam(value = "playerId", required = false) String playerId,
            @Valid @RequestBody PokemonBatalhaAplicarDanoRequestDto dto) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        Pokemon defensorAtualizado = pokemonService.aplicarDano(perfilId, dto);
        return ResponseEntity.ok(PokemonResponseDto.from(defensorAtualizado));
    }

    @PostMapping("/{id}/captura")
    @Transactional
    public ResponseEntity<PokemonCapturaResponseDto> tentarCaptura(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestParam(value = "playerId", required = false) String playerId,
            @Valid @RequestBody PokemonCapturaRequestDto dto) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        PokemonCapturaResponseDto response = pokemonService.tentarCaptura(perfilId, id, Boolean.TRUE.equals(dto.getSucesso()));
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/estado")
    @Transactional
    public ResponseEntity<PokemonResponseDto> atualizarEstado(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestParam(value = "playerId", required = false) String playerId,
            @Valid @RequestBody PokemonEstadoRequestDto dto) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        Pokemon pokemon = pokemonService.atualizarEstado(perfilId, id, dto.getEstado());
        return ResponseEntity.ok(PokemonResponseDto.from(pokemon));
    }

    @PostMapping("/{id}/xp/ganhar")
    @Transactional
    public ResponseEntity<PokemonGanharXpResponseDto> ganharXp(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestParam(value = "playerId", required = false) String playerId,
            @Valid @RequestBody PokemonGanharXpRequestDto dto) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        PokemonGanharXpResponseDto response = pokemonService.ganharXp(id, perfilId, dto.getXpGanho());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/xp/preview")
    @Transactional(readOnly = true)
    public ResponseEntity<PokemonXpPreviewResponseDto> previewXp(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestParam(value = "playerId", required = false) String playerId,
            @Valid @RequestBody PokemonGanharXpRequestDto dto) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        PokemonXpPreviewResponseDto response = pokemonService.preverGanhoXp(id, perfilId, dto.getXpGanho(), dto.getXpBaseAtual());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/movimentos-aprendendo/aceitar")
    @Transactional
    public ResponseEntity<PokemonResponseDto> aceitarMovimentoAprendido(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestParam(value = "playerId", required = false) String playerId,
            @Valid @RequestBody PokemonMovimentoAprendidoRequestDto dto) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        Pokemon pokemon = pokemonService.aceitarMovimentoAprendido(id, perfilId, dto.getMovimentoId(), dto.getSubstituirMovimentoId());
        return ResponseEntity.ok(PokemonResponseDto.from(pokemon));
    }

    @PostMapping("/{id}/movimentos-aprendendo/recusar")
    @Transactional
    public ResponseEntity<PokemonResponseDto> recusarMovimentoAprendido(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestParam(value = "playerId", required = false) String playerId,
            @Valid @RequestBody PokemonMovimentoAprendidoRequestDto dto) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        Pokemon pokemon = pokemonService.recusarMovimentoAprendido(id, perfilId, dto.getMovimentoId());
        return ResponseEntity.ok(PokemonResponseDto.from(pokemon));
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<PokemonResponseDto> buscar(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestParam(value = "playerId", required = false) String playerId) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        Pokemon pokemon = pokemonService.buscarPorIdEPerfil(id, perfilId);
        return ResponseEntity.ok(PokemonResponseDto.from(pokemon));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<PokemonAtualizarComAprendizagemResponseDto> atualizar(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestParam(value = "playerId", required = false) String playerId,
            @RequestBody PokemonAtualizarRequestDto dto) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        PokemonAtualizarComAprendizagemResponseDto resultado = pokemonService.atualizar(
                id, perfilId,
                dto.getPokedexId(),
                dto.getApelido(), dto.getNotas(),
                dto.getGenero(), dto.getShiny(), dto.getPersonalidadeId(),
                dto.getEspecializacao(), dto.getBerryFavorita(), dto.getNivelDeVinculo(),
                dto.getNivel(), dto.getXpAtual(), dto.getPokebolaCaptura(), dto.getItemSeguradoId(),
                dto.getSpriteCustomizadoUrl(),
                dto.getTecnica(), dto.getRespeito(), dto.getPontosDistribuicaoBonus(), dto.getStatusAtuais(),
                dto.getMovimentoIds(), dto.getHabilidadeId(), principal.isMestre()
        );
        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/{id}/evoluir")
    @Transactional
    public ResponseEntity<PokemonResponseDto> evoluir(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestParam(value = "playerId", required = false) String playerId,
            @RequestBody(required = false) PokemonEvoluirRequestDto dto) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        Integer novaPokedexId = dto != null ? dto.getPokedexId() : null;
        Pokemon pokemon = pokemonService.evoluir(id, perfilId, novaPokedexId);
        return ResponseEntity.ok(PokemonResponseDto.from(pokemon));
    }

    @GetMapping("/{id}/evolucoes-possiveis")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PokemonEvolucaoOpcaoDto>> listarEvolucoesPossiveis(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestParam(value = "playerId", required = false) String playerId) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        return ResponseEntity.ok(pokemonService.listarEvolucoesPossiveis(id, perfilId));
    }

    @PostMapping("/{id}/atributos/alocar")
    @Transactional
    public ResponseEntity<PokemonResponseDto> alocarAtributos(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestParam(value = "playerId", required = false) String playerId,
            @Valid @RequestBody PokemonAlocarAtributoRequestDto dto) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        Pokemon pokemon = pokemonService.alocarAtributo(id, perfilId, dto.getAtributo(), dto.getQuantidade(), principal.isMestre());
        return ResponseEntity.ok(PokemonResponseDto.from(pokemon));
    }

    @GetMapping("/{id}/movimentos-disponiveis")
    @Transactional(readOnly = true)
    public ResponseEntity<List<MovimentoResponseDto>> listarMovimentosDisponiveis(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestParam(value = "playerId", required = false) String playerId,
            @RequestParam(value = "includeMetodosExtras", required = false, defaultValue = "false") boolean includeMetodosExtras) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        Pokemon pokemon = pokemonService.buscarPorIdEPerfil(id, perfilId);
        Set<MoveLearnMethod> metodos = (includeMetodosExtras && principal.isMestre())
                ? EnumSet.of(MoveLearnMethod.LEVEL_UP, MoveLearnMethod.EGG, MoveLearnMethod.MACHINE, MoveLearnMethod.TUTOR)
                : EnumSet.of(MoveLearnMethod.LEVEL_UP);
        List<MovimentoResponseDto> movimentos = pokemonLearnsetService
                .listarMovimentosDisponiveis(pokemon.getSpecies(), pokemon.getNivel(), metodos)
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
            @RequestParam(value = "playerId", required = false) String playerId,
            @RequestBody Map<String, Integer> body) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        Integer ordem = body != null ? body.get("ordem") : null;
        if (ordem == null) ordem = 1;
        Pokemon pokemon = pokemonService.colocarNoTime(id, perfilId, ordem);
        return ResponseEntity.ok(PokemonResponseDto.from(pokemon));
    }

    @DeleteMapping("/{id}/time")
    @Transactional
    public ResponseEntity<PokemonResponseDto> removerDoTime(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestParam(value = "playerId", required = false) String playerId) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        Pokemon pokemon = pokemonService.removerDoTime(id, perfilId);
        return ResponseEntity.ok(PokemonResponseDto.from(pokemon));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestParam(value = "playerId", required = false) String playerId) {
        String perfilId = perfilService.resolvePerfilId(principal, playerId);
        pokemonService.excluir(id, perfilId);
        return ResponseEntity.noContent().build();
    }
}
