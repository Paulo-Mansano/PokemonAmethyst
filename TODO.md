# TODO - Arquitetura de Pokémon (Species Cache vs Instance)

## Contexto atual (resumo)
O código hoje persiste e mistura dados “fixos da espécie” e dados “variáveis da instância” dentro da mesma entidade `com.pokemonamethyst.domain.Pokemon`:
- espécie/cache (ex.: `especie`, `tipoPrimario`, `tipoSecundario`, `imagemUrl`)
- instância/jogador (ex.: `nivel`, `xpAtual`, `hpMaximo`, `ataque/defesa/...`)

Além disso:
- o endpoint `/api/pokeapi/pokemon/{idOuNome}` hoje traz basicamente `id`, `name`, `imageUrl` e `tipos`
- criação/atualização de Pokémon do jogador (`PokemonService#criar` e `PokemonController#atualizar`) permite que o frontend informe stats “fixos” e persista esses valores

Este TODO organiza as mudanças necessárias para seguir o desenho recomendado no feedback:
1) separar `pokemon_species` (cache da PokeAPI)
2) manter `pokemon_instance` (por jogador) com IVs/nature/nível/etc
3) recalcular status (em runtime/DTO) ao invés de armazenar base/fixos

## Objetivo
Chegar em uma arquitetura escalável onde:
- `pokemon_species` é populado uma vez por espécie (cache/idempotente)
- `pokemon_instance` referencia `species_id` e guarda apenas variáveis do jogador (IVs, shiny, nível, xp, etc.)
- `PokemonResponseDto` retorna status calculados a partir de `species(base stats) + IVs + level (+ nature se aplicar)`

## Decisões pendentes (preciso confirmar depois)
1. `staminaMaxima`, `tecnica`, `respeito` devem ser derivadas (a partir de base stats/IV/nature) ou podem continuar persistidas como “custom do sistema”?
2. “stats clássicos” do Pokémon (hp/atk/def/SpA/SpD/speed) serão recalculados; ok. Mas qual mapeamento exato você quer para `ataque_especial`/`defesa_especial` e para `stamina/tecnica/respeito`?
3. Nature: implementar junto no primeiro ciclo (recomendado) ou deixar para depois?

## Requisitos do checklist (serão convertidos em tarefas abaixo)
Essenciais da espécie:
- base stats
- tipos
- abilities
- growth rate
- base experience (xp)
- capture rate
- egg groups (opcional agora, mas recomendado se houver breeding futuro)
- height/weight (opcional)

Visual:
- sprites normal + shiny (preferencialmente)

Instância:
- IVs (0..31 por stat)
- shiny (variável da instância)
- (opcional avançado) nature + EVs

Cálculo:
- não persistir stats “fixos”; calcular status derivado

---

## Backlog de tarefas

### Tarefa 1: Modelos/DB - introduzir `pokemon_species` (cache)
Descrição:
- Criar entidade `PokemonSpecies` + tabela `pokemon_species`
- Definir campos para base stats, tipos, abilities, growth rate, base experience, capture rate, sprites normal/shiny (mínimo para viabilizar o cálculo de stats)
- Garantir idempotência por `pokedex_id` (unique index)

Áreas a tocar:
- `domain/` (nova entidade)
- `repository/` (novo repository)
- `service/` (lógica de import/cache)
- `migration`/schema (se seu projeto usa migrações, planejar)

Dependências:
- Tarefa 2 (import completo da espécie) e Tarefa 3 (fluxo de criação)

Estimativa:
- Dificuldade: Alta
- Tempo: 2-4 dias

Critérios de aceite:
- é possível inserir/consultar espécies por `pokedex_id` sem duplicar
- dados base suficientes existem para calcular stats (mesmo que ainda sem learnset)

### Tarefa 2: Modelos/DB - introduzir `pokemon_instance`
Descrição:
- Renomear/reestruturar o atual `com.pokemonamethyst.domain.Pokemon` para ser a instância do jogador
- Adicionar `species_id` (FK para `pokemon_species`)
- Definir campos da instância:
  - variáveis: `nivel`, `xpAtual`, `shiny`, `genero`, `apelido`, `nature` (se aplicar), IVs
  - status atuais (`statusAtuais`, `hpAtual`) se fizer sentido (ou manter como hoje, se for parte do gameplay)
  - movimentos/itens/personalidade (continue como hoje)
