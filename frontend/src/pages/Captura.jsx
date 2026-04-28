import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getItens, getMeuPerfil, getPokemonsSelvagens, tentarCapturaPokemon } from '../api'
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

const STATUS_CD_REDUCAO_MAP = {
  NENHUM: 0,
  DORMINDO: 2,
  CONGELADO: 2,
  PARALISADO: 2,
  QUEIMANDO: 2,
  ENVENENADO: 2,
}

const STATUS_ACTIONS = [
  { value: 'CLEAR', label: 'Ø', title: 'Limpar status' },
  { value: 'DORMINDO', label: '💤', title: 'Dormindo' },
  { value: 'CONGELADO', label: '🧊', title: 'Congelado' },
  { value: 'PARALISADO', label: '⚡', title: 'Paralisado' },
  { value: 'QUEIMANDO', label: '🔥', title: 'Queimando' },
  { value: 'ENVENENADO', label: '☠️', title: 'Envenenado' },
]

function detectarStatusInicial(statusAtuais) {
  const lista = Array.isArray(statusAtuais) ? statusAtuais : []
  const normalizado = lista.map((s) => String(s || '').toUpperCase())
  const set = new Set()
  if (normalizado.includes('DORMINDO')) set.add('DORMINDO')
  if (normalizado.includes('CONGELADO')) set.add('CONGELADO')
  if (normalizado.includes('PARALISADO')) set.add('PARALISADO')
  if (normalizado.includes('QUEIMADO') || normalizado.includes('QUEIMANDO')) set.add('QUEIMANDO')
  if (normalizado.includes('ENVENENADO')) set.add('ENVENENADO')
  return Array.from(set)
}

function normalizarStatusList(statuses) {
  return Array.from(new Set((Array.isArray(statuses) ? statuses : [])
    .map((s) => String(s || '').toUpperCase())
    .filter((s) => s && s !== 'NENHUM')))
}

function calcularStatusBonus(statuses, tabela) {
  return normalizarStatusList(statuses).reduce((total, status) => total + (tabela[status] ?? 0), 0)
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
  const statusAtuais = normalizarStatusList(input.statusAtuais || input.status)
  const statusCdReducao = calcularStatusBonus(statusAtuais, STATUS_CD_REDUCAO_MAP)
  const cdAuto = Math.max(0, cdBaseCalculada - statusCdReducao)
  const manualCdOverride = Boolean(input.manualCdOverride)
  const cdManual = Math.max(0, toInt(input.cdBaseManual, cdAuto))
  const nivelTreinador = Math.max(1, toInt(input.nivelTreinador, 1))
  const dominioTreinador = Math.max(1, toInt(input.dominioTreinador, 1))
  const respeitoTreinador = Math.max(1, toInt(input.respeitoTreinador, 1))
  const bonusTreinador = toInt(input.bonusTreinador, 0)
  const vinculoTreinador = toInt(input.vinculoTreinador, 0)
  const bonusManualMestre = bonusTreinador + vinculoTreinador
  const bonusStatus = calcularStatusBonus(statusAtuais, STATUS_BONUS_MAP)

  const penalidadeNivel = Math.max(0, nivelPokemon - nivelTreinador)
  const dominioEfetivo = Math.max(1, dominioTreinador - penalidadeNivel)
  const respeitoEfetivo = Math.max(1, respeitoTreinador - penalidadeNivel)

  const dificuldade = manualCdOverride ? cdManual : cdAuto
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
    bonusTreinador,
    vinculoTreinador,
    dominioOriginal: dominioTreinador,
    respeitoOriginal: respeitoTreinador,
    dominioEfetivo,
    respeitoEfetivo,
    penalidadeNivel,
    cdBaseCalculada,
    cdAuto,
    statusCdReducao,
    manualCdOverride,
    statusAtuais,
    nivelPokemon,
    nivelTreinador,
  }
}

