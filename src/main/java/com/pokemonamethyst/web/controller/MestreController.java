package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.domain.Habilidade;
import com.pokemonamethyst.domain.Item;
import com.pokemonamethyst.domain.Movimento;
import com.pokemonamethyst.domain.PerfilJogador;
import com.pokemonamethyst.domain.Personalidade;
import com.pokemonamethyst.domain.PokemonSpecies;
import com.pokemonamethyst.domain.Usuario;
import com.pokemonamethyst.repository.PerfilJogadorRepository;
import com.pokemonamethyst.service.AuditLogService;
import com.pokemonamethyst.service.AuthService;
import com.pokemonamethyst.service.CatalogoService;
import com.pokemonamethyst.service.UsuarioService;
import com.pokemonamethyst.service.PokeApiService;
import com.pokemonamethyst.service.PokemonService;
import com.pokemonamethyst.service.PokemonSpeciesConfigService;
import com.pokemonamethyst.web.dto.HabilidadeAtualizarRequestDto;
import com.pokemonamethyst.web.dto.HabilidadeResponseDto;
import com.pokemonamethyst.web.dto.ItemAtualizarRequestDto;
import com.pokemonamethyst.web.dto.ItemResponseDto;
import com.pokemonamethyst.web.dto.MovimentoAtualizarRequestDto;
import com.pokemonamethyst.web.dto.MovimentoResponseDto;
import com.pokemonamethyst.web.dto.PerfilJogadorResponseDto;
import com.pokemonamethyst.web.dto.PersonalidadeRequestDto;
import com.pokemonamethyst.web.dto.PersonalidadeResponseDto;
import com.pokemonamethyst.web.dto.PokemonResponseDto;
import com.pokemonamethyst.web.dto.PokemonSpeciesConfigResponseDto;
import com.pokemonamethyst.web.dto.PokemonSpeciesConfigUpdateRequestDto;
import com.pokemonamethyst.web.dto.PokemonSpeciesResumoDto;
import com.pokemonamethyst.web.dto.PokemonTiposMestreRequestDto;
import com.pokemonamethyst.web.dto.PokeApiItemBuscaResponseDto;
import com.pokemonamethyst.web.dto.PokeApiItemResumoDto;
import com.pokemonamethyst.web.dto.UsuarioResponseDto;
import com.pokemonamethyst.web.dto.auth.RegistroRequestDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mestre")
public class MestreController {

    private final PerfilJogadorRepository perfilRepository;
    private final PokemonService pokemonService;
    private final PokeApiService pokeApiService;
    private final CatalogoService catalogoService;
    private final PokemonSpeciesConfigService speciesConfigService;
    private final AuthService authService;
    private final AuditLogService auditLogService;
    private final UsuarioService usuarioService;

    public MestreController(PerfilJogadorRepository perfilRepository, PokemonService pokemonService,
                            PokeApiService pokeApiService, CatalogoService catalogoService,
                            PokemonSpeciesConfigService speciesConfigService,
                            AuthService authService, AuditLogService auditLogService,
                            UsuarioService usuarioService) {
        this.perfilRepository = perfilRepository;
        this.pokemonService = pokemonService;
        this.pokeApiService = pokeApiService;
        this.catalogoService = catalogoService;
        this.speciesConfigService = speciesConfigService;
        this.authService = authService;
        this.auditLogService = auditLogService;
        this.usuarioService = usuarioService;
    }

    @GetMapping("/usuarios")
    public List<UsuarioResponseDto> listarUsuarios() {
        return usuarioService.listarTodos().stream().map(UsuarioResponseDto::from).toList();
    }

