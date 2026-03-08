package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.domain.PerfilJogador;
import com.pokemonamethyst.domain.Pokemon;
import com.pokemonamethyst.security.UsuarioPrincipal;
import com.pokemonamethyst.service.PerfilJogadorService;
import com.pokemonamethyst.service.PokemonService;
import com.pokemonamethyst.web.dto.PokemonAtualizarRequestDto;
import com.pokemonamethyst.web.dto.PokemonRequestDto;
import com.pokemonamethyst.web.dto.PokemonResponseDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/perfis/meu/pokemons")
public class PokemonController {

    private final PerfilJogadorService perfilService;
    private final PokemonService pokemonService;

    public PokemonController(PerfilJogadorService perfilService, PokemonService pokemonService) {
        this.perfilService = perfilService;
        this.pokemonService = pokemonService;
    }

    private String perfilId(UsuarioPrincipal principal) {
        return perfilService.buscarMeuPerfil(principal.getId()).getId();
    }

    @GetMapping
    public ResponseEntity<List<PokemonResponseDto>> listar(@AuthenticationPrincipal UsuarioPrincipal principal) {
        String perfilId = perfilId(principal);
        List<Pokemon> lista = pokemonService.listarPorPerfil(perfilId);
        return ResponseEntity.ok(lista.stream().map(PokemonResponseDto::from).toList());
    }

    @PostMapping
    public ResponseEntity<PokemonResponseDto> criar(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @Valid @RequestBody PokemonRequestDto dto) {
        String perfilId = perfilId(principal);
        Pokemon pokemon = pokemonService.criar(
                perfilId,
                dto.getPokedexId(),
                dto.getEspecie(),
                dto.getTipoPrimario(),
                dto.getApelido(),
                dto.getTipoSecundario(),
                dto.getGenero(),
                dto.getPokebolaCaptura(),
                dto.getHpMaximoOrDefault(),
                dto.getStaminaMaximaOrDefault(),
                dto.getImagemUrl()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(PokemonResponseDto.from(pokemon));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PokemonResponseDto> buscar(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id) {
        String perfilId = perfilId(principal);
        Pokemon pokemon = pokemonService.buscarPorIdEPerfil(id, perfilId);
        return ResponseEntity.ok(PokemonResponseDto.from(pokemon));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PokemonResponseDto> atualizar(
            @AuthenticationPrincipal UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestBody PokemonAtualizarRequestDto dto) {
        String perfilId = perfilId(principal);
        Pokemon pokemon = pokemonService.atualizar(
                id, perfilId,
                dto.getApelido(), dto.getImagemUrl(), dto.getNotas(),
                dto.getGenero(), dto.getShiny(), dto.getTipoSecundario(), dto.getPersonalidade(),
                dto.getEspecializacao(), dto.getBerryFavorita(), dto.getNivelDeVinculo(),
                dto.getNivel(), dto.getXpAtual(), dto.getPokebolaCaptura(), dto.getItemSeguradoId(),
                dto.getHpAtual(), dto.getHpTemporario(), dto.getStaminaAtual(), dto.getStaminaTemporaria(),
                dto.getAtaque(), dto.getAtaqueEspecial(), dto.getDefesa(), dto.getDefesaEspecial(),
                dto.getSpeed(), dto.getTecnica(), dto.getRespeito(), dto.getStatusAtuais()
        );
        return ResponseEntity.ok(PokemonResponseDto.from(pokemon));
    }

    @PutMapping("/{id}/time")
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
