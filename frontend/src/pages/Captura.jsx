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

const TIER_BASE = { F: 10, E: 13, D: 16, C: 19, B: 22, A: 25, S: 30 }
const TIER_OPTIONS = ['F', 'E', 'D', 'C', 'B', 'A', 'S']

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

function calcularModificadorNivel(nivel) {
  return Math.floor(Math.min(Math.max(1, nivel), 20) / 2)
}

function calcularModificadorHP(hpRestante, hpMaximo) {
  if (hpMaximo <= 0) return 0
  const pct = (hpRestante / hpMaximo) * 100
  if (pct >= 76) return 10
  if (pct >= 50) return 5
  if (pct >= 11) return 0
  if (pct >= 1) return -5
  return 0
}

function labelModHP(pct) {
  if (pct >= 76) return 'Ileso'
  if (pct >= 50) return 'Machucado'
  if (pct >= 11) return 'Neutro'
  if (pct >= 1) return 'Crítico'
  return 'Derrotado'
}

const POKEBOLA_CONFIG = [
  { tipo: 'MASTER', palavras: ['master'],       bonus: null, masterball: true,  label: 'Master Ball',  desc: 'Captura garantida' },
  { tipo: 'ULTRA',  palavras: ['ultra'],         bonus: 6,   masterball: false, label: 'Ultra Ball',   desc: '+6 na rolagem' },
  { tipo: 'GREAT',  palavras: ['great', 'super'],bonus: 3,   masterball: false, label: 'Great Ball',   desc: '+3 na rolagem' },
  { tipo: 'PADRAO', palavras: [],                bonus: 0,   masterball: false, label: 'Pokébola',     desc: '+0 (padrão)' },
]

function identificarPokebola(nome, nomeEn) {
  const s = `${nome || ''} ${nomeEn || ''}`.toLowerCase()
  for (const cfg of POKEBOLA_CONFIG) {
    if (cfg.palavras.length > 0 && cfg.palavras.some((p) => s.includes(p))) {
      return { tipo: cfg.tipo, bonus: cfg.bonus ?? 0, masterball: cfg.masterball }
    }
  }
  return { tipo: 'DESCONHECIDA', bonus: 0, masterball: false }
}

function calcularTentativaCaptura(input, rolarD20 = () => Math.floor(Math.random() * 20) + 1) {
  const tier = input.tier || 'F'
  const nivelPokemon = Math.max(1, toInt(input.nivelPokemon, 1))
  const nivelJogador = Math.max(1, toInt(input.nivelJogador, 1))
  const respeitoPokemon = Math.max(0, toInt(input.respeitoPokemon, 0))
  const hpRestante = Math.max(0, toInt(input.hpRestantePokemon, 0))
  const hpMaximo = Math.max(1, toInt(input.hpMaximoPokemon, 1))

  const baseRaridade = TIER_BASE[tier] ?? 10
  const modNivel = calcularModificadorNivel(nivelPokemon)
  const modHP = calcularModificadorHP(hpRestante, hpMaximo)
  const cdAuto = baseRaridade + respeitoPokemon + modNivel + modHP

  const manualCdOverride = Boolean(input.manualCdOverride)
  const dificuldade = manualCdOverride ? Math.max(0, toInt(input.cdBaseManual, cdAuto)) : cdAuto

  const statusAtuais = normalizarStatusList(input.statusAtuais || input.status)
  const bonusStatus = calcularStatusBonus(statusAtuais, STATUS_BONUS_MAP)

  const penaltyNivel = Math.max(0, nivelPokemon - nivelJogador)
  const dominioBase = Math.max(0, toInt(input.dominioTreinador, 0))
  const respeitoBase = Math.max(0, toInt(input.respeitoTreinador, 0))
  const dominioTreinador = penaltyNivel > 0 ? Math.max(1, dominioBase - penaltyNivel) : dominioBase
  const respeitoTreinador = penaltyNivel > 0 ? Math.max(1, respeitoBase - penaltyNivel) : respeitoBase
  const bonusTreinador = toInt(input.bonusTreinador, 0)
  const vinculoTreinador = toInt(input.vinculoTreinador, 0)
  const bonusPokebola = toInt(input.bonusPokebola, 0)
  const masterball = Boolean(input.masterball)

  if (masterball) {
    return {
      sucesso: true, masterball: true,
      dificuldade, tier, baseRaridade, modNivel, modHP, respeitoPokemon,
      rolagemTotal: null, d20: null,
      dominioTreinador, respeitoTreinador, dominioBase, respeitoBase, penaltyNivel,
      bonusTreinador, vinculoTreinador,
      bonusStatus, bonusPokebola: 0, statusAtuais, nivelPokemon, nivelJogador, hpRestante, hpMaximo, cdAuto, manualCdOverride,
    }
  }

  const d20 = rolarD20()
  const rolagemTotal = d20 + dominioTreinador + respeitoTreinador + bonusTreinador + vinculoTreinador + bonusStatus + bonusPokebola
  const sucesso = rolagemTotal >= dificuldade

  return {
    sucesso, masterball: false,
    dificuldade, tier, baseRaridade, modNivel, modHP, respeitoPokemon,
    rolagemTotal, d20,
    dominioTreinador, respeitoTreinador, dominioBase, respeitoBase, penaltyNivel,
    bonusTreinador, vinculoTreinador,
    bonusStatus, bonusPokebola, statusAtuais, nivelPokemon, nivelJogador, hpRestante, hpMaximo, cdAuto, manualCdOverride,
  }
}

