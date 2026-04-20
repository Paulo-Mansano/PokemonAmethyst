import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMeuPerfil, getPokemons, tentarCapturaPokemon } from '../api'
import { usePlayerTarget } from '../context/PlayerTargetContext'
import { queryKeys } from '../query/queryKeys'

const STATUS_OPTIONS = [
  { value: 'NENHUM', label: 'Nenhum' },
  { value: 'DORMINDO', label: 'Dormindo' },
  { value: 'CONGELADO', label: 'Congelado' },
  { value: 'PARALISADO', label: 'Paralisado' },
  { value: 'QUEIMANDO', label: 'Queimando' },
  { value: 'ENVENENADO', label: 'Envenenado' },
]

const STATUS_BONUS_MAP = {
  NENHUM: 0,
  DORMINDO: 2,
  CONGELADO: 2,
  PARALISADO: 2,
  QUEIMANDO: 2,
  ENVENENADO: 2,
}

const POKEBOLAS_CONTENCAO = [
  'POKE BOLA',
  'GREAT BALL',
  'ULTRA BALL',
  'NET BALL',
  'DUSK BALL',
  'HEAL BALL',
  'SELO DE LIGACAO',
  'MASTER BALL',
]

function detectarStatusInicial(statusAtuais) {
  const lista = Array.isArray(statusAtuais) ? statusAtuais : []
  const normalizado = lista.map((s) => String(s || '').toUpperCase())
  if (normalizado.includes('DORMINDO')) return 'DORMINDO'
  if (normalizado.includes('CONGELADO')) return 'CONGELADO'
  if (normalizado.includes('PARALISADO')) return 'PARALISADO'
  if (normalizado.includes('QUEIMADO') || normalizado.includes('QUEIMANDO')) return 'QUEIMANDO'
  if (normalizado.includes('ENVENENADO')) return 'ENVENENADO'
  return 'NENHUM'
}

function toInt(value, fallback = 0) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.trunc(n)
}

function calcularTentativaCaptura(input, rolarD20 = () => Math.floor(Math.random() * 20) + 1) {
  const nivelPokemon = Math.max(1, toInt(input.nivelPokemon, 1))
  const respeitoPokemon = Math.max(0, toInt(input.respeitoPokemon, 0))
  const hpRestantePokemon = Math.max(0, toInt(input.hpRestantePokemon, 0))
  const cdBaseCalculada = respeitoPokemon + nivelPokemon + hpRestantePokemon
  const cdManual = Math.max(0, toInt(input.cdBaseManual, cdBaseCalculada))
  const nivelTreinador = Math.max(1, toInt(input.nivelTreinador, 1))
  const dominioTreinador = Math.max(1, toInt(input.dominioTreinador, 1))
  const respeitoTreinador = Math.max(1, toInt(input.respeitoTreinador, 1))
  const bonusTreinador = toInt(input.bonusTreinador, 0)
  const vinculoTreinador = toInt(input.vinculoTreinador, 0)
  const bonusManualMestre = bonusTreinador + vinculoTreinador
  const status = String(input.status || 'NENHUM').toUpperCase()
  const bonusStatus = STATUS_BONUS_MAP[status] ?? 0

  const diferencaNivel = nivelPokemon > nivelTreinador ? (nivelPokemon - nivelTreinador) : 0
  const dominioEfetivo = Math.max(1, dominioTreinador - diferencaNivel)
  const respeitoEfetivo = Math.max(1, respeitoTreinador - diferencaNivel)

  const dificuldade = cdManual
  const d20 = rolarD20()
  const rolagemTotal = d20 + dominioEfetivo + respeitoEfetivo + bonusManualMestre + bonusStatus
  const sucesso = rolagemTotal >= dificuldade

  return {
    sucesso,
    dificuldade,
    rolagemTotal,
    d20,
    bonusStatus,
    bonusManualMestre,
    dominioOriginal: dominioTreinador,
    respeitoOriginal: respeitoTreinador,
    dominioEfetivo,
    respeitoEfetivo,
    diferencaNivel,
    cdBaseCalculada,
    bonusTreinador,
    vinculoTreinador,
    status,
  }
}

