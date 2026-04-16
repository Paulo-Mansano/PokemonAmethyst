import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  excluirPokemon,
  gerarPokemonSelvagem,
  getPokemonsSelvagens,
  atualizarEstadoPokemon,
  listarEvolucoesPossiveisPokemon,
  evoluirPokemon,
  getUsuario,
} from '../api'
import { usePlayerTarget } from '../context/PlayerTargetContext'
import { queryKeys } from '../query/queryKeys'

export default function Geracao() {
  const { playerId, readyForPlayerApi } = usePlayerTarget()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [erro, setErro] = useState('')
  const [gerando, setGerando] = useState(false)
  const [speciesBusca, setSpeciesBusca] = useState('')
  const [nivel, setNivel] = useState(5)
  const [gerado, setGerado] = useState(null)
  const [evoluindoId, setEvoluindoId] = useState(null)
  const usuarioQuery = useQuery({
    queryKey: queryKeys.auth.usuario,
    queryFn: getUsuario,
    staleTime: 10 * 60 * 1000,
  })
  const usuarioMestre = !!usuarioQuery.data?.mestre
  const selvagensQuery = useQuery({
    queryKey: queryKeys.pokemonsSelvagens(playerId),
    queryFn: () => getPokemonsSelvagens(playerId),
    enabled: readyForPlayerApi,
    staleTime: 60 * 1000,
  })
  const selvagens = selvagensQuery.data || []

  const onGerar = async () => {
    setGerando(true)
    setErro('')
    try {
      const pokemon = await gerarPokemonSelvagem({
        idOuNome: speciesBusca?.trim() ? speciesBusca.trim() : null,
        nivel: Number(nivel) || 5,
      }, playerId)
      setGerado(pokemon)
      queryClient.setQueryData(queryKeys.pokemonsSelvagens(playerId), (prev = []) =>
        [pokemon, ...prev.filter((p) => p.id !== pokemon.id)]
      )
      queryClient.setQueryData(queryKeys.pokemons(playerId), (prev = []) => {
        const lista = Array.isArray(prev) ? prev : []
        if (lista.some((p) => p.id === pokemon.id)) {
          return lista.map((p) => (p.id === pokemon.id ? pokemon : p))
        }
        return [pokemon, ...lista]
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.perfil(playerId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pokemons(playerId) }),
      ])
    } catch (e) {
      setErro(e.message || 'Erro ao gerar Pokémon')
    } finally {
      setGerando(false)
    }
  }

  const enviarParaBatalha = async (pokemon) => {
    try {
      const atualizado = await atualizarEstadoPokemon(pokemon.id, 'EM_BATALHA', playerId)
      queryClient.setQueryData(queryKeys.pokemonsSelvagens(playerId), (prev = []) =>
        (Array.isArray(prev) ? prev : []).map((p) => (p.id === atualizado.id ? atualizado : p))
      )
      queryClient.setQueryData(queryKeys.pokemons(playerId), (prev = []) =>
        (Array.isArray(prev) ? prev : []).map((p) => (p.id === atualizado.id ? atualizado : p))
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pokemonsSelvagens(playerId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pokemons(playerId) }),
      ])
      localStorage.setItem('battleDefensorId', pokemon.id)
      localStorage.setItem('capturePokemonId', pokemon.id)
      navigate('/batalha')
    } catch (e) {
      setErro(e.message || 'Erro ao enviar para batalha')
    }
  }

  const enviarParaCaptura = async (pokemon) => {
    try {
      const atualizado = await atualizarEstadoPokemon(pokemon.id, 'CAPTURAVEL', playerId)
      queryClient.setQueryData(queryKeys.pokemonsSelvagens(playerId), (prev = []) =>
        (Array.isArray(prev) ? prev : []).map((p) => (p.id === atualizado.id ? atualizado : p))
      )
      queryClient.setQueryData(queryKeys.pokemons(playerId), (prev = []) =>
        (Array.isArray(prev) ? prev : []).map((p) => (p.id === atualizado.id ? atualizado : p))
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pokemonsSelvagens(playerId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pokemons(playerId) }),
      ])
      localStorage.setItem('capturePokemonId', pokemon.id)
      navigate('/captura')
    } catch (e) {
      setErro(e.message || 'Erro ao enviar para captura')
    }
  }

  const salvarParaDepois = async (pokemon) => {
    try {
      const atualizado = await atualizarEstadoPokemon(pokemon.id, 'ATIVO', playerId)
      queryClient.setQueryData(queryKeys.pokemonsSelvagens(playerId), (prev = []) =>
        (Array.isArray(prev) ? prev : []).map((p) => (p.id === atualizado.id ? atualizado : p))
      )
      queryClient.setQueryData(queryKeys.pokemons(playerId), (prev = []) =>
        (Array.isArray(prev) ? prev : []).map((p) => (p.id === atualizado.id ? atualizado : p))
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pokemonsSelvagens(playerId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pokemons(playerId) }),
      ])
    } catch (e) {
      setErro(e.message || 'Erro ao salvar Pokémon')
    }
  }

  const deletar = async (pokemon) => {
    try {
      await excluirPokemon(pokemon.id, playerId)
      if (gerado?.id === pokemon.id) {
        setGerado(null)
      }
      queryClient.setQueryData(queryKeys.pokemonsSelvagens(playerId), (prev = []) =>
        prev.filter((p) => p.id !== pokemon.id)
      )
      queryClient.setQueryData(queryKeys.pokemons(playerId), (prev = []) =>
        (Array.isArray(prev) ? prev : []).filter((p) => p.id !== pokemon.id)
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.perfil(playerId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pokemons(playerId) }),
      ])
    } catch (e) {
      setErro(e.message || 'Erro ao deletar Pokémon')
    }
  }

  const handleEvoluir = async (pokemon) => {
    if (!pokemon?.id) return
    setErro('')
    setEvoluindoId(pokemon.id)
    try {
      const opcoes = await listarEvolucoesPossiveisPokemon(pokemon.id, playerId)
      if (!Array.isArray(opcoes) || opcoes.length === 0) {
        throw new Error('Não há evolução configurada localmente para este Pokémon.')
      }
      const disponiveis = opcoes.filter((o) => o.disponivelAgora)
      if (disponiveis.length === 0) {
        const bloqueada = opcoes.find((o) => o.minLevel)
        if (bloqueada?.minLevel) {
          throw new Error(`Evolução indisponível no momento. Nível mínimo: ${bloqueada.minLevel}.`)
        }
        throw new Error('Evolução indisponível no momento.')
      }
      const escolhida = disponiveis[0]
      const atualizado = await evoluirPokemon(pokemon.id, escolhida.pokedexId, playerId)
      if (gerado?.id === pokemon.id) setGerado(atualizado)
      queryClient.setQueryData(queryKeys.pokemonsSelvagens(playerId), (prev = []) =>
        (Array.isArray(prev) ? prev : []).map((p) => (p.id === atualizado.id ? atualizado : p))
      )
      queryClient.setQueryData(queryKeys.pokemons(playerId), (prev = []) =>
        (Array.isArray(prev) ? prev : []).map((p) => (p.id === atualizado.id ? atualizado : p))
      )
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pokemonsSelvagens(playerId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pokemons(playerId) }),
      ])
    } catch (e) {
      setErro(e.message || 'Erro ao evoluir Pokémon')
    } finally {
      setEvoluindoId(null)
    }
  }

  const renderPokemon = (pokemon) => (
    <div className="card batalha-card" key={pokemon.id}>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
        {pokemon.imagemUrl ? (
          <img src={pokemon.imagemUrl} alt={pokemon.apelido || pokemon.especie} style={{ width: 64, height: 64, objectFit: 'contain' }} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--border)' }} />
        )}
        <div>
          <h3 style={{ marginTop: 0, marginBottom: '0.25rem' }}>{pokemon.apelido || pokemon.especie}</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            #{pokemon.pokedexId} | Nível {pokemon.nivel} | {pokemon.tipoPrimario}{pokemon.tipoSecundario ? `/${pokemon.tipoSecundario}` : ''}
          </p>
        </div>
      </div>
      <p style={{ margin: '0 0 0.5rem', color: 'var(--text-muted)' }}>
        HP {pokemon.hpAtual}/{pokemon.hpMaximo} | Estado: {pokemon.estado || 'ATIVO'} | Origem: {pokemon.origem || 'SELVAGEM'}
      </p>
      <p style={{ margin: '0 0 0.5rem', color: 'var(--text-muted)' }}>
        Habilidade: {pokemon.habilidadeAtivaNome || '—'}
      </p>
      <p style={{ margin: '0 0 0.5rem', color: 'var(--text-muted)' }}>
        Classe IV: {pokemon.ivClass || '—'} | Pontos: {pokemon.pontosDistribuicaoDisponiveis ?? 0} | Base HP/ST: {pokemon.hpBaseRng ?? 0}/{pokemon.staminaBaseRng ?? 0}
      </p>
      <p style={{ margin: '0 0 0.5rem', color: 'var(--text-muted)' }}>
        Atributos: ATK {pokemon.atrAtaque ?? 0} | DEF {pokemon.atrDefesa ?? 0} | SPA {pokemon.atrAtaqueEspecial ?? 0} | SPD {pokemon.atrDefesaEspecial ?? 0} | SPE {pokemon.atrSpeed ?? 0} | HP {pokemon.atrHp ?? 0} | ST {pokemon.atrStamina ?? 0}
      </p>
      {usuarioMestre && (
        <p style={{ margin: '0 0 0.5rem', color: (pokemon.pontosDistribuicaoDisponiveis ?? 0) < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
          Mestre: Técnica {pokemon.atrTecnica ?? pokemon.tecnica ?? 0} | Respeito {pokemon.atrRespeito ?? pokemon.respeito ?? 0}
        </p>
      )}
      <p style={{ margin: '0 0 0.75rem', color: 'var(--text-muted)' }}>
        Ataques: {(pokemon.movimentosConhecidos || []).map((m) => m.nome).join(', ') || '—'}
      </p>
      <div className="battle-actions">
        <button className="btn btn-primary" onClick={() => enviarParaBatalha(pokemon)}>Enviar para batalha</button>
        <button className="btn btn-secondary" onClick={() => enviarParaCaptura(pokemon)}>Enviar para captura</button>
        <button className="btn btn-secondary" onClick={() => salvarParaDepois(pokemon)}>Salvar para depois</button>
        <button className="btn btn-secondary" disabled={evoluindoId === pokemon.id} onClick={() => handleEvoluir(pokemon)}>
          {evoluindoId === pokemon.id ? 'Evoluindo...' : 'Evoluir'}
        </button>
        <button className="btn btn-danger" onClick={() => deletar(pokemon)}>Deletar</button>
      </div>
    </div>
  )

  if (!readyForPlayerApi) {
    return (
      <div className="container container--wide">
        <p>Carregando…</p>
      </div>
    )
  }

  return (
    <div className="container container--wide">
      <h1>Geração de Pokémon</h1>
      <div className="card">
        <div className="grid-2">
          <div className="form-group">
            <label>Nome ou Pokédex ID (opcional)</label>
            <input type="text" value={speciesBusca} onChange={(e) => setSpeciesBusca(e.target.value)} placeholder="Ex.: Pikachu ou 25" />
          </div>
          <div className="form-group">
            <label>Level</label>
            <input type="number" min="1" max="100" value={nivel} onChange={(e) => setNivel(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" disabled={gerando} onClick={onGerar}>
          {gerando ? 'Gerando...' : 'Gerar Pokémon'}
        </button>
      </div>

      {erro && <p style={{ color: 'var(--danger)' }}>{erro}</p>}

      {gerado && (
        <section>
          <h2>Pokémon gerado agora</h2>
          {renderPokemon(gerado)}
        </section>
      )}

      <section>
        <h2>Selvagens salvos</h2>
        {selvagensQuery.isLoading ? <p>Carregando...</p> : null}
        {!selvagensQuery.isLoading && selvagens.length === 0 ? <p>Nenhum Pokémon selvagem salvo.</p> : null}
        <div className="battle-grid">
          {selvagens.map(renderPokemon)}
        </div>
      </section>
    </div>
  )
}
