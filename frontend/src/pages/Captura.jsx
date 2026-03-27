import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getPokemons, tentarCapturaPokemon, atualizarEstadoPokemon } from '../api'
import { usePlayerTarget } from '../context/PlayerTargetContext'
import { queryKeys } from '../query/queryKeys'

export default function Captura() {
  const { playerId, readyForPlayerApi } = usePlayerTarget()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [pokemonId, setPokemonId] = useState(localStorage.getItem('capturePokemonId') || '')

  const pokemonsQuery = useQuery({
    queryKey: queryKeys.pokemons(playerId),
    queryFn: () => getPokemons(playerId),
    enabled: readyForPlayerApi,
    staleTime: 60 * 1000,
  })
  const pokemons = pokemonsQuery.data || []

  useEffect(() => {
    if (pokemonId) {
      localStorage.setItem('capturePokemonId', pokemonId)
    }
  }, [pokemonId])

  const capturaveis = useMemo(
    () => pokemons.filter((p) => p.origem === 'SELVAGEM' || p.estado === 'CAPTURAVEL' || p.estado === 'DERROTADO'),
    [pokemons]
  )
  const pokemon = useMemo(() => pokemons.find((p) => p.id === pokemonId) || null, [pokemons, pokemonId])

  const tentar = () => {
    setMensagem('Role o dado da sua mesa e escolha Falhou ou Sucesso.')
  }

  const resolverCaptura = async (sucesso) => {
    if (!pokemonId) return
    setErro('')
    try {
      const resposta = await tentarCapturaPokemon(pokemonId, sucesso, playerId)
      const atualizado = resposta.pokemon
      queryClient.setQueryData(queryKeys.pokemons(playerId), (prev = []) =>
        prev.map((p) => (p.id === atualizado.id ? atualizado : p))
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.perfil(playerId) })
      if (sucesso) {
        setMensagem('Captura bem-sucedida. Pokémon agora pertence ao treinador.')
      } else {
        setMensagem('A captura falhou. Pokémon permanece disponível.')
      }
    } catch (e) {
      setErro(e.message || 'Erro ao resolver captura')
    }
  }

  const voltarParaBatalha = async () => {
    if (!pokemonId) return
    try {
      await atualizarEstadoPokemon(pokemonId, 'EM_BATALHA', playerId)
      queryClient.invalidateQueries({ queryKey: queryKeys.pokemons(playerId) })
      localStorage.setItem('battleDefensorId', pokemonId)
      navigate('/batalha')
    } catch (e) {
      setErro(e.message || 'Erro ao voltar para batalha')
    }
  }

  if (!readyForPlayerApi) {
    return (
      <div className="container container--wide">
        <h1>Captura</h1>
        <p>Carregando…</p>
      </div>
    )
  }

  return (
    <div className="container container--wide">
      <h1>Captura</h1>
      {erro && <p style={{ color: 'var(--danger)' }}>{erro}</p>}
      {mensagem && <p style={{ color: 'var(--accent)' }}>{mensagem}</p>}

      <div className="card">
        <div className="form-group">
          <label>Pokémon para captura</label>
          <select value={pokemonId} onChange={(e) => setPokemonId(e.target.value)}>
            <option value="">Selecione</option>
            {capturaveis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.apelido || p.especie} (HP {p.hpAtual}/{p.hpMaximo})
              </option>
            ))}
          </select>
        </div>
      </div>

      {pokemonsQuery.isLoading ? <p>Carregando...</p> : null}

      {pokemon && (
        <div className="card batalha-card">
          <h3>{pokemon.apelido || pokemon.especie}</h3>
          <p>Nível {pokemon.nivel}</p>
          <p>HP atual/máximo: {pokemon.hpAtual}/{pokemon.hpMaximo}</p>
          <p>Status: {(pokemon.statusAtuais || []).join(', ') || 'Nenhum'}</p>
          <p>Origem: {pokemon.origem} | Estado: {pokemon.estado}</p>
          <div className="battle-actions">
            <button className="btn btn-primary" onClick={tentar}>Tentar captura</button>
            <button className="btn btn-secondary" onClick={() => resolverCaptura(false)}>Falhou</button>
            <button className="btn btn-primary" onClick={() => resolverCaptura(true)}>Sucesso</button>
            <button className="btn btn-secondary" onClick={voltarParaBatalha}>Voltar para batalha</button>
          </div>
        </div>
      )}
    </div>
  )
}