function buildCaptureForm(pokemon, perfil) {
  if (!pokemon || !perfil) return null
  const nivelPokemon = Math.max(1, Number(pokemon.nivel) || 1)
  const respeitoPokemon = Math.max(0, Number(pokemon.respeito) || 0)
  const hpRestantePokemon = Math.max(0, Number(pokemon.hpAtual) || 0)
  const cdBase = respeitoPokemon + nivelPokemon + hpRestantePokemon
  return {
    nivelPokemon,
    respeitoPokemon,
    hpRestantePokemon,
    hpMaximoPokemon: Math.max(1, Number(pokemon.hpMaximo) || 1),
    nivelTreinador: Math.max(1, Number(perfil.nivel) || 1),
    dominioTreinador: Math.max(1, Number(perfil.atributos?.dominio) || 1),
    respeitoTreinador: Math.max(1, Number(perfil.atributos?.respeito) || 1),
    vinculoTreinador: 0,
    bonusTreinador: 0,
    cdBaseManual: cdBase,
    manualCdOverride: false,
    statusAtuais: detectarStatusInicial(pokemon.statusAtuais),
    tiposNetBall: '',
    ambienteDuskBall: '',
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
  const [prefillKey, setPrefillKey] = useState('')
  const [quickRolls, setQuickRolls] = useState(100)
  const [chanceEstimada, setChanceEstimada] = useState(null)
  const [pokebolaAtiva, setPokebolaAtiva] = useState('')

  const pokemonsQuery = useQuery({
    queryKey: queryKeys.pokemonsSelvagensOwner(),
    queryFn: () => getPokemonsSelvagens(),
    enabled: readyForPlayerApi,
    staleTime: 60 * 1000,
  })
  const pokemons = pokemonsQuery.data || []

  const perfilQuery = useQuery({
    queryKey: queryKeys.perfil(playerId),
    queryFn: () => getMeuPerfil(playerId),
    enabled: readyForPlayerApi,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
  const perfil = perfilQuery.data

  const itensQuery = useQuery({
    queryKey: queryKeys.catalogo.itens,
    queryFn: getItens,
    enabled: readyForPlayerApi,
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })
  const itensCatalogo = Array.isArray(itensQuery.data) ? itensQuery.data : []
  const pokebolasDisponiveis = useMemo(() => {
    const ballComoPalavra = /\bball\b/i
    const temBallIsolado = (txt) => ballComoPalavra.test(String(txt || ''))
    return itensCatalogo
      .filter((item) => {
        return temBallIsolado(item.nome) || temBallIsolado(item.nomeEn)
      })
      .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'))
  }, [itensCatalogo])

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
  const perfilChave = perfil?.id || playerId || 'self'

  useEffect(() => {
    if (pokebolasDisponiveis.length === 0) {
      setPokebolaAtiva('')
      return
    }
    const existe = pokebolasDisponiveis.some((item) => item.id === pokebolaAtiva)
    if (!existe) {
      setPokebolaAtiva(pokebolasDisponiveis[0].id)
    }
  }, [pokebolasDisponiveis, pokebolaAtiva])

  useEffect(() => {
    if (!pokemon || !perfil) return
    const currentKey = `${pokemon.id}:${perfilChave}`
    if (prefillKey === currentKey) return
    setCaptureForm(buildCaptureForm(pokemon, perfil))
    setChanceEstimada(null)
    setPrefillKey(currentKey)
  }, [pokemon, perfil, perfilChave, prefillKey])

  const resetCamposDoBanco = async () => {
    if (!pokemonId) return
    setErro('')
    setMensagem('')
    const freshPerfil = perfilQuery.data || perfil
    const freshPokemon = pokemonsQuery.data?.find((p) => p.id === pokemonId) || pokemon
    if (!freshPokemon || !freshPerfil) return
    setCaptureForm(buildCaptureForm(freshPokemon, freshPerfil))
    setChanceEstimada(null)
    setPrefillKey(`${freshPokemon.id}:${freshPerfil.id || playerId || 'self'}`)
    void perfilQuery.refetch()
  }

  const toggleStatus = (statusValue) => {
    setCaptureForm((current) => {
      if (!current) return current
      if (statusValue === 'CLEAR') {
        return { ...current, statusAtuais: [] }
      }
      const atual = normalizarStatusList(current.statusAtuais)
      const next = atual.includes(statusValue)
        ? atual.filter((status) => status !== statusValue)
        : [...atual, statusValue]
      return { ...current, statusAtuais: next }
    })
  }

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

    queryClient.setQueryData(queryKeys.pokemonsSelvagensOwner(), (prev = []) => {
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
      queryClient.invalidateQueries({ queryKey: queryKeys.pokemonsSelvagensOwner() }),
    ])

    if (sucesso) {
      setPokemonId('')
      setPrefillKey('')
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
  const statusCdReducaoAtual = captureForm
    ? calcularStatusBonus(captureForm.statusAtuais, STATUS_CD_REDUCAO_MAP)
    : 0
  const cdFinalAuto = Math.max(0, cdBase - statusCdReducaoAtual)
  const cdFinal = captureForm
    ? (captureForm.manualCdOverride ? Math.max(0, Number(captureForm.cdBaseManual) || cdFinalAuto) : cdFinalAuto)
    : 0
  const hpRestante = Math.max(0, Number(captureForm?.hpRestantePokemon) || 0)
  const hpMaximo = Math.max(1, Number(captureForm?.hpMaximoPokemon) || 1)
  const hpPercent = Math.max(0, Math.min(100, (hpRestante / hpMaximo) * 100))
  const chanceTexto = chanceEstimada == null ? 'NaN%' : `${chanceEstimada.toFixed(1)}%`
  const statusAtuaisTexto = captureForm ? normalizarStatusList(captureForm.statusAtuais).join(', ') : ''

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
                onClick={resetCamposDoBanco}
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
            <p className="capture-v3-quick-result">
              Chance estimada: <strong>{chanceTexto}</strong>
            </p>
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
              <div className="capture-v3-ekg-row capture-v3-status-row">
                {STATUS_ACTIONS.map((status) => {
                  const active = status.value !== 'CLEAR' && normalizarStatusList(captureForm?.statusAtuais).includes(status.value)
                  return (
                    <button
                      key={status.value}
                      type="button"
                      className={`capture-v3-status-btn ${active ? 'is-active' : ''}`}
                      title={status.title}
                      onClick={() => toggleStatus(status.value)}
                    >
                      {status.label}
                    </button>
                  )
                })}
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

          {captureForm && captureForm.nivelPokemon > captureForm.nivelTreinador && (
            <p className="capture-v3-muted-italic" style={{ marginTop: '-0.1rem' }}>
              Penalidade de nível aplicada: -{captureForm.nivelPokemon - captureForm.nivelTreinador} em Domínio e Respeito.
            </p>
          )}

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
            <span className="capture-v3-kicker">POKÉBOLA</span>
            <div className="capture-v3-balls-scroll">
              {pokebolasDisponiveis.map((ball) => (
                <button
                  key={ball.id}
                  type="button"
                  className={`capture-v3-ball-btn ${pokebolaAtiva === ball.id ? 'is-active' : ''}`}
                  onClick={() => setPokebolaAtiva(ball.id)}
                >
                  {ball.imagemUrl ? (
                    <img src={ball.imagemUrl} alt="" className="capture-v3-ball-icon" />
                  ) : (
                    <span className="capture-v3-ball-icon capture-v3-ball-icon--placeholder" />
                  )}
                  <span className="capture-v3-ball-label">{ball.nome || ball.nomeEn || 'Ball'}</span>
                </button>
              ))}
            </div>
            {pokebolasDisponiveis.length === 0 && (
              <p className="capture-v3-muted-italic">Nenhuma Pokébola encontrada no catalogo com "ball" no nome.</p>
            )}
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
              onChange={(v) => {
                onChangeCampo('cdBaseManual', v)
                onChangeCampo('manualCdOverride', true)
              }}
            />
            {captureForm?.manualCdOverride && (
              <button
                type="button"
                className="capture-v3-outline-btn"
                onClick={() => onChangeCampo('manualCdOverride', false)}
              >
                Usar CD automático
              </button>
            )}
            <label className="capture-v3-stepper">
              <span className="capture-v3-stepper-label">STATUS ATUAIS</span>
              <input
                type="text"
                readOnly
                value={statusAtuaisTexto}
                placeholder="Selecione pelos botões acima"
              />
            </label>
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
              {' + '}Bônus manual ({resultadoModal.bonusTreinador})
              {' + '}Vínculo ({resultadoModal.vinculoTreinador})
              {' + '}Bônus status ({resultadoModal.bonusStatus})
            </p>
            <p>
              CD automática: <strong>{resultadoModal.cdAuto}</strong>
              {' '}| redução por status: -{resultadoModal.statusCdReducao}
              {' '}| modo manual: {resultadoModal.manualCdOverride ? 'sim' : 'não'}
            </p>
            {resultadoModal.penalidadeNivel > 0 && (
              <p style={{ color: 'var(--text-muted)' }}>
                Penalidade de nível aplicada: -{resultadoModal.penalidadeNivel} em Domínio e Respeito
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
