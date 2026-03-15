const BASE = '/api';

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

export async function getMeuPerfil() {
  const res = await request('/perfis/meu');
  if (!res.ok) {
    if (res.status === 404) return null;
    if (res.status === 401 || res.status === 403) {
      throw new Error('Sessão inválida ou expirada. Faça login novamente.');
    }
    throw new Error('Erro ao carregar perfil');
  }
  return res.json();
}

export async function salvarPerfil(body) {
  const res = await request('/perfis/meu', {
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

export async function getPokemons() {
  const res = await request('/perfis/meu/pokemons');
  if (!res.ok) {
    if (res.status === 404) throw new Error(MSG_SEM_PERFIL);
    throw new Error('Erro ao carregar Pokémon');
  }
  return res.json();
}

export async function criarPokemonVazio() {
  const res = await request('/perfis/meu/pokemons/vazio', { method: 'POST' });
  if (!res.ok) {
    if (res.status === 404) throw new Error(MSG_SEM_PERFIL);
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao criar Pokémon');
  }
  return res.json();
}

export async function criarPokemon(body) {
  const res = await request('/perfis/meu/pokemons', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error(MSG_SEM_PERFIL);
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao criar Pokémon');
  }
  return res.json();
}

export async function getPokemon(id) {
  const res = await request(`/perfis/meu/pokemons/${id}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error(MSG_SEM_PERFIL);
    throw new Error('Erro ao carregar Pokémon');
  }
  return res.json();
}

export async function atualizarPokemon(id, body) {
  const res = await request(`/perfis/meu/pokemons/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao atualizar Pokémon');
  }
  return res.json();
}

export async function colocarNoTime(id, ordem = 1) {
  const res = await request(`/perfis/meu/pokemons/${id}/time`, {
    method: 'PUT',
    body: JSON.stringify({ ordem }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao colocar no time');
  }
  return res.json();
}

export async function removerDoTime(id) {
  const res = await request(`/perfis/meu/pokemons/${id}/time`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao remover do time');
  }
  return res.json();
}

export async function excluirPokemon(id) {
  const res = await request(`/perfis/meu/pokemons/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao excluir Pokémon');
  }
}

export async function getMochila() {
  const res = await request('/perfis/meu/mochila');
  if (!res.ok) throw new Error('Erro ao carregar mochila');
  return res.json();
}

export async function adicionarItemMochila(itemId, quantidade) {
  const res = await request('/perfis/meu/mochila/itens', {
    method: 'PUT',
    body: JSON.stringify({ itemId, quantidade }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.mensagem || 'Erro ao adicionar item');
  }
  return res.json();
}

export async function removerItemMochila(itemId, quantidade = 1) {
  const res = await request(`/perfis/meu/mochila/itens/${itemId}?quantidade=${quantidade}`, {
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
