export const queryKeys = {
  auth: {
    usuario: ['auth', 'usuario'],
  },
  players: {
    mestresJogadores: ['players', 'mestre-jogadores'],
  },
  perfil: (playerId) => ['perfil', playerId ?? 'self'],
  pokemons: (playerId) => ['pokemons', playerId ?? 'self'],
  pokemonsSelvagens: (playerId) => ['pokemons', 'selvagens', playerId ?? 'self'],
  pokemonsSelvagensOwner: () => ['pokemons', 'selvagens', 'owner'],
  pokemon: (playerId, pokemonId) => ['pokemon', playerId ?? 'self', pokemonId],
  pokemonMovimentosDisponiveis: (playerId, pokemonId) => ['pokemon', playerId ?? 'self', pokemonId, 'movimentos-disponiveis'],
  mochila: (playerId) => ['mochila', playerId ?? 'self'],
  catalogo: {
    itens: ['catalogo', 'itens'],
    movimentos: ['catalogo', 'movimentos'],
    habilidades: ['catalogo', 'habilidades'],
    personalidades: ['catalogo', 'personalidades'],
  },
  species: {
    version: ['species', 'version'],
    lista: ['species', 'lista'],
  },
}

