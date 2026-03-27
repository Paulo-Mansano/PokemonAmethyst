import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  aplicarDanoBatalha,
  atualizarEstadoPokemon,
  calcularDanoBatalha,
  getPokemons,
} from '../api'
import { usePlayerTarget } from '../context/PlayerTargetContext'
import { queryKeys } from '../query/queryKeys'

const TIPO_OPCOES = [0, 0.25, 0.5, 1, 2, 4]

function parsePowerFromMove(movimento) {
  if (!movimento) return 40
  const fromDado = String(movimento.dadoDeDano || '').match(/\d+/)
  if (fromDado) {
    return Number(fromDado[0])
  }
  return 40
}

export default function Batalha() {
  const { playerId, readyForPlayerApi } = usePlayerTarget()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [erro, setErro] = useState('')
  const [atacanteId, setAtacanteId] = useState(localStorage.getItem('battleAtacanteId') || '')
  const [defensorId, setDefensorId] = useState(localStorage.getItem('battleDefensorId') || '')
  const [movimentoId, setMovimentoId] = useState('')
  const [poder, setPoder] = useState(40)

  const [stabMultiplier, setStabMultiplier] = useState(1.5)
  const [typeMultiplier, setTypeMultiplier] = useState(1)
  const [critico, setCritico] = useState(false)
  const [queimado, setQueimado] = useState(false)
  const [otherMultiplier, setOtherMultiplier] = useState(1)
  const [randomMin, setRandomMin] = useState(0.85)
  const [randomMax, setRandomMax] = useState(1.0)
  const [randomValue, setRandomValue] = useState(1.0)

  const [resultado, setResultado] = useState(null)
  const [historico, setHistorico] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('battleHistory') || '[]')
    } catch {
      return []
    }
  })

  const pokemonsQuery = useQuery({
    queryKey: queryKeys.pokemons(playerId),
    queryFn: () => getPokemons(playerId),
    enabled: readyForPlayerApi,
    staleTime: 60 * 1000,
  })
  const pokemons = pokemonsQuery.data || []

  useEffect(() => {
    localStorage.setItem('battleHistory', JSON.stringify(historico))
  }, [historico])

  useEffect(() => {
    if (atacanteId) localStorage.setItem('battleAtacanteId', atacanteId)
  }, [atacanteId])

  useEffect(() => {
    if (defensorId) localStorage.setItem('battleDefensorId', defensorId)
  }, [defensorId])

  const atacante = useMemo(() => pokemons.find((p) => p.id === atacanteId) || null, [pokemons, atacanteId])
  const defensor = useMemo(() => pokemons.find((p) => p.id === defensorId) || null, [pokemons, defensorId])
  const movimento = useMemo(() => (atacante?.movimentosConhecidos || []).find((m) => m.id === movimentoId) || null, [atacante, movimentoId])

  useEffect(() => {
    if (!atacante) {
      setMovimentoId('')
      return
    }
    if (!movimentoId && atacante.movimentosConhecidos?.length) {
      const primeiro = atacante.movimentosConhecidos[0]
      setMovimentoId(primeiro.id)
      setPoder(parsePowerFromMove(primeiro))
    }
  }, [atacante, movimentoId])

  const calcular = async () => {
    if (!atacanteId || !defensorId) {
      setErro('Selecione atacante e defensor.')
      return
    }
    setErro('')
    try {
      const payload = {
        atacanteId,
        defensorId,
        poder: Number(poder) || 1,
        categoria: movimento?.categoria || 'FISICO',
        movimentoNome: movimento?.nome || 'Golpe manual',
        movimentoTipo: movimento?.tipo || 'NORMAL',
        stabMultiplier: Number(stabMultiplier) || 1,
        typeMultiplier: Number(typeMultiplier) || 1,
        critico,
        queimado,
        otherMultiplier: Number(otherMultiplier) || 1,
        randomMin: Number(randomMin) || 0.85,
        randomMax: Number(randomMax) || 1,
        randomValue: Number(randomValue) || 1,
      }
      const data = await calcularDanoBatalha(payload, playerId)
      setResultado(data)
    } catch (e) {
      setErro(e.message || 'Erro ao calcular dano')
    }
  }

  const aplicarDano = async () => {
    if (!resultado) return
    setErro('')
    try {
      const defensorAtualizado = await aplicarDanoBatalha({
        atacanteId,
        defensorId,
        danoAplicado: resultado.danoAplicado,
      }, playerId)
      const registro = {
        id: `${Date.now()}`,
        atacante: atacante?.apelido || atacante?.especie,
        defensor: defensor?.apelido || defensor?.especie,
        movimento: movimento?.nome || 'Golpe manual',
        dano: resultado.danoAplicado,
      }
      setHistorico((prev) => [registro, ...prev].slice(0, 30))
      queryClient.setQueryData(queryKeys.pokemons(playerId), (prev = []) =>
        prev.map((p) => (p.id === defensorAtualizado.id ? defensorAtualizado : p))
      )
      queryClient.invalidateQueries({ queryKey: queryKeys.perfil(playerId) })
    } catch (e) {
      setErro(e.message || 'Erro ao aplicar dano')
    }
  }

  const gerarRandom = () => {
    const min = Math.min(Number(randomMin) || 0.85, Number(randomMax) || 1)
    const max = Math.max(Number(randomMin) || 0.85, Number(randomMax) || 1)
    const value = Math.random() * (max - min) + min
    setRandomValue(Number(value.toFixed(4)))
  }

  const inverter = () => {
    const a = atacanteId
    setAtacanteId(defensorId)
    setDefensorId(a)
    setResultado(null)
  }

  const irParaCaptura = async () => {
    if (!defensorId) return
    try {
      await atualizarEstadoPokemon(defensorId, 'CAPTURAVEL', playerId)
      localStorage.setItem('capturePokemonId', defensorId)
      navigate('/captura')
    } catch (e) {
      setErro(e.message || 'Erro ao enviar para captura')
    }
  }

  const encerrarBatalha = async () => {
    try {
      if (atacanteId) await atualizarEstadoPokemon(atacanteId, 'ATIVO', playerId)
      if (defensorId) await atualizarEstadoPokemon(defensorId, 'ATIVO', playerId)
      queryClient.invalidateQueries({ queryKey: queryKeys.pokemons(playerId) })
      setResultado(null)
    } catch (e) {
      setErro(e.message || 'Erro ao encerrar batalha')
    }
  }

  const resetarBatalha = () => {
    setResultado(null)
    setHistorico([])
    setMovimentoId('')
    localStorage.removeItem('battleHistory')
  }

  if (!readyForPlayerApi) {
    return (
      <div className="container container--wide">
        <h1>Batalha</h1>
        <p>Carregando…</p>
      </div>
    )
  }

  return (
    <div className="container container--wide">
      <h1>Batalha</h1>
      {erro && <p style={{ color: 'var(--danger)' }}>{erro}</p>}
      {pokemonsQuery.isLoading ? <p>Carregando...</p> : null}

      <div className="card">
        <div className="battle-selectors">
          <div className="form-group">
            <label>Atacante</label>
            <select value={atacanteId} onChange={(e) => setAtacanteId(e.target.value)}>
              <option value="">Selecione</option>
              {pokemons.map((p) => (
                <option value={p.id} key={p.id}>{p.apelido || p.especie} (Lv {p.nivel})</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Defensor</label>
            <select value={defensorId} onChange={(e) => setDefensorId(e.target.value)}>
              <option value="">Selecione</option>
              {pokemons.map((p) => (
                <option value={p.id} key={p.id}>{p.apelido || p.especie} (Lv {p.nivel})</option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={inverter}>Trocar atacante/defensor</button>
      </div>

      <div className="battle-grid">
        <div className="card batalha-card">
          <h3>Atacante</h3>
          {atacante ? (
            <>
              <p>{atacante.apelido || atacante.especie} - Lv {atacante.nivel}</p>
              <p style={{ color: 'var(--text-muted)' }}>Atk: {atacante.ataque} | Sp.Atk: {atacante.ataqueEspecial}</p>
              <div className="form-group">
                <label>Golpe</label>
                <select value={movimentoId} onChange={(e) => {
                  setMovimentoId(e.target.value)
                  const selected = atacante.movimentosConhecidos?.find((m) => m.id === e.target.value)
                  setPoder(parsePowerFromMove(selected))
                }}>
                  <option value="">Golpe manual</option>
                  {(atacante.movimentosConhecidos || []).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} ({m.tipo}/{m.categoria || 'FISICO'})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Poder do golpe</label>
                <input type="number" min="1" value={poder} onChange={(e) => setPoder(e.target.value)} />
              </div>
            </>
          ) : <p>Selecione um atacante.</p>}
        </div>

        <div className="card batalha-card">
          <h3>Defensor</h3>
          {defensor ? (
            <>
              <p>{defensor.apelido || defensor.especie} - Lv {defensor.nivel}</p>
              <p style={{ color: 'var(--text-muted)' }}>
                Def: {defensor.defesa} | Sp.Def: {defensor.defesaEspecial}
              </p>
              <p style={{ color: 'var(--text-muted)' }}>
                HP: {defensor.hpAtual}/{defensor.hpMaximo}
              </p>
              <p style={{ color: 'var(--text-muted)' }}>
                Tipos: {defensor.tipoPrimario}{defensor.tipoSecundario ? `/${defensor.tipoSecundario}` : ''}
              </p>
            </>
          ) : <p>Selecione um defensor.</p>}
        </div>
      </div>

      <div className="card">
        <h3>Modificadores (Gen 5+)</h3>
        <div className="battle-mod-grid">
          <div className="form-group">
            <label>STAB</label>
            <input type="number" step="0.01" value={stabMultiplier} onChange={(e) => setStabMultiplier(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Efetividade</label>
            <select value={typeMultiplier} onChange={(e) => setTypeMultiplier(Number(e.target.value))}>
              {TIPO_OPCOES.map((opt) => <option value={opt} key={opt}>{opt}x</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Multiplicador custom</label>
            <input type="number" step="0.01" value={otherMultiplier} onChange={(e) => setOtherMultiplier(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Random mínimo</label>
            <input type="number" step="0.01" value={randomMin} onChange={(e) => setRandomMin(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Random máximo</label>
            <input type="number" step="0.01" value={randomMax} onChange={(e) => setRandomMax(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Random aplicado</label>
            <input type="number" step="0.0001" value={randomValue} onChange={(e) => setRandomValue(e.target.value)} />
          </div>
        </div>
        <div className="battle-actions">
          <label><input type="checkbox" checked={critico} onChange={(e) => setCritico(e.target.checked)} /> Crítico (1.5x)</label>
          <label><input type="checkbox" checked={queimado} onChange={(e) => setQueimado(e.target.checked)} /> Burn (0.5x físico)</label>
          <button className="btn btn-secondary" onClick={gerarRandom}>Gerar valor random</button>
          <button className="btn btn-primary" onClick={calcular}>Calcular dano</button>
          <button className="btn btn-primary" disabled={!resultado} onClick={aplicarDano}>Aplicar dano</button>
        </div>
      </div>

      {resultado && (
        <div className="card">
          <h3>Saída de dano</h3>
          <p>Dano mínimo: <strong>{resultado.danoMinimo}</strong></p>
          <p>Dano máximo: <strong>{resultado.danoMaximo}</strong></p>
          <p>Dano aplicado: <strong>{resultado.danoAplicado}</strong></p>
          <p style={{ color: 'var(--text-muted)' }}>{resultado.formula}</p>
          <div className="battle-breakdown">
            {Object.entries(resultado.multiplicadores || {}).map(([key, value]) => (
              <span key={key}>{key}: {Number(value).toFixed(4)}</span>
            ))}
          </div>
          <div className="battle-actions" style={{ marginTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={irParaCaptura}>Ir para captura</button>
            <button className="btn btn-secondary" onClick={() => setResultado(null)}>Continuar batalha</button>
            <button className="btn btn-secondary" onClick={encerrarBatalha}>Encerrar batalha</button>
            <button className="btn btn-danger" onClick={resetarBatalha}>Resetar batalha</button>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Histórico de golpes</h3>
        {historico.length === 0 ? <p>Nenhum golpe aplicado.</p> : (
          <ul className="battle-history">
            {historico.map((h) => (
              <li key={h.id}>
                {h.atacante} usou {h.movimento} em {h.defensor}: {h.dano} de dano
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