function NumericStepper({ label, min = 0, value, onChange, className = '' }) {
  const valorSeguro = Number.isFinite(Number(value)) ? Number(value) : 0
  return (
    <label className={`capture-v3-stepper ${className}`}>
      <span className="capture-v3-stepper-label">{label}</span>
      <div className="capture-v3-stepper-control">
        <button type="button" onClick={() => onChange(Math.max(min, valorSeguro - 1))}>-</button>
        <input
          type="number"
          min={min}
          value={valorSeguro}
          onChange={(e) => onChange(Math.max(min, parseInt(e.target.value, 10) || min))}
        />
        <button type="button" onClick={() => onChange(valorSeguro + 1)}>+</button>
      </div>
    </label>
  )
}

export default function Captura() {
  const { playerId, readyForPlayerApi } = usePlayerTarget()
  const queryClient = useQueryClient()
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [pokemonId, setPokemonId] = useState(localStorage.getItem('capturePokemonId') || '')
  const [calculando, setCalculando] = useState(false)
  const [resultadoModal, setResultadoModal] = useState(null)
  const [captureForm, setCaptureForm] = useState(null)
  const [prefillId, setPrefillId] = useState('')
  const [quickRolls, setQuickRolls] = useState(100)
  const [chanceEstimada, setChanceEstimada] = useState(null)
  const [pokebolaAtiva, setPokebolaAtiva] = useState('POKE BOLA')

  const pokemonsQuery = useQuery({
    queryKey: queryKeys.pokemons(playerId),
    queryFn: () => getPokemons(playerId),
    enabled: readyForPlayerApi,
    staleTime: 60 * 1000,
  })
  const pokemons = pokemonsQuery.data || []

  const perfilQuery = useQuery({
    queryKey: queryKeys.perfil(playerId),
    queryFn: () => getMeuPerfil(playerId),
    enabled: readyForPlayerApi,
    staleTime: 60 * 1000,
  })
  const perfil = perfilQuery.data

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

  useEffect(() => {
    if (!pokemon || !perfil) return
    if (prefillId === pokemon.id) return
    const nivelPokemon = Math.max(1, Number(pokemon.nivel) || 1)
    const respeitoPokemon = Math.max(0, Number(pokemon.respeito) || 0)
    const hpRestantePokemon = Math.max(0, Number(pokemon.hpAtual) || 0)
    setCaptureForm({
      nivelPokemon,
      respeitoPokemon,
      hpRestantePokemon,
      hpMaximoPokemon: Math.max(1, Number(pokemon.hpMaximo) || 1),
      nivelTreinador: Math.max(1, Number(perfil.nivel) || 1),
      dominioTreinador: Math.max(1, Number(perfil.atributos?.dominio) || 1),
      respeitoTreinador: Math.max(1, Number(perfil.atributos?.respeito) || 1),
      vinculoTreinador: 0,
      bonusTreinador: 0,
      cdBaseManual: respeitoPokemon + nivelPokemon + hpRestantePokemon,
      tiposNetBall: '',
      ambienteDuskBall: '',
      status: detectarStatusInicial(pokemon.statusAtuais),
    })
    setChanceEstimada(null)
    setPokebolaAtiva('POKE BOLA')
    setPrefillId(pokemon.id)
  }, [pokemon, perfil, prefillId])

  const resolverCaptura = async (sucesso) => {
    if (!pokemonId) return
    const resposta = await tentarCapturaPokemon(pokemonId, sucesso, playerId)
    const atualizado = resposta.pokemon

    queryClient.setQueryData(queryKeys.pokemons(playerId), (prev = []) => {
      const lista = Array.isArray(prev) ? prev : []
      const existe = lista.some((p) => p.id === atualizado.id)
      if (!existe) return [atualizado, ...lista]
      return lista.map((p) => (p.id === atualizado.id ? atualizado : p))
    })

    queryClient.setQueryData(queryKeys.pokemonsSelvagens(playerId), (prev = []) => {
      const lista = Array.isArray(prev) ? prev : []
      if (sucesso) {
        return lista.filter((p) => p.id !== atualizado.id)
      }
      const existe = lista.some((p) => p.id === atualizado.id)
      if (!existe) return [atualizado, ...lista]
      return lista.map((p) => (p.id === atualizado.id ? atualizado : p))
    })

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.perfil(playerId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.pokemons(playerId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.pokemonsSelvagens(playerId) }),
    ])

    if (sucesso) {
      setPokemonId('')
      setPrefillId('')
      setCaptureForm(null)
      localStorage.removeItem('capturePokemonId')
      setMensagem('Captura bem-sucedida. Pokémon agora pertence ao treinador.')
      return
    }

    setMensagem('A captura falhou. Pokémon permanece disponível.')
  }

  const onChangeCampo = (campo, valor) => {
    setCaptureForm((current) => {
      if (!current) return current
      return { ...current, [campo]: valor }
    })
  }

  const tentarCapturaAutomatica = async () => {
    if (!pokemon || !captureForm || calculando) return
    setErro('')
    setMensagem('')
    setCalculando(true)
    try {
      const resultado = calcularTentativaCaptura(captureForm)
      await resolverCaptura(resultado.sucesso)
      setResultadoModal(resultado)
    } catch (e) {
      setErro(e.message || 'Erro ao resolver captura')
    } finally {
      setCalculando(false)
    }
  }

  const processarSimulacaoRapida = () => {
    if (!captureForm) return
    const total = Math.max(1, parseInt(quickRolls, 10) || 1)
    let sucessos = 0
    for (let i = 0; i < total; i += 1) {
      const r = calcularTentativaCaptura(captureForm)
      if (r.sucesso) sucessos += 1
    }
    setChanceEstimada((sucessos / total) * 100)
  }

  const cdBase = captureForm
    ? (Math.max(0, Number(captureForm.respeitoPokemon) || 0)
      + Math.max(1, Number(captureForm.nivelPokemon) || 1)
      + Math.max(0, Number(captureForm.hpRestantePokemon) || 0))
    : 0
  const cdFinal = captureForm ? Math.max(0, Number(captureForm.cdBaseManual) || cdBase) : 0
  const bonusTotalFixo = captureForm
    ? ((Number(captureForm.vinculoTreinador) || 0) + (Number(captureForm.bonusTreinador) || 0))
    : null
  const hpRestante = Math.max(0, Number(captureForm?.hpRestantePokemon) || 0)
  const hpMaximo = Math.max(1, Number(captureForm?.hpMaximoPokemon) || 1)
  const hpPercent = Math.max(0, Math.min(100, (hpRestante / hpMaximo) * 100))
  const chanceTexto = chanceEstimada == null ? 'NaN%' : `${chanceEstimada.toFixed(1)}%`

  if (!readyForPlayerApi) {
    return (
      <div className="container container--wide">
        <h1>Captura</h1>
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="container container--wide capture-v3-page">
      <header className="capture-v3-header card">
        <div className="capture-v3-header-left">
          <div className="capture-v3-logo-icon">🎲</div>
          <div>
            <h1>Simulador Amethyst</h1>
            <p>SYSTEM VERSION 3.0</p>
          </div>
        </div>
        <div className="capture-v3-header-right">
          <div className="capture-v3-metric capture-v3-metric--danger">
            <span>CHANCE EST.</span>
            <strong>{chanceTexto}</strong>
          </div>
          <div className="capture-v3-metric">
            <span>CUSTO</span>
            <strong>10 ST</strong>
          </div>
        </div>
      </header>

      {erro && <p style={{ color: 'var(--danger)' }}>{erro}</p>}
      {mensagem && <p style={{ color: 'var(--accent)' }}>{mensagem}</p>}

      <section className="capture-v3-grid">
        <aside className="capture-v3-column">
          <div className="card capture-v3-card">
            <div className="capture-v3-card-title-row">
              <h3>Treinador</h3>
              <button
                type="button"
                className="capture-v3-icon-btn"
                onClick={() => {
                  if (!perfil || !captureForm) return
                  onChangeCampo('dominioTreinador', Math.max(1, Number(perfil.atributos?.dominio) || 1))
                  onChangeCampo('respeitoTreinador', Math.max(1, Number(perfil.atributos?.respeito) || 1))
                  onChangeCampo('nivelTreinador', Math.max(1, Number(perfil.nivel) || 1))
                  onChangeCampo('vinculoTreinador', 0)
                  onChangeCampo('bonusTreinador', 0)
                }}
              >
                ↻
              </button>
            </div>
            <div className="capture-v3-trainer-grid">
              <NumericStepper
                label="DOMINIO"
                min={1}
                value={captureForm?.dominioTreinador ?? 1}
                onChange={(v) => onChangeCampo('dominioTreinador', v)}
              />
              <NumericStepper
                label="RESPEITO"
                min={1}
                value={captureForm?.respeitoTreinador ?? 1}
                onChange={(v) => onChangeCampo('respeitoTreinador', v)}
              />
              <NumericStepper
                label="VINCULO"
                min={0}
                value={captureForm?.vinculoTreinador ?? 0}
                onChange={(v) => onChangeCampo('vinculoTreinador', v)}
              />
              <NumericStepper
                label="BONUS"
                min={0}
                value={captureForm?.bonusTreinador ?? 0}
                onChange={(v) => onChangeCampo('bonusTreinador', v)}
              />
            </div>
            <div className="capture-v3-bonus-footer">
              <span>BONUS TOTAL FIXO</span>
              <strong>{bonusTotalFixo == null ? '+NaN' : `+${bonusTotalFixo}`}</strong>
            </div>
          </div>

          <div className="card capture-v3-card">
            <h3>Simulacao Rapida</h3>
            <label className="capture-v3-stepper">
              <span className="capture-v3-stepper-label">Rolagens</span>
              <input
                type="number"
                min={1}
                value={quickRolls}
                onChange={(e) => setQuickRolls(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </label>
            <button
              type="button"
              className="btn btn-secondary capture-v3-sim-btn"
              onClick={processarSimulacaoRapida}
              disabled={!captureForm}
            >
              Processar Dados
            </button>
          </div>
        </aside>

        <main className="card capture-v3-main">
          <div className="capture-v3-main-top">
            <div>
              <span className="capture-v3-kicker">IDENTIFICACAO DO ALVO</span>
              <select
                className="capture-v3-target-select"
                value={pokemonId}
                onChange={(e) => {
                  setPokemonId(e.target.value)
                  setPrefillId('')
                }}
              >
                <option value="">Selecione</option>
                {capturaveis.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{String(p.pokedexId || '').padStart(3, '0')} {p.apelido || p.especie}
                  </option>
                ))}
              </select>
            </div>
            <div className="capture-v3-ekg-wrap">
              <div className="capture-v3-ekg-row">
                <span>~</span><span>~</span><span>~</span><span>~</span><span>~</span><span>~</span>
              </div>
              <span className="capture-v3-rarity">COMUM</span>
            </div>
          </div>

          <div className="capture-v3-cd-row">
            <div>
              <small>BASE CD</small>
              <strong>{cdBase}</strong>
            </div>
            <div>
              <small>FINAL CD</small>
              <strong>{cdFinal}</strong>
            </div>
          </div>

          <div className="capture-v3-hp-block">
            <div className="capture-v3-hp-label-row">
              <span>HP Alvo</span>
              <div className="capture-v3-hp-inputs">
                <input
                  type="number"
                  min={0}
                  value={captureForm?.hpRestantePokemon ?? 0}
                  onChange={(e) => onChangeCampo('hpRestantePokemon', Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
                <span>/</span>
                <input
                  type="number"
                  min={1}
                  value={captureForm?.hpMaximoPokemon ?? 1}
                  onChange={(e) => onChangeCampo('hpMaximoPokemon', Math.max(1, parseInt(e.target.value, 10) || 1))}
                />
              </div>
            </div>
            <div className="capture-v3-hp-track">
              <div className="capture-v3-hp-fill" style={{ width: `${hpPercent}%` }} />
              <span>{hpPercent.toFixed(1)}%</span>
            </div>
          </div>

          <div className="capture-v3-pokemon-stage">
            {pokemon?.imagemUrl ? (
              <img src={pokemon.imagemUrl} alt={pokemon.apelido || pokemon.especie || 'Pokemon'} />
            ) : (
              <div className="capture-v3-pokemon-placeholder">Selecione um pokemon</div>
            )}
            <button
              className="capture-v3-capture-btn"
              onClick={tentarCapturaAutomatica}
              disabled={!captureForm || calculando}
            >
              {calculando ? 'PROCESSANDO...' : 'CAPTURAR'}
            </button>
          </div>

          <div className="capture-v3-contencao">
            <span className="capture-v3-kicker">MODULO DE CONTENCAO</span>
            <div className="capture-v3-balls-grid">
              {POKEBOLAS_CONTENCAO.map((ball) => (
                <button
                  key={ball}
                  type="button"
                  className={`capture-v3-ball-btn ${pokebolaAtiva === ball ? 'is-active' : ''}`}
                  onClick={() => setPokebolaAtiva(ball)}
                >
                  {ball}
                </button>
              ))}
            </div>
          </div>
        </main>

        <aside className="capture-v3-column">
          <div className="card capture-v3-card">
            <h3>Modificadores</h3>
            <NumericStepper
              label="NIVEL DE RESPEITO"
              min={0}
              value={captureForm?.respeitoPokemon ?? 0}
              onChange={(v) => onChangeCampo('respeitoPokemon', v)}
            />
            <NumericStepper
              label="CD BASE (MANUAL)"
              min={0}
              value={captureForm?.cdBaseManual ?? cdBase}
              onChange={(v) => onChangeCampo('cdBaseManual', v)}
            />
            <label className="capture-v3-stepper">
              <span className="capture-v3-stepper-label">TIPOS (NET BALL)</span>
              <input
                type="text"
                placeholder="Ex: Agua, Inseto"
                value={captureForm?.tiposNetBall ?? ''}
                onChange={(e) => onChangeCampo('tiposNetBall', e.target.value)}
              />
            </label>
            <label className="capture-v3-stepper">
              <span className="capture-v3-stepper-label">AMBIENTE (DUSK BALL)</span>
              <input
                type="text"
                placeholder="Ex: Caverna, Noite"
                value={captureForm?.ambienteDuskBall ?? ''}
                onChange={(e) => onChangeCampo('ambienteDuskBall', e.target.value)}
              />
            </label>
            <label className="capture-v3-stepper">
              <span className="capture-v3-stepper-label">STATUS</span>
              <select value={captureForm?.status ?? 'NENHUM'} onChange={(e) => onChangeCampo('status', e.target.value)}>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="card capture-v3-card">
            <h3>Banco de Dados</h3>
            <p className="capture-v3-muted-italic">Nenhum preset salvo na memoria.</p>
            <button type="button" className="capture-v3-outline-btn">
              💾 Salvar Configuracao
            </button>
          </div>
        </aside>
      </section>

      {resultadoModal && (
        <div className="capture-v3-modal-overlay">
          <div className="card capture-v3-modal-card">
            <h3>
              {resultadoModal.sucesso ? 'Sucesso na captura' : 'Falha na captura'}
            </h3>
            <p>
              CD: <strong>{resultadoModal.dificuldade}</strong>
            </p>
            <p>
              Rolagem: <strong>{resultadoModal.rolagemTotal}</strong> = d20 ({resultadoModal.d20})
              {' + '}Domínio ({resultadoModal.dominioEfetivo})
              {' + '}Respeito ({resultadoModal.respeitoEfetivo})
              {' + '}Bônus manual ({resultadoModal.bonusManualMestre})
              {' + '}Bônus status ({resultadoModal.bonusStatus})
            </p>
            {resultadoModal.diferencaNivel > 0 && (
              <p style={{ color: 'var(--text-muted)' }}>
                Penalidade de nível aplicada: -{resultadoModal.diferencaNivel} em Domínio e Respeito
                (originais {resultadoModal.dominioOriginal}/{resultadoModal.respeitoOriginal}).
              </p>
            )}
            <div className="battle-actions capture-v3-modal-actions">
              <button className="btn btn-primary" onClick={() => setResultadoModal(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