    @DeleteMapping("/usuarios/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluirUsuario(
            @AuthenticationPrincipal com.pokemonamethyst.security.UsuarioPrincipal principal,
            @PathVariable String id) {
        if (principal.getId().equals(id))
            throw new com.pokemonamethyst.exception.RegraNegocioException("Não é possível excluir sua própria conta.");
        Usuario alvo = usuarioService.buscarPorId(id);
        auditLogService.registrar(principal.getId(), principal.getUsername(), "CONTA_EXCLUIDA",
            "USUARIO", id, "Conta '" + alvo.getNomeUsuario() + "' excluída pelo mestre");
        usuarioService.excluir(id);
    }

    @PostMapping("/usuarios/mestre")
    public ResponseEntity<UsuarioResponseDto> criarContaMestre(
            @AuthenticationPrincipal com.pokemonamethyst.security.UsuarioPrincipal principal,
            @Valid @RequestBody RegistroRequestDto dto) {
        Usuario usuario = authService.registrarMestre(dto.getNomeUsuario(), dto.getSenha());
        auditLogService.registrar(principal.getId(), principal.getUsername(), "CONTA_MESTRE_CRIADA",
            "USUARIO", usuario.getId(),
            "Conta Mestre '" + usuario.getNomeUsuario() + "' criada");
        return ResponseEntity.ok(UsuarioResponseDto.from(usuario));
    }

    @PostMapping("/pokeapi/importar-movimentos")
    public ResponseEntity<Map<String, Integer>> importarMovimentos() {
        int importados = pokeApiService.importarMovimentos();
        return ResponseEntity.ok(Map.of("importados", importados));
    }

    @PostMapping("/pokeapi/importar-habilidades")
    public ResponseEntity<Map<String, Integer>> importarHabilidades() {
        int importados = pokeApiService.importarHabilidades();
        return ResponseEntity.ok(Map.of("importados", importados));
    }

    @PostMapping("/pokeapi/importar-itens")
    public ResponseEntity<Map<String, Integer>> importarItens() {
        int importados = pokeApiService.importarItens();
        return ResponseEntity.ok(Map.of("importados", importados));
    }

    @PostMapping("/pokeapi/importar-species/{pokedexId}")
    @Transactional
    public ResponseEntity<Map<String, Object>> importarSpecies(@PathVariable int pokedexId) {
        PokemonSpecies species = pokeApiService.importarSpeciesDaPokeApi(pokedexId);
        return ResponseEntity.ok(Map.of(
                "id", species.getId(),
                "pokedexId", species.getPokedexId(),
                "nome", species.getNome()
        ));
    }

    @PostMapping("/pokeapi/importar-species-todas")
    public ResponseEntity<Map<String, Object>> importarTodasSpecies() {
        return ResponseEntity.ok(pokeApiService.importarTodasSpeciesDaPokeApi());
    }

    @PostMapping("/pokeapi/importar-evolucoes")
    public ResponseEntity<Map<String, Object>> importarEvolucoes() {
        return ResponseEntity.ok(pokeApiService.importarTodasEvolucoes());
    }

    @PostMapping("/pokeapi/vincular-species-existentes")
    public ResponseEntity<Map<String, Object>> vincularSpeciesExistentes() {
        return ResponseEntity.ok(pokeApiService.vincularSpeciesExistentesComDadosDaPokeApi());
    }

    @GetMapping("/species")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PokemonSpeciesResumoDto>> listarSpecies(
            @RequestParam(value = "nome", required = false) String nome,
            @RequestParam(value = "pokedexId", required = false) Integer pokedexId,
            @RequestParam(value = "limit", required = false) Integer limit,
            @RequestParam(value = "incluirFormas", required = false, defaultValue = "false") boolean incluirFormas
    ) {
        return ResponseEntity.ok(speciesConfigService.listarSpecies(nome, pokedexId, limit, incluirFormas));
    }

    @GetMapping("/species/{speciesId}/formas")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PokemonSpeciesResumoDto>> listarFormasDaSpecies(@PathVariable String speciesId) {
        return ResponseEntity.ok(speciesConfigService.listarFormasDaSpecies(speciesId));
    }

    @GetMapping("/species/catalog-version")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, String>> obterVersaoCatalogoSpecies() {
        return ResponseEntity.ok(Map.of("version", speciesConfigService.obterVersaoCatalogo()));
    }

