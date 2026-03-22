import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  excluirPokemon,
  gerarPokemonSelvagem,
  getPokemonsSelvagens,
  atualizarEstadoPokemon,
} from '../api'
import { usePlayerTarget } from '../context/PlayerTargetContext'

export default function Geracao() {
  const { playerId, readyForPlayerApi } = usePlayerTarget()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [gerando, setGerando] = useState(false)
  const [pokedexId, setPokedexId] = useState('')
  const [nivel, setNivel] = useState(5)
  const [gerado, setGerado] = useState(null)
  const [selvagens, setSelvagens] = useState([])

  const carregar = async () => {
    if (!readyForPlayerApi) return
    setLoading(true)
    setErro('')
    try {
      const lista = await getPokemonsSelvagens(playerId)
      setSelvagens(lista || [])
    } catch (e) {
      setErro(e.message || 'Erro ao carregar Pokémon selvagens')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [playerId, readyForPlayerApi])

  const onGerar = async () => {
    setGerando(true)
    setErro('')
    try {
      const pokemon = await gerarPokemonSelvagem({
        pokedexId: pokedexId ? Number(pokedexId) : null,
        nivel: Number(nivel) || 5,
      }, playerId)
      setGerado(pokemon)
      setSelvagens((prev) => [pokemon, ...prev.filter((p) => p.id !== pokemon.id)])
    } catch (e) {
      setErro(e.message || 'Erro ao gerar Pokémon')
    } finally {
      setGerando(false)
    }
  }

  const enviarParaBatalha = async (pokemon) => {
    try {
      await atualizarEstadoPokemon(pokemon.id, 'EM_BATALHA', playerId)
      localStorage.setItem('battleDefensorId', pokemon.id)
      localStorage.setItem('capturePokemonId', pokemon.id)
      navigate('/batalha')
    } catch (e) {
      setErro(e.message || 'Erro ao enviar para batalha')
    }
  }

  const enviarParaCaptura = async (pokemon) => {
    try {
      await atualizarEstadoPokemon(pokemon.id, 'CAPTURAVEL', playerId)
      localStorage.setItem('capturePokemonId', pokemon.id)
      navigate('/captura')
    } catch (e) {
      setErro(e.message || 'Erro ao enviar para captura')
    }
  }

  const salvarParaDepois = async (pokemon) => {
    try {
      await atualizarEstadoPokemon(pokemon.id, 'ATIVO', playerId)
      await carregar()
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
      setSelvagens((prev) => prev.filter((p) => p.id !== pokemon.id))
    } catch (e) {
      setErro(e.message || 'Erro ao deletar Pokémon')
    }
  }

  const renderPokemon = (pokemon) => (
    <div className="card batalha-card" key={pokemon.id}>
      <h3 style={{ marginTop: 0 }}>{pokemon.apelido || pokemon.especie}</h3>
      <p style={{ margin: '0 0 0.25rem' }}>Nível {pokemon.nivel}</p>
      <p style={{ margin: '0 0 0.5rem', color: 'var(--text-muted)' }}>
        HP {pokemon.hpAtual}/{pokemon.hpMaximo} | Estado: {pokemon.estado || 'ATIVO'}
      </p>
      <div className="battle-actions">
        <button className="btn btn-primary" onClick={() => enviarParaBatalha(pokemon)}>Enviar para batalha</button>
        <button className="btn btn-secondary" onClick={() => enviarParaCaptura(pokemon)}>Enviar para captura</button>
        <button className="btn btn-secondary" onClick={() => salvarParaDepois(pokemon)}>Salvar para depois</button>
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
            <label>Pokédex ID (opcional)</label>
            <input type="number" min="1" value={pokedexId} onChange={(e) => setPokedexId(e.target.value)} />
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
        {loading ? <p>Carregando...</p> : null}
        {!loading && selvagens.length === 0 ? <p>Nenhum Pokémon selvagem salvo.</p> : null}
        <div className="battle-grid">
          {selvagens.map(renderPokemon)}
        </div>
      </section>
    </div>
  )
}