function buildCaptureForm(pokemon, perfil) {
  if (!pokemon || !perfil) return null
  const tierValido = TIER_OPTIONS.includes(pokemon.ivClass) ? pokemon.ivClass
    : TIER_OPTIONS.includes(pokemon.raridade) ? pokemon.raridade
    : 'F'
  return {
    tier: tierValido,
    nivelPokemon: Math.max(1, Number(pokemon.nivel) || 1),
    nivelJogador: Math.max(1, Number(perfil.nivel) || 1),
    respeitoPokemon: Math.max(0, Number(pokemon.respeito) || 0),
    hpRestantePokemon: Math.max(0, Number(pokemon.hpAtual) || 0),
    hpMaximoPokemon: Math.max(1, Number(pokemon.hpMaximo) || 1),
    dominioTreinador: Math.max(0, Number(perfil.atributos?.dominio) || 0),
    respeitoTreinador: Math.max(0, Number(perfil.atributos?.respeito) || 0),
    vinculoTreinador: 0,
    bonusTreinador: 0,
    cdBaseManual: 0,
    manualCdOverride: false,
    statusAtuais: detectarStatusInicial(pokemon.statusAtuais),
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
    const EXCLUIDOS = /^(iron ball|light ball|smoke ball)$/i
    const excluido = (item) => EXCLUIDOS.test((item.nome || '').trim()) || EXCLUIDOS.test((item.nomeEn || '').trim())
    return itensCatalogo
      .filter((item) => (temBallIsolado(item.nome) || temBallIsolado(item.nomeEn)) && !excluido(item))
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

  const resolverPokebolaAtiva = () => {
    const item = pokebolasDisponiveis.find((b) => b.id === pokebolaAtiva) || null
    const info = item ? identificarPokebola(item.nome, item.nomeEn) : { tipo: 'PADRAO', bonus: 0, masterball: false }
    const bonus = info.bonus
    return { item, info, bonus }
  }

  const tentarCapturaAutomatica = async () => {
    if (!pokemon || !captureForm || calculando) return
    setErro('')
    setMensagem('')
    setCalculando(true)
    try {
      const { item, info, bonus } = resolverPokebolaAtiva()
      const resultado = calcularTentativaCaptura({ ...captureForm, masterball: info.masterball, bonusPokebola: bonus })
      await resolverCaptura(resultado.sucesso)
      setResultadoModal({ ...resultado, pokebolaNome: item?.nome || item?.nomeEn || 'Pokébola' })
    } catch (e) {
      setErro(e.message || 'Erro ao resolver captura')
    } finally {
      setCalculando(false)
    }
  }

  const processarSimulacaoRapida = () => {
    if (!captureForm) return
    const { info, bonus } = resolverPokebolaAtiva()
    const total = Math.max(1, parseInt(quickRolls, 10) || 1)
    let sucessos = 0
    for (let i = 0; i < total; i += 1) {
      const r = calcularTentativaCaptura({ ...captureForm, masterball: info.masterball, bonusPokebola: bonus })
      if (r.sucesso) sucessos += 1
    }
    setChanceEstimada((sucessos / total) * 100)
  }

  // ── Computações reativas ────────────────────────────────────────────────────
  const pokebolaSelecionada = pokebolasDisponiveis.find((b) => b.id === pokebolaAtiva) || null
  const pokebolaInfo = pokebolaSelecionada
    ? identificarPokebola(pokebolaSelecionada.nome, pokebolaSelecionada.nomeEn)
    : { tipo: 'PADRAO', bonus: 0, masterball: false }
  const masterBallAtiva = pokebolaInfo.masterball
  const bonusPokebolaEfetivo = pokebolaInfo.bonus

  const hpRestante = Math.max(0, Number(captureForm?.hpRestantePokemon) || 0)
  const hpMaximo = Math.max(1, Number(captureForm?.hpMaximoPokemon) || 1)
  const hpPercent = Math.max(0, Math.min(100, (hpRestante / hpMaximo) * 100))

  const baseRaridade = TIER_BASE[captureForm?.tier || 'F'] ?? 10
  const modNivelAtual = captureForm ? calcularModificadorNivel(captureForm.nivelPokemon || 1) : 0
  const modHPAtual = captureForm ? calcularModificadorHP(hpRestante, hpMaximo) : 0
  const cdAuto = captureForm ? baseRaridade + (captureForm.respeitoPokemon || 0) + modNivelAtual + modHPAtual : 0
  const cdFinal = captureForm
    ? (captureForm.manualCdOverride ? Math.max(0, Number(captureForm.cdBaseManual) || cdAuto) : cdAuto)
    : 0

  const bonusStatusAtual = captureForm ? calcularStatusBonus(normalizarStatusList(captureForm.statusAtuais), STATUS_BONUS_MAP) : 0
  const nivelJogadorAtual = Math.max(1, Number(captureForm?.nivelJogador) || 1)
  const penaltyNivelAtual = Math.max(0, (captureForm?.nivelPokemon || 1) - nivelJogadorAtual)
  const dominioComPenalty = captureForm
    ? (penaltyNivelAtual > 0 ? Math.max(1, (captureForm.dominioTreinador || 0) - penaltyNivelAtual) : (captureForm.dominioTreinador || 0))
    : 0
  const respeitoComPenalty = captureForm
    ? (penaltyNivelAtual > 0 ? Math.max(1, (captureForm.respeitoTreinador || 0) - penaltyNivelAtual) : (captureForm.respeitoTreinador || 0))
    : 0
  const bonusJogador = captureForm
    ? dominioComPenalty + respeitoComPenalty + (captureForm.bonusTreinador || 0) + (captureForm.vinculoTreinador || 0) + bonusStatusAtual + bonusPokebolaEfetivo
    : 0
  const d20Needed = cdFinal - bonusJogador
  const capturaGarantida = masterBallAtiva || d20Needed <= 1
  const capturaImpossivel = !masterBallAtiva && d20Needed > 20
  const d20Minimo = masterBallAtiva ? null : Math.max(1, Math.min(20, d20Needed))

  const chanceTexto = chanceEstimada == null ? '—' : `${chanceEstimada.toFixed(1)}%`
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
                min={0}
                value={captureForm?.dominioTreinador ?? 0}
                onChange={(v) => onChangeCampo('dominioTreinador', v)}
              />
              <NumericStepper
                label="RESPEITO"
                min={0}
                value={captureForm?.respeitoTreinador ?? 0}
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
            {penaltyNivelAtual > 0 && (
              <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.65rem', borderRadius: 6, background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.3)', fontSize: '0.8rem', color: 'var(--danger)', lineHeight: 1.5 }}>
                <strong>Penalidade de nível</strong> — Pokémon Lv.{captureForm.nivelPokemon} &gt; Jogador Lv.{nivelJogadorAtual} (−{penaltyNivelAtual} cada)<br />
                DOM: {captureForm.dominioTreinador} → <strong>{dominioComPenalty}</strong> &nbsp;·&nbsp; RES: {captureForm.respeitoTreinador} → <strong>{respeitoComPenalty}</strong>
              </div>
            )}
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
                  setPrefillKey('')
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
              <span className="capture-v3-rarity">TIER {captureForm?.tier || 'F'} — BASE {baseRaridade}</span>
            </div>
          </div>

          <div className="capture-v3-cd-row">
            <div>
              <small>CD FINAL</small>
              <strong>{cdFinal}</strong>
            </div>
            <div>
              <small>BÔNUS JOGADOR</small>
              <strong>+{bonusJogador}</strong>
            </div>
            <div>
              <small>D20 MÍNIMO</small>
              <strong style={{ color: masterBallAtiva ? 'var(--success)' : capturaGarantida ? 'var(--success)' : capturaImpossivel ? 'var(--danger)' : 'inherit' }}>
                {masterBallAtiva ? 'Auto' : capturaGarantida ? 'Garantida' : capturaImpossivel ? 'Impossível' : d20Minimo}
              </strong>
            </div>
          </div>
          <p style={{ margin: '-0.25rem 0 0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {captureForm
              ? `Base ${baseRaridade} + Respeito ${captureForm.respeitoPokemon || 0} + Nível Lv.${captureForm.nivelPokemon} (+${modNivelAtual}) + HP ${hpPercent.toFixed(0)}% ${labelModHP(hpPercent)} (${modHPAtual >= 0 ? '+' : ''}${modHPAtual})`
              : '—'}
          </p>

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
              {pokebolasDisponiveis.map((ball) => {
                const info = identificarPokebola(ball.nome, ball.nomeEn)
                const desconhecida = info.tipo === 'DESCONHECIDA'
                return (
                  <button
                    key={ball.id}
                    type="button"
                    className={`capture-v3-ball-btn ${pokebolaAtiva === ball.id ? 'is-active' : ''}`}
                    onClick={() => setPokebolaAtiva(ball.id)}
                    title={desconhecida ? 'Bônus não configurado — adicione manualmente no campo BONUS' : undefined}
                  >
                    {ball.imagemUrl ? (
                      <img src={ball.imagemUrl} alt="" className="capture-v3-ball-icon" />
                    ) : (
                      <span className="capture-v3-ball-icon capture-v3-ball-icon--placeholder" />
                    )}
                    <span className="capture-v3-ball-label">{ball.nome || ball.nomeEn || 'Ball'}</span>
                    <span style={{ fontSize: '0.68rem', color: desconhecida ? 'var(--text-muted)' : 'var(--accent)', fontWeight: 600 }}>
                      {info.masterball ? 'AUTO' : desconhecida ? '?' : `+${info.bonus}`}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Painel informativo de bônus */}
            <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius)', background: 'rgba(168,85,247,.07)', border: '1px solid rgba(168,85,247,.18)', fontSize: '0.8rem' }}>
              <p style={{ margin: '0 0 0.4rem', fontWeight: 600, color: 'var(--text)' }}>Pokébolas configuradas</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', color: 'var(--text-muted)' }}>
                {POKEBOLA_CONFIG.filter((c) => c.tipo !== 'PADRAO').map((c) => (
                  <span key={c.tipo}>• {c.label}: <strong style={{ color: 'var(--text)' }}>{c.desc}</strong></span>
                ))}
                <span>• Pokébola padrão: <strong style={{ color: 'var(--text)' }}>+0 (base)</strong></span>
              </div>
              <p style={{ margin: '0.5rem 0 0', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
                Usando uma pokébola não listada? Adicione o bônus no campo <strong style={{ color: 'var(--text)' }}>BONUS</strong> do treinador manualmente — mas respeite o balanceamento: Great Ball (+3) já é notável, Ultra Ball (+6) é o teto comum.
              </p>
            </div>

            {pokebolasDisponiveis.length === 0 && (
              <p className="capture-v3-muted-italic">Nenhuma Pokébola encontrada no catálogo com "ball" no nome.</p>
            )}
          </div>
        </main>

        <aside className="capture-v3-column">
          <div className="card capture-v3-card">
            <h3>Modificadores</h3>

            {/* Tier de raridade — derivado automaticamente do BST (ivClass) */}
            <div style={{ marginBottom: '0.75rem' }}>
              <span className="capture-v3-stepper-label" style={{ display: 'block', marginBottom: '0.4rem' }}>RARIDADE (TIER)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-block', padding: '0.2rem 0.7rem', borderRadius: 6,
                  border: '1.5px solid var(--accent)', background: 'rgba(168,85,247,.18)',
                  color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.04em',
                }}>
                  {captureForm?.tier || '—'} — base {baseRaridade}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>derivado do BST</span>
              </div>
            </div>

            <NumericStepper
              label="RESPEITO DO ALVO"
              min={0}
              value={captureForm?.respeitoPokemon ?? 0}
              onChange={(v) => onChangeCampo('respeitoPokemon', v)}
            />
            <NumericStepper
              label="CD MANUAL (override)"
              min={0}
              value={captureForm?.cdBaseManual ?? cdAuto}
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

            <label className="capture-v3-stepper" style={{ marginTop: '0.5rem' }}>
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

      {resultadoModal && (() => {
        const r = resultadoModal
        const hpPct = r.hpMaximo > 0 ? (r.hpRestante / r.hpMaximo) * 100 : 0
        const modHPLabel = `${hpPct.toFixed(0)}% ${labelModHP(hpPct)} (${r.modHP >= 0 ? '+' : ''}${r.modHP})`
        const sepStyle = { display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.88rem', color: 'var(--text-muted)', paddingLeft: '0.8rem', borderLeft: '2px solid var(--border)', margin: '0.3rem 0 0.9rem' }
        return (
          <div className="capture-v3-modal-overlay">
            <div className="card capture-v3-modal-card">
              <h3 style={{ color: r.sucesso ? 'var(--success)' : 'var(--danger)', marginTop: 0 }}>
                {r.sucesso ? '✓ Captura bem-sucedida!' : '✗ Captura falhou'}
              </h3>

              {r.masterball ? (
                <p>Master Ball usada — captura automática garantida.</p>
              ) : (
                <>
                  <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>CD de Captura: {r.dificuldade}{r.manualCdOverride ? ' (manual)' : ''}</p>
                  <div style={sepStyle}>
                    <span>Base de Raridade (Tier {r.tier}): {r.baseRaridade}</span>
                    <span>+ Respeito do alvo: {r.respeitoPokemon}</span>
                    <span>+ Mod. Nível (Lv.{r.nivelPokemon} → +{r.modNivel}): {r.modNivel}</span>
                    <span>+ Mod. HP ({modHPLabel}): {r.modHP >= 0 ? '+' : ''}{r.modHP}</span>
                  </div>

                  <p style={{ margin: '0 0 0.25rem', fontWeight: 600 }}>
                    Rolagem: {r.rolagemTotal} {r.sucesso ? '≥' : '<'} {r.dificuldade} → {r.sucesso ? 'Capturou!' : 'Falhou'}
                  </p>
                  <div style={sepStyle}>
                    <span>d20: {r.d20}</span>
                    <span>+ DOM: {r.penaltyNivel > 0 ? `${r.dominioBase} −${r.penaltyNivel} = ${r.dominioTreinador}` : r.dominioTreinador}</span>
                    <span>+ RES: {r.penaltyNivel > 0 ? `${r.respeitoBase} −${r.penaltyNivel} = ${r.respeitoTreinador}` : r.respeitoTreinador}</span>
                    <span>+ Bônus: {r.bonusTreinador}</span>
                    <span>+ Vínculo: {r.vinculoTreinador}</span>
                    <span>+ Status: {r.bonusStatus}</span>
                    <span>+ {r.pokebolaNome || 'Pokébola'}: +{r.bonusPokebola}</span>
                  </div>
                </>
              )}

              <div className="battle-actions capture-v3-modal-actions">
                <button className="btn btn-primary" onClick={() => setResultadoModal(null)}>Fechar</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