    @GetMapping("/species/{speciesId}/config")
    @Transactional(readOnly = true)
    public ResponseEntity<PokemonSpeciesConfigResponseDto> buscarConfigSpecies(@PathVariable String speciesId) {
        return ResponseEntity.ok(speciesConfigService.buscarConfig(speciesId));
    }

    @PutMapping("/species/{speciesId}/config")
    @Transactional
    public ResponseEntity<PokemonSpeciesConfigResponseDto> atualizarConfigSpecies(
            @PathVariable String speciesId,
            @RequestBody PokemonSpeciesConfigUpdateRequestDto dto
    ) {
        return ResponseEntity.ok(speciesConfigService.atualizarConfig(speciesId, dto));
    }

    @PostMapping("/species/{speciesId}/resincronizar-pokeapi")
    public ResponseEntity<Map<String, Object>> resincronizarSpeciesDaPokeApi(@PathVariable String speciesId) {
        PokemonSpecies species = speciesConfigService.buscarSpeciesPorId(speciesId);
        PokemonSpecies atualizado = pokeApiService.importarSpeciesDaPokeApi(species.getPokedexId());
        return ResponseEntity.ok(Map.of(
                "speciesId", atualizado.getId(),
                "pokedexId", atualizado.getPokedexId(),
                "nome", atualizado.getNome()
        ));
    }

    @PostMapping("/species/{speciesId}/learnset/normalizar-ordem")
    @Transactional
    public ResponseEntity<PokemonSpeciesConfigResponseDto> normalizarOrdemLearnset(@PathVariable String speciesId) {
        return ResponseEntity.ok(speciesConfigService.normalizarOrdemLearnset(speciesId));
    }