- Remover da instância o que for “fixo da espécie” (ex.: `especie`, `tipoPrimario`, `tipoSecundario`, `imagemUrl`) ou tornar derivado

Áreas a tocar:
- `domain/Pokemon.java` (ou nova classe `PokemonInstance`)
- `repository/PokemonRepository.java` (queries por `perfil_id` seguem)
- DTOs de `PokemonRequestDto`/`PokemonResponseDto`

Dependências:
- Tarefa 1

Estimativa:
- Dificuldade: Alta
- Tempo: 2-4 dias

Critérios de aceite:
- cada instância referencia uma espécie persistida
- ao buscar a instância, a API consegue responder tipos/imagem/nome usando `pokemon_species`

### Tarefa 3: PokeApi - buscar e persistir espécie completa
Descrição:
- Expandir `com.pokemonamethyst.service.PokeApiService` para:
  - buscar `pokemon/{id}` (sprites, tipos, base stats)
  - buscar `pokemon-species/{id}` (growth rate, capture rate, egg groups, etc.)
- Implementar métodos:
  - `importarPokemonSpeciesPorId(pokedexId)` (idempotente)
  - `buscarSpeciesCache(pokedexId)` (retorna do banco, ou importa se ausente)

Áreas a tocar:
- `service/PokeApiService.java`
- `service/CatalogoService` (se existir lógica de import/catalógo)
- novos endpoints internos (se precisar)

Dependências:
- Tarefa 1

Estimativa:
- Dificuldade: Média- Alta
- Tempo: 2-4 dias

Critérios de aceite:
- ao pedir uma espécie por `pokedex_id`, o banco passa a ter cache com base stats e tipos corretos
- sistema resiste a falhas parciais de endpoints (fallbacks mínimos)

### Tarefa 4: Fluxo de criação - importar espécie sob demanda
Descrição:
- Ajustar `PokemonService#criar` e/ou adicionar novo método “criar a partir de pokedexId”
- Fluxo:
  1. receber `pokedexId` (e preferências: apelido/shiny/genero/nature/ivs seed se existir)
  2. consultar `pokemon_species` por `pokedexId`
  3. se não existir, importar via Tarefa 3
  4. criar `pokemon_instance` com `species_id` e variáveis do jogador

Áreas a tocar:
- `service/PokemonService.java`
- `controller/PokemonController.java`
- `web/dto/PokemonRequestDto.java`
- `web/dto/PokemonAtualizarRequestDto.java`
- `frontend` (ajuste do contrato de criação)

Dependências:
- Tarefa 2 e 3

Estimativa:
- Dificuldade: Alta
- Tempo: 1-3 dias

Critérios de aceite:
- “Novo Pokémon” cria instância sem o frontend precisar mandar campos fixos da espécie

### Tarefa 5: IVs - persistir IVs e gerar na criação
Descrição:
- Adicionar campos de IVs na instância:
  - `ivs_hp`, `ivs_attack`, `ivs_defense`, `ivs_sp_attack`, `ivs_sp_defense`, `ivs_speed`
- Gerar valores aleatórios no backend ao criar instância:
  - `0..31` por stat
- Retornar no `PokemonResponseDto` (opcional) ou usar apenas internamente para cálculo

Áreas a tocar:
- `domain/PokemonInstance`
- `web/dto` (se for necessário exibir)
- `service/PokemonService`

Dependências:
- Tarefa 2

Estimativa:
- Dificuldade: Média
- Tempo: 1-2 dias

Critérios de aceite:
- cada instância criada tem IVs válidos (0..31) persistidos

### Tarefa 6: Recalcular status - remover persistência de stats derivados
Descrição:
- Definir função de cálculo no backend:
  - base de species + IV + nível + (nature se aplicar)
- Atualizar `PokemonResponseDto.from(instance)` para:
  - buscar species e calcular `hpMaximo`, `ataque`, `defesa`, `ataqueEspecial`, `defesaEspecial`, `speed`
  - não usar `ataque/defesa/...` armazenados como “fonte de verdade” (ou trocar essas colunas para derivadas/transientes)
- Ajustar `PokemonService#atualizar`:
  - impedir que o frontend “force” stats fixos via request
  - permitir alterar nível/xp/shiny/nature/IVs (se você permitir reroll) e movimentos/status

