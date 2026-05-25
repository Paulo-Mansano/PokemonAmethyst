import { useState, useEffect, useCallback, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { getMeuPerfil, salvarPerfil } from '../api'
import { usePlayerTarget } from '../context/PlayerTargetContext'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../query/queryKeys'

// ─── Constantes ────────────────────────────────────────────────────────────────

const ATTRS = [
  { id: 'forca', nome: 'Força', star: false, custo: 1 },
  { id: 'speed', nome: 'Speed', star: false, custo: 1 },
  { id: 'inteligencia', nome: 'Inteligência', star: false, custo: 1 },
  { id: 'tecnica', nome: 'Técnica', star: false, custo: 1 },
  { id: 'sabedoria', nome: 'Sabedoria', star: false, custo: 1 },
  { id: 'percepcao', nome: 'Percepção', star: true, custo: 2 },
  { id: 'dominio', nome: 'Domínio', star: true, custo: 2 },
  { id: 'respeito', nome: 'Respeito', star: true, custo: 2 },
]

const CLASSES = ['CIVIL', 'TREINADOR', 'COMPETIDOR', 'CACADOR', 'MEDICO', 'PESQUISADOR']
const PONTOS_INICIAIS = 20
const PONTOS_POR_LEVEL = 3
const ATRIBUTOS_NORMAIS = ['forca', 'speed', 'inteligencia', 'tecnica', 'sabedoria']
const ATRIBUTOS_ESPECIAIS = ['percepcao', 'dominio', 'respeito']
const SEM_PERFIL_SESSION_KEY = 'pokemonamethyst:login-sem-perfil'
const INITIAL_ATTRS = Object.fromEntries(ATTRS.map((a) => [a.id, 1]))

const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Oxanium:wght@300;400;500;600;700&family=Press+Start+2P&display=swap');
  .ficha-root *, .ficha-root *::before, .ficha-root *::after { box-sizing: border-box; }
  .ficha-root input[type=number]::-webkit-inner-spin-button,
  .ficha-root input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  .ficha-root input[type=number] { -moz-appearance: textfield; }
  .ficha-root input, .ficha-root select {
    background: #0a0614; border: 1px solid rgba(168,85,247,.15); border-radius: 6px;
    color: #f0ebff; font-family: 'Oxanium', sans-serif; font-size: 15px; font-weight: 500;
    padding: 10px 14px; width: 100%; outline: none; transition: border-color .2s, box-shadow .2s;
    -webkit-appearance: none; appearance: none;
  }
  .ficha-root input:focus, .ficha-root select:focus {
    border-color: rgba(168,85,247,.55); box-shadow: 0 0 0 3px rgba(168,85,247,.08);
  }
  .ficha-root select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238b7db5' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 12px center; background-size: 12px;
    padding-right: 36px; cursor: pointer;
  }
  @keyframes fichaFadeSlide {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ficha-card-anim { animation: fichaFadeSlide .35s ease both; }
  .ficha-card-anim:nth-child(1) { animation-delay: .05s; }
  .ficha-card-anim:nth-child(2) { animation-delay: .10s; }
  .ficha-card-anim:nth-child(3) { animation-delay: .15s; }
  .ficha-card-anim:nth-child(4) { animation-delay: .20s; }
  .ficha-card-anim:nth-child(5) { animation-delay: .25s; }
  .ficha-card-anim:nth-child(6) { animation-delay: .30s; }
  .ficha-attr-card:hover { border-color: rgba(168,85,247,.38) !important; box-shadow: 0 0 20px rgba(168,85,247,.12) !important; }
  .ficha-team-slot:hover { border-color: rgba(168,85,247,.38) !important; box-shadow: 0 0 20px rgba(168,85,247,.12) !important; }
  .ficha-add-btn:hover   { opacity: .85; }
  .ficha-add-btn:active  { transform: scale(.96); }
  .ficha-btn-main:hover  { filter: brightness(1.12); box-shadow: 0 0 24px rgba(168,85,247,.5); }
  .ficha-btn-main:active { transform: scale(.97); }
  .ficha-btn-outline:hover { border-color: rgba(168,85,247,.5) !important; color: #c084fc !important; box-shadow: 0 0 20px rgba(168,85,247,.2) !important; }
`

// ─── Subcomponentes SVG ─────────────────────────────────────────────────────────

const Pokeball = ({ size = 36, style }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={style}>
    <circle cx="20" cy="20" r="19" stroke="#a855f7" strokeWidth="1.5" />
    <line x1="1" y1="20" x2="39" y2="20" stroke="#a855f7" strokeWidth="1.2" />
    <path d="M1 20a19 19 0 0 1 38 0" fill="rgba(168,85,247,0.08)" />
    <circle cx="20" cy="20" r="5.5" stroke="#a855f7" strokeWidth="1.5" fill="#080612" />
    <circle cx="20" cy="20" r="2.5" fill="#a855f7" />
  </svg>
)

const MiniPokeball = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="14" cy="14" r="13" stroke="#a855f7" strokeWidth="1" />
    <line x1="1" y1="14" x2="27" y2="14" stroke="#a855f7" strokeWidth="0.8" />
    <path d="M1 14a13 13 0 0 1 26 0" fill="rgba(168,85,247,0.06)" />
    <circle cx="14" cy="14" r="4" stroke="#a855f7" strokeWidth="1" fill="#080612" />
    <circle cx="14" cy="14" r="1.8" fill="#a855f7" />
  </svg>
)

// ─── Funções de cálculo ────────────────────────────────────────────────────────

function calcularCustoEvolucao(atributo, nivelAtual) {
  if (ATRIBUTOS_NORMAIS.includes(atributo)) return 1
  if (ATRIBUTOS_ESPECIAIS.includes(atributo)) {
    return nivelAtual >= 5 ? 3 : 2
  }
  return 1
}

function calcularXpProximoNivel(nivelAtual) {
  return 20 * Math.pow(2, nivelAtual - 1)
}

function calcularHabilidade(nivel) {
  return 2 + Math.floor(nivel / 5)
}

function calcularHpMaximo(atributos) {
  return 20 + (atributos?.forca ?? 1)
}

function calcularStaminaMaxima(atributos) {
  return 20 + (atributos?.speed ?? 1)
}

function calcularPontosDisponiveis(atributos, nivel = 1) {
  let investidos = 0
  for (const attr of [...ATRIBUTOS_NORMAIS, ...ATRIBUTOS_ESPECIAIS]) {
    const nivelAtributo = Math.max(1, atributos?.[attr] ?? 1)
    for (let n = 1; n < nivelAtributo; n++) {
      investidos += calcularCustoEvolucao(attr, n)
    }
  }
  const bonusPorLevel = Math.max(0, Math.max(1, nivel) - 1) * PONTOS_POR_LEVEL
  return PONTOS_INICIAIS + bonusPorLevel - investidos
}

function normalizarNivelXp(nivelInicial, xpAtual) {
  let nivel = Math.max(1, Number.isFinite(nivelInicial) ? nivelInicial : 1)
  let xp = Math.max(0, Number.isFinite(xpAtual) ? xpAtual : 0)
  while (xp >= calcularXpProximoNivel(nivel)) {
    xp -= calcularXpProximoNivel(nivel)
    nivel += 1
  }
  return { nivel, xp }
}

function calcularCustoMudancaAtributo(atributo, nivelInicial, nivelFinal) {
  const de = Math.max(1, nivelInicial)
  const para = Math.max(1, nivelFinal)
  if (de === para) return 0

  let custo = 0
  if (para > de) {
    for (let n = de; n < para; n++) {
      custo += calcularCustoEvolucao(atributo, n)
    }
    return custo
  }

  for (let n = para; n < de; n++) {
    custo -= calcularCustoEvolucao(atributo, n)
  }
  return custo
}

// ─── Componente DerivedStat ────────────────────────────────────────────────────

function DerivedStat({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(8, 6, 18, 0.65)',
      border: '1px solid rgba(168,85,247,.14)',
      borderRadius: 10,
      padding: '1rem 1.25rem',
      position: 'relative',
      overflow: 'hidden',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: color }} />
      <div style={{ fontFamily: "'Oxanium', sans-serif", fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8b7db5', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 20, color, lineHeight: 1 }}>{value}</div>
    </div>
  )
}

// ─── Componente AttrCard ──────────────────────────────────────────────────────

function AttrCard({ attr, value, pontosDisponiveis, onAdd, onChange }) {
  const podeAdicionar = pontosDisponiveis >= attr.custo
  const corBtn = attr.custo > 1
    ? { bg: 'rgba(192,132,252,.1)', border: 'rgba(192,132,252,.3)', color: '#c084fc' }
    : { bg: 'rgba(168,85,247,.12)', border: 'rgba(168,85,247,.28)', color: '#a855f7' }

  const pontosRestantes = pontosDisponiveis - attr.custo

  return (
    <div className="ficha-attr-card" style={{
      background: 'rgba(8, 6, 18, 0.6)',
      border: '1px solid rgba(168,85,247,.15)',
      borderRadius: 10,
      padding: 12,
      transition: 'border-color .2s, box-shadow .2s',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: "'Oxanium', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8b7db5' }}>
          {attr.nome}{attr.star && ' ⭐'}
        </div>
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#c084fc' }}>{value}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          type="number" value={value} min={1}
          onChange={(e) => onChange(e.target.value)}
          style={{ textAlign: 'center', padding: '6px 8px', fontSize: 14, minWidth: 0 }}
        />
        <button
          className="ficha-add-btn"
          onClick={onAdd}
          disabled={!podeAdicionar}
          style={{
            background: corBtn.bg,
            border: `1px solid ${corBtn.border}`,
            borderRadius: 6,
            color: corBtn.color,
            cursor: podeAdicionar ? 'pointer' : 'not-allowed',
            fontFamily: "'Oxanium', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            padding: '6px 8px',
            transition: 'opacity .15s, transform .1s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            opacity: podeAdicionar ? 1 : 0.35,
          }}
        >
          +1 <span style={{ opacity: .6, fontSize: 9 }}>({attr.custo}pt)</span>
        </button>
      </div>
      <div style={{ marginTop: 8, fontSize: '0.75rem', color: pontosRestantes < 0 ? '#f87171' : '#8b7db5' }}>
        Custo: <strong>{attr.custo}pt</strong> — Restantes: <strong style={{ color: pontosRestantes < 0 ? '#f87171' : 'inherit' }}>{pontosRestantes}</strong>
      </div>
    </div>
  )
}

export default function Perfil() {
  const location = useLocation()
  const { playerId, readyForPlayerApi, isMestre } = usePlayerTarget()
  const queryClient = useQueryClient()

  const [nome, setNome] = useState('')
  const [classe, setClasse] = useState('TREINADOR')
  const [nivel, setNivel] = useState(1)
  const [xp, setXp] = useState(0)
  const [xpInput, setXpInput] = useState('')
  const [dinheiro, setDinheiro] = useState(0)
  const [attrs, setAttrs] = useState(INITIAL_ATTRS)
  const [perfil, setPerfil] = useState(null)
  const [erro, setErro] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (document.getElementById('ficha-global-styles')) return
    const tag = document.createElement('style')
    tag.id = 'ficha-global-styles'
    tag.textContent = GLOBAL_STYLES
    document.head.appendChild(tag)
    return () => tag.remove()
  }, [])

  const perfilQuery = useQuery({
    queryKey: queryKeys.perfil(playerId),
    queryFn: () => getMeuPerfil(playerId),
    enabled: readyForPlayerApi,
    staleTime: 60 * 1000,
  })

  useEffect(() => {
    if (!readyForPlayerApi) return
    if (perfilQuery.isError) {
      setErro('Erro ao carregar perfil')
      return
    }
    const p = perfilQuery.data
    if (!p) return

    setPerfil(p)
    setNome(p.nomePersonagem ?? '')
    setClasse(p.classe ?? 'TREINADOR')
    setDinheiro(p.pokedolares ?? 0)

    const normalizado = normalizarNivelXp(p.nivel ?? 1, p.xpAtual ?? 0)
    const atributosCarregados = {
      forca: Math.max(1, p.atributos?.forca ?? 1),
      speed: Math.max(1, p.atributos?.speed ?? 1),
      inteligencia: Math.max(1, p.atributos?.inteligencia ?? 1),
      tecnica: Math.max(1, p.atributos?.tecnica ?? 1),
      sabedoria: Math.max(1, p.atributos?.sabedoria ?? 1),
      percepcao: Math.max(1, p.atributos?.percepcao ?? 1),
      dominio: Math.max(1, p.atributos?.dominio ?? 1),
      respeito: Math.max(1, p.atributos?.respeito ?? 1),
    }
    setXp(normalizado.xp)
    setNivel(normalizado.nivel)
    setAttrs(atributosCarregados)

    try {
      sessionStorage.removeItem(SEM_PERFIL_SESSION_KEY)
    } catch {
      /* ignore */
    }
  }, [readyForPlayerApi, perfilQuery.data, perfilQuery.isError])

  const salvarMutation = useMutation({
    mutationFn: (payload) => salvarPerfil(payload, playerId),
    onSuccess: (saved) => {
      setPerfil(saved)
      queryClient.setQueryData(queryKeys.perfil(playerId), saved)
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
    },
    onError: (err) => setErro(err?.message || 'Erro ao salvar perfil'),
  })

  const pontos = useMemo(() => calcularPontosDisponiveis(attrs, nivel), [attrs, nivel])
  const xpNecessario = useMemo(() => calcularXpProximoNivel(nivel), [nivel])
  const xpPct = useMemo(() => Math.min(100, (xp / xpNecessario) * 100), [xp, xpNecessario])

  const hp = useMemo(() => calcularHpMaximo(attrs), [attrs])
  const stamina = useMemo(() => calcularStaminaMaxima(attrs), [attrs])
  const hab = useMemo(() => calcularHabilidade(nivel), [nivel])

  const ganharXP = useCallback(() => {
    const val = parseInt(xpInput)
    if (!val || val <= 0) return

    let novoXp = xp + val
    let novoNivel = nivel

    while (novoXp >= calcularXpProximoNivel(novoNivel)) {
      novoXp -= calcularXpProximoNivel(novoNivel)
      novoNivel++
    }
    setXp(novoXp)
    setNivel(novoNivel)
    setXpInput('')
  }, [xp, nivel, xpInput])

  const addAttr = useCallback((id) => {
    const atual = Math.max(1, attrs[id] ?? 1)
    const custo = calcularCustoEvolucao(id, atual)
    if (pontos < custo) return
    setAttrs((prev) => ({ ...prev, [id]: atual + 1 }))
  }, [attrs, pontos])

  const setAttrManual = useCallback((id, raw) => {
    const atual = Math.max(1, attrs[id] ?? 1)
    const novo = Math.max(1, parseInt(raw, 10) || 1)
    const custoMudanca = calcularCustoMudancaAtributo(id, atual, novo)
    if (custoMudanca > pontos) return
    setAttrs((prev) => ({ ...prev, [id]: novo }))
  }, [attrs, pontos])

  const salvar = async () => {
    setErro('')
    await salvarMutation.mutateAsync({
      nomePersonagem: nome,
      classe,
      pokedolares: dinheiro,
      nivel,
      xpAtual: xp,
      hpMaximo: hp,
      staminaMaxima: stamina,
      habilidade: hab,
      atributos: attrs,
    })
  }

  const resetarFicha = async () => {
    if (!isMestre) return
    setErro('')
    setNome((current) => current)
    setNivel(1)
    setXp(0)
    setAttrs(INITIAL_ATTRS)
    await salvarMutation.mutateAsync({
      nomePersonagem: nome,
      classe,
      pokedolares: dinheiro,
      nivel: 1,
      xpAtual: 0,
      hpMaximo: calcularHpMaximo(INITIAL_ATTRS),
      staminaMaxima: calcularStaminaMaxima(INITIAL_ATTRS),
      habilidade: calcularHabilidade(1),
      atributos: INITIAL_ATTRS,
    })
  }

  const avisoSemPerfil2 =
    !perfil &&
    (location.state?.semPerfil ||
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SEM_PERFIL_SESSION_KEY) === '1'))

  if (!readyForPlayerApi || perfilQuery.isLoading) {
    return <div style={{ padding: '2rem', color: '#f0ebff' }}>Carregando perfil...</div>
  }

  if (erro && !perfil) {
    return <div style={{ padding: '2rem', color: '#f87171' }}>{erro}</div>
  }

  const btnMain = {
    background: '#a855f7',
    border: 'none',
    borderRadius: 6,
    color: '#f0ebff',
    cursor: 'pointer',
    fontFamily: "'Oxanium', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.1em',
    padding: '0 18px',
    transition: 'filter .15s, transform .1s, box-shadow .15s',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }

  const s = {
    root: {
      background: 'transparent',
      color: '#f0ebff',
      fontFamily: "'Rajdhani', sans-serif",
      minHeight: '100vh',
      padding: '2rem 1rem',
      position: 'relative',
    },
    bg: {
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 0,
      background: 'radial-gradient(ellipse 70% 50% at 80% 10%, rgba(168,85,247,.07) 0%, transparent 60%), radial-gradient(ellipse 55% 55% at 10% 90%, rgba(139,85,247,.04) 0%, transparent 60%)',
    },
    page: { maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 },
    card: {
      background: 'rgba(17, 12, 30, 0.65)',
      border: '1px solid rgba(168,85,247,.18)',
      borderRadius: 16,
      padding: '1.5rem',
      marginBottom: '1rem',
      position: 'relative',
      overflow: 'hidden',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    },
    cardLine: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      background: 'linear-gradient(90deg, transparent, rgba(168,85,247,.55), transparent)',
    },
    cardTitle: {
      fontFamily: "'Oxanium', sans-serif",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.2em',
      textTransform: 'uppercase',
      color: '#c084fc',
      marginBottom: '1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    label: {
      fontFamily: "'Oxanium', sans-serif",
      fontSize: 11,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: '#8b7db5',
      marginBottom: 6,
    },
  }

  return (
    <div className="ficha-root" style={s.root}>
      {avisoSemPerfil2 && (
        <div style={{ background: 'rgba(248,113,113,.15)', border: '1px solid #f87171', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', color: '#f87171', fontSize: 14 }}>
          Crie sua ficha para acessar Pokémon e Mochila.
        </div>
      )}

      <div style={s.bg} />
      <div style={s.page}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Pokeball size={36} />
          <div>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 10, color: '#c084fc', letterSpacing: '0.08em', lineHeight: 1.7 }}>FICHA DO TREINADOR</div>
            <div style={{ fontFamily: "'Oxanium', sans-serif", fontSize: 12, color: '#8b7db5', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Sistema de RPG Pokémon</div>
          </div>
        </div>

        {/* Identidade */}
        <div className="ficha-card-anim" style={s.card}>
          <div style={s.cardLine} />
          <div style={s.cardTitle}>Identidade</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <div style={s.label}>Nome do Personagem</div>
              <input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <div style={s.label}>Classe</div>
              <select value={classe} onChange={(e) => setClasse(e.target.value)} style={{ width: 'auto', minWidth: 180 }}>
                {CLASSES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Experiência e Nível */}
        <div className="ficha-card-anim" style={s.card}>
          <div style={s.cardLine} />
          <div style={s.cardTitle}>Experiência e Nível</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 9, color: '#c084fc', background: 'rgba(168,85,247,.1)', border: '1px solid rgba(168,85,247,.25)', borderRadius: 6, padding: '6px 12px' }}>
              NÍVEL {nivel}
            </div>
            <div style={{ fontFamily: "'Oxanium', sans-serif", fontSize: 12, color: '#8b7db5', letterSpacing: '0.1em' }}>
              {xp} / {xpNecessario} XP
            </div>
          </div>
          <div style={{ background: '#0a0614', borderRadius: 99, height: 8, overflow: 'hidden', marginBottom: '1rem', border: '1px solid rgba(168,85,247,.12)' }}>
            <div style={{ height: '100%', width: `${xpPct}%`, borderRadius: 99, background: 'linear-gradient(90deg, #6d28d9, #a855f7)', transition: 'width .6s cubic-bezier(.34,1.56,.64,1)', position: 'relative' }}>
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 16, background: 'rgba(255,255,255,.25)', filter: 'blur(3px)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" value={xpInput} min={0} onChange={(e) => setXpInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ganharXP()} placeholder="Quantidade de XP" />
            <button className="ficha-btn-main" onClick={ganharXP} style={btnMain}>+ XP</button>
          </div>
        </div>

        {/* Recursos */}
        <div className="ficha-card-anim" style={s.card}>
          <div style={s.cardLine} />
          <div style={s.cardTitle}>Recursos</div>
          <div style={s.label}>Pokédólares</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontFamily: "'Oxanium', sans-serif", fontSize: 18, fontWeight: 700, color: '#c084fc', background: 'rgba(168,85,247,.1)', border: '1px solid rgba(168,85,247,.25)', borderRadius: 6, padding: '8px 14px' }}>₽</div>
            <input type="number" value={dinheiro} min={0} onChange={(e) => setDinheiro(Number(e.target.value))} style={{ width: 160 }} />
          </div>
        </div>

        {/* Atributos Derivados */}
        <div className="ficha-card-anim" style={s.card}>
          <div style={s.cardLine} />
          <div style={s.cardTitle}>Atributos Derivados</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
            <DerivedStat label="HP Máximo" value={hp} color="#FF6B6B" />
            <DerivedStat label="Stamina Máxima" value={stamina} color="#4FC3F7" />
            <DerivedStat label="Habilidade" value={hab} color="#4ADE80" />
          </div>
        </div>

        {/* Atributos Base */}
        <div className="ficha-card-anim" style={s.card}>
          <div style={s.cardLine} />
          <div style={s.cardTitle}>Atributos Base</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.25rem', fontFamily: "'Oxanium', sans-serif", fontSize: 13, color: '#8b7db5' }}>
            Pontos disponíveis:
            <span style={{ background: 'rgba(168,85,247,.15)', border: '1px solid rgba(168,85,247,.3)', borderRadius: 99, color: '#c084fc', fontWeight: 700, fontSize: 14, padding: '2px 12px' }}>
              {pontos}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
            {ATTRS.map((a) => (
              (() => {
                const custoAtual = calcularCustoEvolucao(a.id, attrs[a.id])
                return (
                  <AttrCard
                    key={a.id}
                    attr={{ ...a, custo: custoAtual }}
                    value={attrs[a.id]}
                    pontosDisponiveis={pontos}
                    onAdd={() => addAttr(a.id)}
                    onChange={(v) => setAttrManual(a.id, v)}
                  />
                )
              })()
            ))}
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div style={{ background: 'rgba(248,113,113,.15)', border: '1px solid #f87171', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', color: '#f87171' }}>
            {erro}
          </div>
        )}

        {/* Ações */}
        <div className="ficha-card-anim" style={{ display: 'flex', gap: 10, marginBottom: '1rem' }}>
          <button
            className="ficha-btn-main"
            onClick={salvar}
            disabled={salvarMutation.isPending}
            style={{ ...btnMain, padding: '12px 28px', fontSize: 14, borderRadius: 10, background: saved ? '#4ADE80' : '#a855f7', color: saved ? '#052e16' : '#f0ebff', transition: 'background .3s, box-shadow .15s' }}
          >
            {saved ? '✓ Salvo!' : salvarMutation.isPending ? 'Salvando...' : 'Salvar ficha'}
          </button>
          {isMestre && (
            <button
              className="ficha-btn-outline"
              onClick={resetarFicha}
              disabled={salvarMutation.isPending}
              style={{ background: 'transparent', border: '1px solid rgba(168,85,247,.3)', borderRadius: 10, color: '#c084fc', cursor: 'pointer', fontFamily: "'Oxanium', sans-serif", fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', padding: '12px 22px', whiteSpace: 'nowrap', transition: 'border-color .2s, color .2s, box-shadow .2s' }}
            >
              Resetar ficha
            </button>
          )}
        </div>

        {/* Time */}
        {perfil?.timePrincipal?.length > 0 && (
          <div className="ficha-card-anim" style={s.card}>
            <div style={s.cardLine} />
            <div style={s.cardTitle}>Time Principal</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: 10 }}>
              {Array.from({ length: 6 }).map((_, i) => {
                const poke = perfil.timePrincipal[i]
                return (
                  <div
                    key={i}
                    className="ficha-team-slot"
                    style={{
                      background: 'rgba(8, 6, 18, 0.6)',
                      border: '1px solid rgba(168,85,247,.15)',
                      borderRadius: 10,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'border-color .2s, box-shadow .2s',
                      opacity: poke ? 1 : 0.35,
                    }}
                  >
                    {poke ? (
                      <>
                        {poke.imagemUrl ? (
                          <img src={poke.imagemUrl} alt={poke.apelido || poke.especie} style={{ width: 28, height: 28, objectFit: 'contain', borderRadius: 6 }} />
                        ) : (
                          <MiniPokeball />
                        )}
                        <div>
                          <div style={{ fontFamily: "'Oxanium', sans-serif", fontSize: 13, fontWeight: 600, color: '#f0ebff', lineHeight: 1.2 }}>{poke.apelido || poke.especie}</div>
                          <div style={{ fontFamily: "'Oxanium', sans-serif", fontSize: 11, color: '#8b7db5', marginTop: 1 }}>Nv. {poke.nivel}</div>
                        </div>
                      </>
                    ) : (
                      <div style={{ fontFamily: "'Oxanium', sans-serif", fontSize: 12, color: '#8b7db5', textAlign: 'center', width: '100%' }}>— vazio —</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