    @GetMapping("/pokeapi/itens/listar")
    public ResponseEntity<List<PokeApiItemResumoDto>> listarItensPokeApi(@RequestParam("q") String q) {
        List<PokeApiItemResumoDto> lista = pokeApiService.listarItensPokeApiPorNome(q);
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/pokeapi/itens/buscar")
    public ResponseEntity<PokeApiItemBuscaResponseDto> buscarItemPokeApi(
            @RequestParam("idOuNome") String idOuNome) {
        PokeApiItemBuscaResponseDto resultado = pokeApiService.buscarItemPokeApi(idOuNome);
        return ResponseEntity.ok(resultado);
    }

    @PostMapping("/pokeapi/importar-item")
    @Transactional
    public ResponseEntity<ItemResponseDto> importarItemPokeApi(
            @RequestBody Map<String, String> body) {
        String idOuNome = body != null ? body.get("idOuNome") : null;
        if (idOuNome == null || idOuNome.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        Item item = pokeApiService.importarItemPorIdOuNome(idOuNome);
        return ResponseEntity.ok(ItemResponseDto.from(item));
    }

    @PostMapping("/itens")
    @Transactional
    public ResponseEntity<ItemResponseDto> criarItem(
            @AuthenticationPrincipal com.pokemonamethyst.security.UsuarioPrincipal principal,
            @RequestBody ItemAtualizarRequestDto dto) {
        Item item = catalogoService.criarItem(dto.getNome(), dto.getNomeEn(), dto.getDescricao(),
                dto.getPeso(), dto.getPreco(), dto.getImagemUrl());
        auditLogService.registrar(principal.getId(), principal.getUsername(), "ITEM_CRIADO",
            "ITEM", item.getId(), "'" + item.getNome() + "'");
        return ResponseEntity.ok(ItemResponseDto.from(item));
    }

    @PutMapping("/itens/{id}")
    @Transactional
    public ResponseEntity<ItemResponseDto> atualizarItem(
            @AuthenticationPrincipal com.pokemonamethyst.security.UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestBody ItemAtualizarRequestDto dto) {
        Item item = catalogoService.atualizarItem(id, dto.getNome(), dto.getNomeEn(), dto.getDescricao(),
                dto.getPeso(), dto.getPreco(), dto.getImagemUrl());
        auditLogService.registrar(principal.getId(), principal.getUsername(), "ITEM_ATUALIZADO",
            "ITEM", item.getId(), "'" + item.getNome() + "'");
        return ResponseEntity.ok(ItemResponseDto.from(item));
    }

    @DeleteMapping("/itens/{id}")
    @Transactional
    public ResponseEntity<Void> excluirItem(
            @AuthenticationPrincipal com.pokemonamethyst.security.UsuarioPrincipal principal,
            @PathVariable String id) {
        catalogoService.excluirItem(id);
        auditLogService.registrar(principal.getId(), principal.getUsername(), "ITEM_EXCLUIDO",
            "ITEM", id, "Item excluído");
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/pokeapi/atualizar-imagens-itens")
    @Transactional
    public ResponseEntity<Map<String, Integer>> atualizarImagensItens() {
        int atualizados = pokeApiService.atualizarImagensItensImportados();
        return ResponseEntity.ok(Map.of("atualizados", atualizados));
    }

    @PostMapping("/habilidades")
    @Transactional
    public ResponseEntity<HabilidadeResponseDto> criarHabilidade(
            @AuthenticationPrincipal com.pokemonamethyst.security.UsuarioPrincipal principal,
            @RequestBody HabilidadeAtualizarRequestDto dto) {
        Habilidade h = catalogoService.criarHabilidade(dto.getNome(), dto.getNomeEn(), dto.getDescricao());
        auditLogService.registrar(principal.getId(), principal.getUsername(), "HABILIDADE_CRIADA",
            "HABILIDADE", h.getId(), "'" + h.getNome() + "'");
        return ResponseEntity.ok(HabilidadeResponseDto.from(h));
    }

    @PutMapping("/habilidades/{id}")
    @Transactional
    public ResponseEntity<HabilidadeResponseDto> atualizarHabilidade(
            @AuthenticationPrincipal com.pokemonamethyst.security.UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestBody HabilidadeAtualizarRequestDto dto) {
        Habilidade h = catalogoService.atualizarHabilidade(id, dto.getNome(), dto.getNomeEn(), dto.getDescricao());
        auditLogService.registrar(principal.getId(), principal.getUsername(), "HABILIDADE_ATUALIZADA",
            "HABILIDADE", h.getId(), "'" + h.getNome() + "'");
        return ResponseEntity.ok(HabilidadeResponseDto.from(h));
    }

    @PostMapping("/movimentos")
    @Transactional
    public ResponseEntity<MovimentoResponseDto> criarMovimento(
            @AuthenticationPrincipal com.pokemonamethyst.security.UsuarioPrincipal principal,
            @RequestBody MovimentoAtualizarRequestDto dto) {
        Movimento m = catalogoService.criarMovimento(dto.getNome(), dto.getNomeEn(), dto.getTipo(),
                dto.getCategoria(), dto.getCustoStamina(), dto.getDadoDeDano(), dto.getDescricaoEfeito());
        auditLogService.registrar(principal.getId(), principal.getUsername(), "MOVIMENTO_CRIADO",
            "MOVIMENTO", m.getId(), "'" + m.getNome() + "' (" + m.getTipo() + ")");
        return ResponseEntity.ok(MovimentoResponseDto.from(m));
    }

    @PutMapping("/movimentos/{id}")
    @Transactional
    public ResponseEntity<MovimentoResponseDto> atualizarMovimento(
            @AuthenticationPrincipal com.pokemonamethyst.security.UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestBody MovimentoAtualizarRequestDto dto) {
        Movimento m = catalogoService.atualizarMovimento(id, dto.getNome(), dto.getNomeEn(), dto.getTipo(),
                dto.getCategoria(), dto.getCustoStamina(), dto.getDadoDeDano(), dto.getDescricaoEfeito());
        auditLogService.registrar(principal.getId(), principal.getUsername(), "MOVIMENTO_ATUALIZADO",
            "MOVIMENTO", m.getId(), "'" + m.getNome() + "' (" + m.getTipo() + ")");
        return ResponseEntity.ok(MovimentoResponseDto.from(m));
    }

    @DeleteMapping("/movimentos/{id}")
    @Transactional
    public ResponseEntity<Void> excluirMovimento(
            @AuthenticationPrincipal com.pokemonamethyst.security.UsuarioPrincipal principal,
            @PathVariable String id) {
        catalogoService.excluirMovimento(id);
        auditLogService.registrar(principal.getId(), principal.getUsername(), "MOVIMENTO_EXCLUIDO",
            "MOVIMENTO", id, "Movimento excluído");
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/personalidades")
    @Transactional
    public ResponseEntity<PersonalidadeResponseDto> criarPersonalidade(
            @AuthenticationPrincipal com.pokemonamethyst.security.UsuarioPrincipal principal,
            @RequestBody PersonalidadeRequestDto dto) {
        Personalidade p = catalogoService.criarPersonalidade(dto.getNome());
        auditLogService.registrar(principal.getId(), principal.getUsername(), "PERSONALIDADE_CRIADA",
            "PERSONALIDADE", p.getId(), "'" + p.getNome() + "'");
        return ResponseEntity.ok(PersonalidadeResponseDto.from(p));
    }

    @PutMapping("/personalidades/{id}")
    @Transactional
    public ResponseEntity<PersonalidadeResponseDto> atualizarPersonalidade(
            @AuthenticationPrincipal com.pokemonamethyst.security.UsuarioPrincipal principal,
            @PathVariable String id,
            @RequestBody PersonalidadeRequestDto dto) {
        Personalidade p = catalogoService.atualizarPersonalidade(id, dto.getNome());
        auditLogService.registrar(principal.getId(), principal.getUsername(), "PERSONALIDADE_ATUALIZADA",
            "PERSONALIDADE", p.getId(), "'" + p.getNome() + "'");
        return ResponseEntity.ok(PersonalidadeResponseDto.from(p));
    }

    @DeleteMapping("/personalidades/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void excluirPersonalidade(
            @AuthenticationPrincipal com.pokemonamethyst.security.UsuarioPrincipal principal,
            @PathVariable String id) {
        Personalidade p = catalogoService.buscarPersonalidade(id);
        auditLogService.registrar(principal.getId(), principal.getUsername(), "PERSONALIDADE_EXCLUIDA",
            "PERSONALIDADE", id, "'" + p.getNome() + "'");
        catalogoService.excluirPersonalidade(id);
    }

    @PutMapping("/pokemons/{pokemonId}/tipos")
    @Transactional
    public ResponseEntity<PokemonResponseDto> mestreDefinirTiposPokemon(
            @PathVariable String pokemonId,
            @RequestBody PokemonTiposMestreRequestDto dto) {
        if (dto == null) {
            return ResponseEntity.badRequest().build();
        }
        var pokemon = pokemonService.mestreDefinirTiposPokemon(
                pokemonId,
                dto.getTipoPrimario(),
                dto.getTipoSecundario(),
                dto.isResetTiposParaEspecie());
        return ResponseEntity.ok(PokemonResponseDto.from(pokemon));
    }

    @GetMapping("/jogadores")
    @Transactional(readOnly = true)
    public ResponseEntity<List<PerfilJogadorResponseDto>> listarJogadores() {
        List<PerfilJogador> perfis = perfilRepository.findAll();
        List<PerfilJogadorResponseDto> dtos = perfis.stream()
                .map(p -> {
                    var time = pokemonService.listarTimePrincipal(p.getId());
                    var box = pokemonService.listarBox(p.getId());
                    return PerfilJogadorResponseDto.from(p, time, box);
                })
                .toList();
        return ResponseEntity.ok(dtos);
    }
}