Áreas a tocar:
- `service/PokemonService.java`
- `web/dto/PokemonResponseDto.java`
- `web/dto/PokemonRequestDto.java` e `PokemonAtualizarRequestDto.java`
- `frontend/src/pages/PokemonList.jsx` (remover inputs/edit de stats derivados, ou tratá-los como readonly)

Dependências:
- Tarefa 1/2
- Tarefa 5

Estimativa:
- Dificuldade: Alta
- Tempo: 3-6 dias

Critérios de aceite:
- ao mudar `nivel` da instância, os status calculados mudam automaticamente (sem depender de payload do frontend)
- não existe mais comportamento “ataque=0” por payload (ou outros defaults errados)

### Tarefa 7: Nature (opcional recomendado cedo)
Descrição:
- Adicionar `nature` na instância
- Implementar efeito:
  - aplicar bônus/malús em um stat e redução em outro (ex.: +10%/-10% conforme seu sistema)
- Incluir `nature` na criação e no cálculo de status.

Áreas a tocar:
- `domain/PokemonInstance`
- `web/dto` request/response
- `frontend` para seleção/aleatoriedade (se existir UI)

Dependências:
- Tarefa 4/5/6

Estimativa:
- Dificuldade: Média
- Tempo: 1-3 dias

Critérios de aceite:
- mudar `nature` altera stats calculados conforme regra definida

### Tarefa 8: Ajuste do endpoint `/api/pokeapi/...` (contrato do catálogo)
Descrição:
- Hoje o catálogo PokeAPI preenche `especie`/tipos/imagem direto no frontend.
- Objetivo: o catálogo ainda pode mostrar preview, mas a criação do Pokémon do jogador deve enviar somente `pokedexId` + preferências.
- Alternativa:
  - o endpoint de “detalhe” pode incluir apenas preview (nome/imagem/tipo)
  - o backend decide o cache e o que persiste na instância.

Áreas a tocar:
- `web/controller/PokeApiController.java` (se necessário)
- `service/PokeApiService.java`
- `frontend/src/pages/PokemonList.jsx` (ajuste do payload em `criarPokemon`/`atualizarPokemon`)

Dependências:
- Tarefa 4 e 6

Estimativa:
- Dificuldade: Média
- Tempo: 1-2 dias

Critérios de aceite:
- o frontend não consegue (mesmo por erro) persistir espécie/tipos/imagem como se fossem “variáveis do jogador”

### Tarefa 9: Aprimoramento opcional do checklist (growth curve / learnset / abilities)
Descrição:
- Se você quiser seguir 100% do checklist do feedback:
  - XP necessário por growth rate (ex.: fast/medium/slow)
  - moves por level-up e learnset completo (tabelas extras)
  - capacidades/habilidades por espécie (persistir na species e aplicar na instância)
  - sprites shiny e artwork oficial (se quiser)

Áreas a tocar:
- `domain` + `repository` (novas tabelas)
- `service` (import e geração)
- `frontend` (exibir learnset/moves disponíveis)

Dependências:
- Tarefa 1/3/6

Estimativa:
- Dificuldade: Alta
- Tempo: 3-10 dias (depende do escopo)

Critérios de aceite:
- progressão por XP funciona via growth rate
- tabela de learnset permite resolver “quais moves o Pokémon aprende”

---

## Marcos (milestones) sugeridos
1. Marco A (base da arquitetura): Tarefa 1 + 2 + 3
2. Marco B (gameplay básico escalável): Tarefa 4 + 5 + 6
3. Marco C (polimento): Tarefa 7 + 8
4. Marco D (checklist completo): Tarefa 9

---

## Riscos e notas
1. Migração do banco: alterar tabelas/colunas de `pokemon` pode exigir script/estratégia de migração para não perder dados.
2. Compatibilidade com frontend atual: remover campos de request (stats fixos) pode quebrar UI; por isso Tarefa 6 inclui ajuste do frontend.
3. Balanceamento: fórmula de status e nature precisa de validação para não “estourar” números.

---

## Próximo passo (antes de implementar de verdade)
Responder às “decisões pendentes” do topo deste arquivo para eu consolidar o mapeamento exato (principalmente `staminaMaxima`, `tecnica`, `respeito`) e fechar o desenho do cálculo server-side.

