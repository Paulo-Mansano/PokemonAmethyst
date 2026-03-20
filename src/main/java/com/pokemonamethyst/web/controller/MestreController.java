package com.pokemonamethyst.web.controller;

import com.pokemonamethyst.domain.Habilidade;
import com.pokemonamethyst.domain.Item;
import com.pokemonamethyst.domain.Movimento;
import com.pokemonamethyst.domain.PerfilJogador;
import com.pokemonamethyst.domain.Personalidade;
import com.pokemonamethyst.domain.PokemonSpecies;
import com.pokemonamethyst.repository.PerfilJogadorRepository;
import com.pokemonamethyst.service.CatalogoService;
import com.pokemonamethyst.service.PokeApiService;
import com.pokemonamethyst.service.PokemonService;
import com.pokemonamethyst.web.dto.HabilidadeAtualizarRequestDto;
import com.pokemonamethyst.web.dto.HabilidadeResponseDto;
import com.pokemonamethyst.web.dto.ItemAtualizarRequestDto;
import com.pokemonamethyst.web.dto.ItemResponseDto;
import com.pokemonamethyst.web.dto.MovimentoAtualizarRequestDto;
import com.pokemonamethyst.web.dto.MovimentoResponseDto;
import com.pokemonamethyst.web.dto.PerfilJogadorResponseDto;
import com.pokemonamethyst.web.dto.PersonalidadeRequestDto;
import com.pokemonamethyst.web.dto.PersonalidadeResponseDto;
import com.pokemonamethyst.web.dto.PokeApiItemBuscaResponseDto;
import com.pokemonamethyst.web.dto.PokeApiItemResumoDto;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/mestre")
public class MestreController {

    private final PerfilJogadorRepository perfilRepository;
    private final PokemonService pokemonService;
    private final PokeApiService pokeApiService;
    private final CatalogoService catalogoService;

    public MestreController(PerfilJogadorRepository perfilRepository, PokemonService pokemonService,
                            PokeApiService pokeApiService, CatalogoService catalogoService) {
        this.perfilRepository = perfilRepository;
        this.pokemonService = pokemonService;
        this.pokeApiService = pokeApiService;
        this.catalogoService = catalogoService;
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
    public ResponseEntity<ItemResponseDto> criarItem(@RequestBody ItemAtualizarRequestDto dto) {
        Item item = catalogoService.criarItem(
                dto.getNome(),
                dto.getNomeEn(),
                dto.getDescricao(),
                dto.getPeso(),
                dto.getPreco(),
                dto.getImagemUrl()
        );
        return ResponseEntity.ok(ItemResponseDto.from(item));
    }

    @PutMapping("/itens/{id}")
    @Transactional
    public ResponseEntity<ItemResponseDto> atualizarItem(
            @PathVariable String id,
            @RequestBody ItemAtualizarRequestDto dto) {
        Item item = catalogoService.atualizarItem(
                id,
                dto.getNome(),
                dto.getNomeEn(),
                dto.getDescricao(),
                dto.getPeso(),
                dto.getPreco(),
                dto.getImagemUrl()
        );
        return ResponseEntity.ok(ItemResponseDto.from(item));
    }

    @PostMapping("/pokeapi/atualizar-imagens-itens")
    @Transactional
    public ResponseEntity<Map<String, Integer>> atualizarImagensItens() {
        int atualizados = pokeApiService.atualizarImagensItensImportados();
        return ResponseEntity.ok(Map.of("atualizados", atualizados));
    }

    @PostMapping("/habilidades")
    @Transactional
    public ResponseEntity<HabilidadeResponseDto> criarHabilidade(@RequestBody HabilidadeAtualizarRequestDto dto) {
        Habilidade h = catalogoService.criarHabilidade(
                dto.getNome(),
                dto.getNomeEn(),
                dto.getDescricao()
        );
        return ResponseEntity.ok(HabilidadeResponseDto.from(h));
    }

    @PutMapping("/habilidades/{id}")
    @Transactional
    public ResponseEntity<HabilidadeResponseDto> atualizarHabilidade(
            @PathVariable String id,
            @RequestBody HabilidadeAtualizarRequestDto dto) {
        Habilidade h = catalogoService.atualizarHabilidade(
                id,
                dto.getNome(),
                dto.getNomeEn(),
                dto.getDescricao()
        );
        return ResponseEntity.ok(HabilidadeResponseDto.from(h));
    }

    @PostMapping("/movimentos")
    @Transactional
    public ResponseEntity<MovimentoResponseDto> criarMovimento(@RequestBody MovimentoAtualizarRequestDto dto) {
        Movimento m = catalogoService.criarMovimento(
                dto.getNome(),
                dto.getNomeEn(),
                dto.getTipo(),
                dto.getCategoria(),
                dto.getCustoStamina(),
                dto.getDadoDeDano(),
                dto.getDescricaoEfeito()
        );
        return ResponseEntity.ok(MovimentoResponseDto.from(m));
    }

    @PutMapping("/movimentos/{id}")
    @Transactional
    public ResponseEntity<MovimentoResponseDto> atualizarMovimento(
            @PathVariable String id,
            @RequestBody MovimentoAtualizarRequestDto dto) {
        Movimento m = catalogoService.atualizarMovimento(
                id,
                dto.getNome(),
                dto.getNomeEn(),
                dto.getTipo(),
                dto.getCategoria(),
                dto.getCustoStamina(),
                dto.getDadoDeDano(),
                dto.getDescricaoEfeito()
        );
        return ResponseEntity.ok(MovimentoResponseDto.from(m));
    }

    @PostMapping("/personalidades")
    @Transactional
    public ResponseEntity<PersonalidadeResponseDto> criarPersonalidade(@RequestBody PersonalidadeRequestDto dto) {
        Personalidade p = catalogoService.criarPersonalidade(dto.getNome());
        return ResponseEntity.ok(PersonalidadeResponseDto.from(p));
    }

    @PutMapping("/personalidades/{id}")
    @Transactional
    public ResponseEntity<PersonalidadeResponseDto> atualizarPersonalidade(
            @PathVariable String id,
            @RequestBody PersonalidadeRequestDto dto) {
        Personalidade p = catalogoService.atualizarPersonalidade(id, dto.getNome());
        return ResponseEntity.ok(PersonalidadeResponseDto.from(p));
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
