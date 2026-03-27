/** Base da API: em dev usa /api (proxy Vite). Em prod, VITE_API_BASE pode ser só o host — garantimos sufixo /api. */
function apiBase() {
  const raw = import.meta.env.VITE_API_BASE;
  if (!raw) return '/api';
  const trimmed = String(raw).replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}
const BASE = apiBase();

function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

/** Anexa ?playerId= ou &playerId= ao path (id do perfil_jogador alvo; só para mestre). */
function withPlayerQuery(path, playerId) {
  if (!playerId) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}playerId=${encodeURIComponent(playerId)}`;
}

export async function login(nomeUsuario, senha) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ nomeUsuario, senha, mestre: false }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Falha no login');
  }
  return res.json();
}

export async function registro(nomeUsuario, senha, mestre = false) {
  const res = await request('/auth/registro', {
    method: 'POST',
    body: JSON.stringify({ nomeUsuario, senha, mestre }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Falha no registro');
  }
  return res.json();
}

export async function logout() {
  await request('/auth/logout', { method: 'POST' });
}

export async function getUsuario() {
  const res = await request('/usuarios/eu');
  if (!res.ok) throw new Error('Não autenticado');
  return res.json();
}

export async function getMeuPerfil(playerId) {
  const res = await request(withPlayerQuery('/perfis/meu', playerId));
  if (!res.ok) {
    if (res.status === 404) return null;
    if (res.status === 401 || res.status === 403) {
      throw new Error('Sessão inválida ou expirada. Faça login novamente.');
    }
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao carregar perfil');
  }
  return res.json();
}

export async function salvarPerfil(body, playerId) {
  const res = await request(withPlayerQuery('/perfis/meu', playerId), {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao salvar perfil');
  }
  return res.json();
}

const MSG_SEM_PERFIL = 'Crie seu perfil na Ficha primeiro.';

export async function getMestreJogadores() {
  const res = await request('/mestre/jogadores');
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao listar jogadores');
  }
  return res.json();
}

export async function getPokemons(playerId) {
  const res = await request(withPlayerQuery('/perfis/meu/pokemons', playerId));
  if (!res.ok) {
    if (res.status === 404) throw new Error(MSG_SEM_PERFIL);
    throw new Error('Erro ao carregar Pokémon');
  }
  return res.json();
}

export async function getPokemonsSelvagens(playerId) {
  const res = await request(withPlayerQuery('/perfis/meu/pokemons/selvagens', playerId))
  if (!res.ok) throw new Error('Erro ao carregar Pokémon selvagens')
  return res.json()
}

export async function gerarPokemonSelvagem(body, playerId) {
  const res = await request(withPlayerQuery('/perfis/meu/pokemons/gerar-selvagem', playerId), {
    method: 'POST',
    body: JSON.stringify(body || {}),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.mensagem || 'Erro ao gerar Pokémon selvagem')
  }
  return res.json()
}

export async function calcularDanoBatalha(body, playerId) {
  const res = await request(withPlayerQuery('/perfis/meu/pokemons/batalha/calcular', playerId), {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.mensagem || 'Erro ao calcular dano')
  }
  return res.json()
}

export async function aplicarDanoBatalha(body, playerId) {
  const res = await request(withPlayerQuery('/perfis/meu/pokemons/batalha/aplicar-dano', playerId), {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.mensagem || 'Erro ao aplicar dano')
  }
  return res.json()
}

export async function atualizarEstadoPokemon(id, estado, playerId) {
  const res = await request(withPlayerQuery(`/perfis/meu/pokemons/${id}/estado`, playerId), {
    method: 'PUT',
    body: JSON.stringify({ estado }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.mensagem || 'Erro ao atualizar estado do Pokémon')
  }
  return res.json()
}

export async function tentarCapturaPokemon(id, sucesso, playerId) {
  const res = await request(withPlayerQuery(`/perfis/meu/pokemons/${id}/captura`, playerId), {
    method: 'POST',
    body: JSON.stringify({ sucesso: !!sucesso }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.mensagem || 'Erro ao resolver captura')
  }
  return res.json()
}

export async function criarPokemon(body, playerId) {
  const res = await request(withPlayerQuery('/perfis/meu/pokemons', playerId), {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error(MSG_SEM_PERFIL);
    const data = await res.json().catch(() => ({}));
    const extra = data.detalhe ? ` (${data.detalhe})` : '';
    throw new Error((data.mensagem || 'Erro ao criar Pokémon') + extra);
  }
  return res.json();
}

export async function getPokemon(id, playerId) {
  const res = await request(withPlayerQuery(`/perfis/meu/pokemons/${id}`, playerId));
  if (!res.ok) {
    if (res.status === 404) throw new Error(MSG_SEM_PERFIL);
    throw new Error('Erro ao carregar Pokémon');
  }
  return res.json();
}

export async function atualizarPokemon(id, body, playerId) {
  const res = await request(withPlayerQuery(`/perfis/meu/pokemons/${id}`, playerId), {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao atualizar Pokémon');
  }
  return res.json();
}

export async function ganharXpPokemon(id, xpGanho, playerId) {
  const res = await request(withPlayerQuery(`/perfis/meu/pokemons/${id}/xp/ganhar`, playerId), {
    method: 'POST',
    body: JSON.stringify({ xpGanho }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao ganhar XP');
  }
  return res.json();
}

export async function aceitarMovimentoAprendido(id, movimentoId, substituirMovimentoId, playerId) {
  const res = await request(withPlayerQuery(`/perfis/meu/pokemons/${id}/movimentos-aprendendo/aceitar`, playerId), {
    method: 'POST',
    body: JSON.stringify({ movimentoId, substituirMovimentoId: substituirMovimentoId || null }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao aceitar novo ataque');
  }
  return res.json();
}

export async function recusarMovimentoAprendido(id, movimentoId, playerId) {
  const res = await request(withPlayerQuery(`/perfis/meu/pokemons/${id}/movimentos-aprendendo/recusar`, playerId), {
    method: 'POST',
    body: JSON.stringify({ movimentoId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao recusar novo ataque');
  }
  return res.json();
}

/** Apenas conta Mestre (ROLE_MESTRE). Altera tipos da instância ou restaura os da espécie. */
export async function mestreDefinirTiposPokemon(pokemonId, body) {
  const res = await request(`/mestre/pokemons/${pokemonId}/tipos`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao definir tipos')
  }
  return res.json()
}

export async function getMovimentosDisponiveisPokemon(id, playerId) {
  const res = await request(withPlayerQuery(`/perfis/meu/pokemons/${id}/movimentos-disponiveis`, playerId));
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao carregar movimentos disponíveis');
  }
  return res.json();
}

export async function colocarNoTime(id, ordem = 1, playerId) {
  const res = await request(withPlayerQuery(`/perfis/meu/pokemons/${id}/time`, playerId), {
    method: 'PUT',
    body: JSON.stringify({ ordem }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao colocar no time');
  }
  return res.json();
}

export async function removerDoTime(id, playerId) {
  const res = await request(withPlayerQuery(`/perfis/meu/pokemons/${id}/time`, playerId), { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao remover do time');
  }
  return res.json();
}

export async function excluirPokemon(id, playerId) {
  const res = await request(withPlayerQuery(`/perfis/meu/pokemons/${id}`, playerId), { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao excluir Pokémon');
  }
}

export async function getMochila(playerId) {
  const res = await request(withPlayerQuery('/perfis/meu/mochila', playerId));
  if (!res.ok) throw new Error('Erro ao carregar mochila');
  return res.json();
}

export async function adicionarItemMochila(itemId, quantidade, playerId) {
  const res = await request(withPlayerQuery('/perfis/meu/mochila/itens', playerId), {
    method: 'PUT',
    body: JSON.stringify({ itemId, quantidade }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao adicionar item');
  }
  return res.json();
}

export async function removerItemMochila(itemId, quantidade = 1, playerId) {
  const base = `/perfis/meu/mochila/itens/${itemId}?quantidade=${quantidade}`;
  const res = await request(withPlayerQuery(base, playerId), {
    method: 'DELETE',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao remover item');
  }
  return res.json();
}

export async function getItens() {
  const res = await request('/itens');
  if (!res.ok) throw new Error('Erro ao carregar itens');
  return res.json();
}

export async function getMovimentos() {
  const res = await request('/movimentos');
  if (!res.ok) throw new Error('Erro ao carregar movimentos');
  return res.json();
}

export async function getHabilidades() {
  const res = await request('/habilidades');
  if (!res.ok) throw new Error('Erro ao carregar habilidades');
  return res.json();
}

export async function importarHabilidadesPokeApi() {
  const res = await request('/mestre/pokeapi/importar-habilidades', { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao importar habilidades');
  }
  return res.json();
}

export async function criarHabilidade(body) {
  const res = await request('/mestre/habilidades', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao criar habilidade');
  }
  return res.json();
}

export async function atualizarHabilidade(id, body) {
  const res = await request(`/mestre/habilidades/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao atualizar habilidade');
  }
  return res.json();
}

export async function importarMovimentosPokeApi() {
  const res = await request('/mestre/pokeapi/importar-movimentos', { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao importar movimentos');
  }
  return res.json();
}

export async function criarMovimento(body) {
  const res = await request('/mestre/movimentos', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao criar movimento');
  }
  return res.json();
}

export async function atualizarMovimento(id, body) {
  const res = await request(`/mestre/movimentos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao atualizar movimento');
  }
  return res.json();
}

export async function getPersonalidades() {
  const res = await request('/personalidades');
  if (!res.ok) throw new Error('Erro ao carregar personalidades');
  return res.json();
}

export async function criarPersonalidade(body) {
  const res = await request('/mestre/personalidades', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao criar personalidade');
  }
  return res.json();
}

export async function atualizarPersonalidade(id, body) {
  const res = await request(`/mestre/personalidades/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao atualizar personalidade');
  }
  return res.json();
}

export async function listarItensPokeApi(q) {
  if (!q || !String(q).trim()) return []
  const params = new URLSearchParams({ q: String(q).trim() })
  const res = await request(`/mestre/pokeapi/itens/listar?${params.toString()}`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.mensagem || 'Erro ao buscar itens na PokéAPI')
  }
  return res.json()
}

export async function importarItemPokeApi(idOuNome) {
  const res = await request('/mestre/pokeapi/importar-item', {
    method: 'POST',
    body: JSON.stringify({ idOuNome: String(idOuNome).trim() }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao importar item da PokéAPI');
  }
  return res.json();
}

export async function criarItem(body) {
  const res = await request('/mestre/itens', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao criar item');
  }
  return res.json();
}

export async function atualizarItem(id, body) {
  const res = await request(`/mestre/itens/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao atualizar item');
  }
  return res.json();
}

export async function atualizarImagensItens() {
  const res = await request('/mestre/pokeapi/atualizar-imagens-itens', { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao atualizar imagens');
  }
  return res.json();
}

export async function listarSpeciesMestre(params = {}) {
  const search = new URLSearchParams()
  if (params.nome) search.set('nome', String(params.nome).trim())
  if (params.pokedexId != null && params.pokedexId !== '') search.set('pokedexId', String(params.pokedexId))
  if (params.limit != null) search.set('limit', String(params.limit))
  const q = search.toString()
  const res = await request(`/mestre/species${q ? `?${q}` : ''}`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.mensagem || 'Erro ao listar espécies')
  }
  return res.json()
}

export async function getSpeciesConfigMestre(speciesId) {
  const res = await request(`/mestre/species/${encodeURIComponent(speciesId)}/config`)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.mensagem || 'Erro ao carregar configuração da espécie')
  }
  return res.json()
}

export async function salvarSpeciesConfigMestre(speciesId, body) {
  const res = await request(`/mestre/species/${encodeURIComponent(speciesId)}/config`, {
    method: 'PUT',
    body: JSON.stringify(body || {}),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.mensagem || 'Erro ao salvar configuração da espécie')
  }
  return res.json()
}

export async function resincronizarSpeciesPokeApiMestre(speciesId) {
  const res = await request(`/mestre/species/${encodeURIComponent(speciesId)}/resincronizar-pokeapi`, {
    method: 'POST',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.mensagem || 'Erro ao resincronizar espécie')
  }
  return res.json()
}

export async function importarTodasSpeciesPokeApiMestre() {
  const res = await request('/mestre/pokeapi/importar-species-todas', {
    method: 'POST',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.mensagem || 'Erro ao importar espécies da PokéAPI')
  }
  return res.json()
}

export async function vincularSpeciesExistentesPokeApiMestre() {
  const res = await request('/mestre/pokeapi/vincular-species-existentes', {
    method: 'POST',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.mensagem || 'Erro ao vincular espécies existentes')
  }
  return res.json()
}

/** Reatribui ordem 0..n do learnset (nível → ordem PokéAPI). */
export async function normalizarOrdemLearnsetMestre(speciesId) {
  const res = await request(`/mestre/species/${encodeURIComponent(speciesId)}/learnset/normalizar-ordem`, {
    method: 'POST',
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.mensagem || 'Erro ao normalizar ordem do learnset')
  }
  return res.json()
}

export async function getPokeApiList(limit = 20, offset = 0, nome = '', pokedexId = null) {
  const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
  if (nome && nome.trim()) params.set('nome', nome.trim())
  if (pokedexId != null && pokedexId !== '') params.set('pokedexId', String(pokedexId))
  const res = await request(`/pokeapi/pokemon?${params.toString()}`)
  if (!res.ok) throw new Error('Erro ao carregar catálogo da PokéAPI')
  return res.json()
}

export async function getPokeApiPokemon(idOuNome) {
  const res = await request(`/pokeapi/pokemon/${encodeURIComponent(idOuNome)}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error('Pokémon não encontrado na PokéAPI');
    throw new Error('Erro ao buscar Pokémon');
  }
  return res.json();
}

export async function getSpeciesCatalogLocal() {
  const res = await request('/pokeapi/species-local');
  if (!res.ok) throw new Error('Erro ao carregar catálogo local de espécies');
  return res.json();
}

export async function getSpeciesCatalogLocalVersion() {
  const res = await request('/pokeapi/species-local/version');
  if (!res.ok) throw new Error('Erro ao consultar versão do catálogo local');
  const data = await res.json().catch(() => ({}));
  return data?.version || 'empty';
}
