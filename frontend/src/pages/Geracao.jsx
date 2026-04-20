import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  excluirPokemon,
  gerarPokemonSelvagem,
  getPokemonsSelvagens,
  atualizarEstadoPokemon,
  getUsuario,
  getPokemon,
  atualizarPokemon,
  alocarAtributosPokemon,
  getMovimentos,
  getMovimentosDisponiveisPokemon,
  getPersonalidades,
  getHabilidades,
  getItens,
} from '../api'
import { usePlayerTarget } from '../context/PlayerTargetContext'
import { queryKeys } from '../query/queryKeys'

const TYPE_COLORS = {
  NORMAL: '#A8A77A',
  FOGO: '#EE8130',
  AGUA: '#6390F0',
  ELETRICO: '#F7D02C',
  GRAMA: '#7AC74C',
  GELO: '#96D9D6',
  LUTADOR: '#C22E28',
  VENENOSO: '#A33EA1',
  TERRA: '#E2BF65',
  VOADOR: '#A98FF3',
  PSIQUICO: '#F95587',
  INSETO: '#A6B91A',
  PEDRA: '#B6A136',
  FANTASMA: '#735797',
  DRAGAO: '#6F35FC',
  SOMBRIO: '#705746',
  METAL: '#B7B7CE',
  FADA: '#D685AD',
}

const POKEBOLAS = ['POKEBALL', 'GREATBALL', 'ULTRABALL', 'MASTERBALL', 'SAFARIBALL', 'LUXURYBALL', 'FRIENDLYBALL', 'OUTRA']
const ESPECIALIZACOES = ['VELOCISTA', 'ATACANTE_FISICO', 'ATACANTE_ESPECIAL', 'TANQUE', 'SUPORTE', 'UTILITARIO']
const CONDICOES_STATUS = ['PARALISADO', 'ENVENENADO', 'DORMINDO', 'QUEIMADO', 'CONGELADO', 'CONFUSO']
const MAX_ATAQUES_POR_POKEMON = 6

const ATRIBUTOS_ALOCAVEIS = [
  { key: 'atr_ataque', label: 'ATK', field: 'atrAtaque' },
  { key: 'atr_defesa', label: 'DEF', field: 'atrDefesa' },
  { key: 'atr_ataque_especial', label: 'SPA', field: 'atrAtaqueEspecial' },
  { key: 'atr_defesa_especial', label: 'SPD', field: 'atrDefesaEspecial' },
  { key: 'atr_speed', label: 'SPE', field: 'atrSpeed' },
  { key: 'atr_hp', label: 'HP', field: 'atrHp' },
  { key: 'atr_stamina', label: 'ST', field: 'atrStamina' },
  { key: 'atr_tecnica', label: 'TEC', field: 'atrTecnica' },
  { key: 'atr_respeito', label: 'RES', field: 'atrRespeito' },
]

const ATRIBUTO_EDIT_FIELD_MAP = Object.fromEntries(
  ATRIBUTOS_ALOCAVEIS.map((attr) => [attr.key, attr.field])
)

const ATRIBUTO_TOTAL_FIELD_MAP = {
  atr_ataque: 'ataque',
  atr_defesa: 'defesa',
  atr_ataque_especial: 'ataqueEspecial',
  atr_defesa_especial: 'defesaEspecial',
  atr_speed: 'speed',
  atr_hp: 'hpMaximo',
  atr_stamina: 'staminaMaxima',
  atr_tecnica: 'tecnica',
  atr_respeito: 'respeito',
}

function custoParaProximoPonto(atributo, valorAtual) {
  const valorSeguro = Math.max(0, Number(valorAtual) || 0)
  if (atributo === 'atr_hp' || atributo === 'atr_stamina') return 1
  if (valorSeguro >= 10) return 3
  if (valorSeguro >= 5) return 2
  return 1
}

function totalAtributoNoRascunho(atributo, pokemonBase, editState) {
  const campo = ATRIBUTO_EDIT_FIELD_MAP[atributo]
  const totalCampo = ATRIBUTO_TOTAL_FIELD_MAP[atributo]
  if (!campo || !totalCampo) return 0

  const baseInvestido = Number(pokemonBase?.[campo]) || 0
  const investidoAtual = Number(editState?.[campo]) || 0
  const baseTotal = Number(pokemonBase?.[totalCampo]) || 0
  return Math.max(0, baseTotal - baseInvestido + investidoAtual)
}

function hexToRgb(hex) {
  if (!hex || !hex.startsWith('#')) return null
  const n = parseInt(hex.slice(1), 16)
  return [n >> 16, (n >> 8) & 0xff, n & 0xff]
}

function getCardBackground(p) {
  const base = '#151521'
  const prim = (p && p.tipoPrimario && TYPE_COLORS[p.tipoPrimario]) ? hexToRgb(TYPE_COLORS[p.tipoPrimario]) : null
  const sec = (p && p.tipoSecundario && TYPE_COLORS[p.tipoSecundario]) ? hexToRgb(TYPE_COLORS[p.tipoSecundario]) : null
  if (!prim) return base
  const [r1, g1, b1] = prim
  if (!sec) {
    return `linear-gradient(135deg, rgba(${r1},${g1},${b1},0.25), rgba(${r1},${g1},${b1},0.05)), ${base}`
  }
  const [r2, g2, b2] = sec
  return `linear-gradient(135deg, rgba(${r1},${g1},${b1},0.25), rgba(${r2},${g2},${b2},0.15), rgba(${r1},${g1},${b1},0.05)), ${base}`
}

function formatMovimentoNomeExibicao(movimento) {
  if (!movimento) return ''
  const nomePt = (movimento.nome || '').trim()
  const nomeEn = (movimento.nomeEn || '').trim()
  if (nomePt && nomeEn) return `${nomePt} / ${nomeEn}`
  return nomePt || nomeEn || movimento.id || ''
}

function editStateFromPokemon(p) {
  if (!p) return null
  return {
    pokedexId: p.pokedexId ?? 0,
    especie: p.especie ?? '',
    apelido: p.apelido || '',
    genero: p.genero || 'SEM_GENERO',
    shiny: !!p.shiny,
    nivel: p.nivel ?? 1,
    xpAtual: p.xpAtual ?? 0,
    notas: p.notas || '',
    berryFavorita: p.berryFavorita || '',
    especializacao: p.especializacao || '',
    personalidadeId: p.personalidadeId || '',
    habilidadeId: p.habilidadeAtivaId || '',
    itemSeguradoId: p.itemSeguradoId || '',
    pokebolaCaptura: p.pokebolaCaptura || 'POKEBALL',
    spriteCustomizadoUrl: p.spriteCustomizadoUrl || '',
    statusAtuais: Array.isArray(p.statusAtuais) ? [...p.statusAtuais] : [],
    movimentoIds: (p.movimentosConhecidos || []).map((m) => m.id),
    pontosDistribuicaoDisponiveis: p.pontosDistribuicaoDisponiveis ?? 0,
    atrAtaque: p.atrAtaque ?? 0,
    atrDefesa: p.atrDefesa ?? 0,
    atrAtaqueEspecial: p.atrAtaqueEspecial ?? 0,
    atrDefesaEspecial: p.atrDefesaEspecial ?? 0,
    atrSpeed: p.atrSpeed ?? 0,
    atrHp: p.atrHp ?? 0,
    atrStamina: p.atrStamina ?? 0,
    atrTecnica: p.atrTecnica ?? p.tecnica ?? 0,
    atrRespeito: p.atrRespeito ?? p.respeito ?? 0,
    tecnica: p.tecnica ?? 0,
    respeito: p.respeito ?? 0,
    hpMaximo: p.hpMaximo ?? 0,
    staminaMaxima: p.staminaMaxima ?? 0,
    ataque: p.ataque ?? 0,
    defesa: p.defesa ?? 0,
    ataqueEspecial: p.ataqueEspecial ?? 0,
    defesaEspecial: p.defesaEspecial ?? 0,
    speed: p.speed ?? 0,
    tipoPrimario: p.tipoPrimario || 'NORMAL',
    tipoSecundario: p.tipoSecundario || '',
    imagemUrl: p.imagemUrl || '',
  }
}

export default function Geracao() {
  const { playerId, readyForPlayerApi } = usePlayerTarget()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [erro, setErro] = useState('')
  const [gerando, setGerando] = useState(false)
  const [speciesBusca, setSpeciesBusca] = useState('')
  const [nivel, setNivel] = useState(5)
  const [modoDistribuicao, setModoDistribuicao] = useState('AUTOMATICO')
  const [gerado, setGerado] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [expandedPokemon, setExpandedPokemon] = useState(null)
  const [expandedEdit, setExpandedEdit] = useState(null)
  const [expandedLoading, setExpandedLoading] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [alocandoAtributo, setAlocandoAtributo] = useState(false)
  const [pendingAlocacoes, setPendingAlocacoes] = useState({})
  const [movimentosDisponiveis, setMovimentosDisponiveis] = useState([])
  const [movimentoAdicionarId, setMovimentoAdicionarId] = useState('')

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

  const movimentosQuery = useQuery({
    queryKey: queryKeys.catalogo.movimentos,
    queryFn: getMovimentos,
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })

  const personalidadesQuery = useQuery({
    queryKey: queryKeys.catalogo.personalidades,
    queryFn: getPersonalidades,
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })

  const habilidadesQuery = useQuery({
    queryKey: queryKeys.catalogo.habilidades,
    queryFn: getHabilidades,
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })

  const itensQuery = useQuery({
    queryKey: queryKeys.catalogo.itens,
    queryFn: getItens,
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })

  const selvagens = selvagensQuery.data || []
  const listaMovimentos = movimentosQuery.data || []
  const listaPersonalidades = personalidadesQuery.data || []
  const listaHabilidades = habilidadesQuery.data || []
  const listaItens = itensQuery.data || []

  const upsertPokemonCaches = (pokemon) => {
    queryClient.setQueryData(queryKeys.pokemonsSelvagens(playerId), (prev = []) => {
      const lista = Array.isArray(prev) ? prev : []
      return [pokemon, ...lista.filter((p) => p.id !== pokemon.id)]
    })
    queryClient.setQueryData(queryKeys.pokemons(playerId), (prev = []) => {
      const lista = Array.isArray(prev) ? prev : []
      if (lista.some((p) => p.id === pokemon.id)) {
        return lista.map((p) => (p.id === pokemon.id ? pokemon : p))
      }
      return [pokemon, ...lista]
    })
  }

  const onGerar = async () => {
    setGerando(true)
    setErro('')
    try {
      const pokemon = await gerarPokemonSelvagem({
        idOuNome: speciesBusca?.trim() ? speciesBusca.trim() : null,
        nivel: Number(nivel) || 5,
        distribuirStatusAutomaticamente: modoDistribuicao === 'AUTOMATICO',
      }, playerId)
      setGerado(pokemon)
      upsertPokemonCaches(pokemon)
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

  const toggleExpand = async (pokemon) => {
    if (!pokemon?.id) return
    if (expandedId === pokemon.id) {
      setExpandedId(null)
      setExpandedPokemon(null)
      setExpandedEdit(null)
      setMovimentosDisponiveis([])
      setMovimentoAdicionarId('')
      setPendingAlocacoes({})
      return
    }

    setErro('')
    setPendingAlocacoes({})
    setExpandedId(pokemon.id)
    setExpandedLoading(true)
    try {
      const [full, disponiveis] = await Promise.all([
        getPokemon(pokemon.id, playerId),
        getMovimentosDisponiveisPokemon(pokemon.id, playerId).catch(() => []),
      ])
      setExpandedPokemon(full)
      setExpandedEdit(editStateFromPokemon(full))
      setMovimentosDisponiveis(Array.isArray(disponiveis) ? disponiveis : [])
      setMovimentoAdicionarId('')
    } catch (e) {
      setErro(e.message || 'Erro ao abrir card expandido')
      setExpandedId(null)
    } finally {
      setExpandedLoading(false)
    }
  }

  const syncExpandedPokemon = async (pokemonId) => {
    const atualizado = await getPokemon(pokemonId, playerId)
    upsertPokemonCaches(atualizado)
    if (gerado?.id === pokemonId) {
      setGerado(atualizado)
    }
    if (expandedId === pokemonId) {
      setExpandedPokemon(atualizado)
      setExpandedEdit(editStateFromPokemon(atualizado))
      setPendingAlocacoes({})
      const disponiveis = await getMovimentosDisponiveisPokemon(pokemonId, playerId).catch(() => [])
      setMovimentosDisponiveis(Array.isArray(disponiveis) ? disponiveis : [])
      setMovimentoAdicionarId('')
    }
    return atualizado
  }

  const enviarParaCaptura = async (pokemon) => {
    try {
      const atualizado = await atualizarEstadoPokemon(pokemon.id, 'CAPTURAVEL', playerId)
      upsertPokemonCaches(atualizado)
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
      upsertPokemonCaches(atualizado)
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
      if (expandedId === pokemon.id) {
        setExpandedId(null)
        setExpandedPokemon(null)
        setExpandedEdit(null)
      }
      queryClient.setQueryData(queryKeys.pokemonsSelvagens(playerId), (prev = []) =>
        (Array.isArray(prev) ? prev : []).filter((p) => p.id !== pokemon.id)
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

  const setExpandedField = (key, value) => {
    setExpandedEdit((current) => (current ? { ...current, [key]: value } : current))
  }

  const toggleStatus = (status) => {
    setExpandedEdit((current) => {
      if (!current) return current
      const list = current.statusAtuais || []
      const next = list.includes(status)
        ? list.filter((s) => s !== status)
        : [...list, status]
      return { ...current, statusAtuais: next }
    })
  }

  const addMovimento = () => {
    if (!movimentoAdicionarId) return
    setExpandedEdit((current) => {
      if (!current) return current
      const ids = current.movimentoIds || []
      if (ids.includes(movimentoAdicionarId)) return current
      if (ids.length >= MAX_ATAQUES_POR_POKEMON) return current
      return { ...current, movimentoIds: [...ids, movimentoAdicionarId] }
    })
    setMovimentoAdicionarId('')
  }

  const removeMovimento = (movimentoId) => {
    setExpandedEdit((current) => {
      if (!current) return current
      return { ...current, movimentoIds: (current.movimentoIds || []).filter((id) => id !== movimentoId) }
    })
  }

  const handleAlocarAtributo = async (atributo) => {
    if (!expandedPokemon?.id) return
    setErro('')
    const campo = ATRIBUTO_EDIT_FIELD_MAP[atributo]
    if (!campo || !expandedEdit) return

    const valorAtual = Number(expandedEdit[campo]) || 0
    const custo = custoParaProximoPonto(atributo, valorAtual)
    const saldoAtual = Number(expandedEdit.pontosDistribuicaoDisponiveis) || 0
    if (saldoAtual < custo) {
      setErro(`Pontos insuficientes para aumentar ${atributo}.`)
      return
    }

    setExpandedEdit((current) => {
      if (!current) return current
      const valor = Number(current[campo]) || 0
      return {
        ...current,
        [campo]: valor + 1,
        pontosDistribuicaoDisponiveis: Math.max(0, (Number(current.pontosDistribuicaoDisponiveis) || 0) - custo),
      }
    })
    setPendingAlocacoes((current) => ({
      ...current,
      [atributo]: (Number(current[atributo]) || 0) + 1,
    }))
  }

  const handleSalvarExpanded = async (e) => {
    e.preventDefault()
    if (!expandedPokemon?.id || !expandedEdit) return
    setErro('')
    setSavingId(expandedPokemon.id)
    try {
      await atualizarPokemon(expandedPokemon.id, {
        apelido: expandedEdit.apelido || null,
        notas: expandedEdit.notas || null,
        genero: expandedEdit.genero || 'SEM_GENERO',
        shiny: !!expandedEdit.shiny,
        personalidadeId: expandedEdit.personalidadeId || null,
        especializacao: expandedEdit.especializacao || null,
        berryFavorita: expandedEdit.berryFavorita || null,
        nivel: expandedEdit.nivel,
        xpAtual: expandedEdit.xpAtual,
        pokebolaCaptura: expandedEdit.pokebolaCaptura || undefined,
        itemSeguradoId: expandedEdit.itemSeguradoId || null,
        spriteCustomizadoUrl: expandedEdit.spriteCustomizadoUrl || null,
        habilidadeId: expandedEdit.habilidadeId || null,
        statusAtuais: expandedEdit.statusAtuais?.length ? expandedEdit.statusAtuais : null,
        movimentoIds: expandedEdit.movimentoIds || [],
      }, playerId)

      const alocacoesPendentes = Object.entries(pendingAlocacoes).filter(([, quantidade]) => Number(quantidade) > 0)
      if (alocacoesPendentes.length > 0) {
        setAlocandoAtributo(true)
        try {
          for (const [atributo, quantidade] of alocacoesPendentes) {
            for (let i = 0; i < Number(quantidade); i += 1) {
              await alocarAtributosPokemon(expandedPokemon.id, atributo, 1, playerId)
            }
          }
        } finally {
          setAlocandoAtributo(false)
        }
      }

      await syncExpandedPokemon(expandedPokemon.id)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.pokemonsSelvagens(playerId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.pokemons(playerId) }),
      ])
    } catch (err) {
      setErro(err.message || 'Erro ao salvar Pokémon')
    } finally {
      setSavingId(null)
    }
  }

  const renderExpandedForm = () => {
    if (!expandedPokemon || !expandedEdit) return null

    const movimentosAtuais = (expandedEdit.movimentoIds || [])
      .map((id) => {
        const fromCatalog = listaMovimentos.find((m) => m.id === id)
        const fromPokemon = expandedPokemon.movimentosConhecidos?.find((m) => m.id === id)
        return fromCatalog || fromPokemon || null
      })
      .filter(Boolean)

    const movimentosParaAdicionar = (movimentosDisponiveis || []).filter((m) => !(expandedEdit.movimentoIds || []).includes(m.id))
    const habilidadeSelecionada = listaHabilidades.find((h) => h.id === (expandedEdit.habilidadeId || '')) || null
    const habilidadeNome = habilidadeSelecionada?.nome || expandedPokemon?.habilidadeAtivaNome || '—'
    const habilidadeNomeEn = (habilidadeSelecionada?.nomeEn || '').trim()
    const habilidadeDescricao = (habilidadeSelecionada?.descricao || '').trim()

    return (
      <form onSubmit={handleSalvarExpanded} className="pokemon-expanded-form pokemon-expanded-form--modern">
        <div className="pokemon-expanded-header">
          <div className="pokemon-expanded-header-main">
            <div className="pokemon-expanded-avatar">
              {expandedEdit.imagemUrl ? (
                <img src={expandedEdit.imagemUrl} alt={expandedEdit.especie || 'Pokémon'} />
              ) : (
                <span className="pokemon-expanded-avatar-placeholder">?</span>
              )}
            </div>
            <div className="pokemon-expanded-title">
              <div className="pokemon-expanded-title-main">
                <input
                  value={expandedEdit.apelido}
                  onChange={(evt) => setExpandedField('apelido', evt.target.value)}
                  className="pokemon-expanded-apelido"
                  placeholder="Apelido"
                />
                <input
                  value={expandedEdit.especie}
                  className="pokemon-expanded-especie"
                  readOnly
                />
              </div>
              <div className="pokemon-expanded-badges">
                <span className={`pokemon-type-tag pokemon-type-${(expandedEdit.tipoPrimario || 'NORMAL').toLowerCase()}`}>
                  {expandedEdit.tipoPrimario || 'NORMAL'}
                </span>
                {expandedEdit.tipoSecundario ? (
                  <span className={`pokemon-type-tag pokemon-type-${expandedEdit.tipoSecundario.toLowerCase()}`}>
                    {expandedEdit.tipoSecundario}
                  </span>
                ) : null}
                <span className="pokemon-expanded-badge pokemon-expanded-badge--meta">Nível {expandedEdit.nivel}</span>
                <span className="pokemon-expanded-badge pokemon-expanded-badge--meta">XP {expandedEdit.xpAtual}</span>
                <span className="pokemon-expanded-badge pokemon-expanded-badge--meta">Pontos {expandedEdit.pontosDistribuicaoDisponiveis ?? 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pokemon-edit-grid">
          <div className="pokemon-edit-section pokemon-edit-section--glass">
            <h4>Identidade</h4>
            <div className="pokemon-edit-field">
              <label>Apelido</label>
              <input className="pokemon-edit-input" value={expandedEdit.apelido} onChange={(evt) => setExpandedField('apelido', evt.target.value)} />
            </div>
            <div className="pokemon-edit-field">
              <label>Gênero</label>
              <select className="pokemon-edit-input" value={expandedEdit.genero} onChange={(evt) => setExpandedField('genero', evt.target.value)}>
                <option value="MACHO">Macho</option>
                <option value="FEMEA">Fêmea</option>
                <option value="SEM_GENERO">Sem gênero</option>
              </select>
            </div>
            <div className="pokemon-edit-field">
              <label>
                <input type="checkbox" checked={!!expandedEdit.shiny} onChange={(evt) => setExpandedField('shiny', evt.target.checked)} />{' '}
                Shiny
              </label>
            </div>
            <div className="pokemon-edit-field">
              <label>Nível</label>
              <input type="number" min={1} max={100} className="pokemon-edit-input" value={expandedEdit.nivel} onChange={(evt) => setExpandedField('nivel', Math.max(1, Math.min(100, parseInt(evt.target.value, 10) || 1)))} />
            </div>
            <div className="pokemon-edit-field">
              <label>XP Atual</label>
              <input type="number" min={0} className="pokemon-edit-input" value={expandedEdit.xpAtual} onChange={(evt) => setExpandedField('xpAtual', Math.max(0, parseInt(evt.target.value, 10) || 0))} />
            </div>
          </div>

          <div className="pokemon-edit-section pokemon-edit-section--glass">
            <h4>Configuração</h4>
            <div className="pokemon-edit-field">
              <label>Personalidade</label>
              <select className="pokemon-edit-input" value={expandedEdit.personalidadeId} onChange={(evt) => setExpandedField('personalidadeId', evt.target.value)}>
                <option value="">—</option>
                {listaPersonalidades.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome || p.id}</option>
                ))}
              </select>
            </div>
            <div className="pokemon-edit-field">
              <label>Especialização</label>
              <select className="pokemon-edit-input" value={expandedEdit.especializacao} onChange={(evt) => setExpandedField('especializacao', evt.target.value)}>
                <option value="">—</option>
                {ESPECIALIZACOES.map((esp) => (
                  <option key={esp} value={esp}>{esp}</option>
                ))}
              </select>
            </div>
            <div className="pokemon-edit-field">
              <label>Habilidade ativa</label>
              <select className="pokemon-edit-input" value={expandedEdit.habilidadeId} onChange={(evt) => setExpandedField('habilidadeId', evt.target.value)}>
                <option value="">—</option>
                {listaHabilidades.map((h) => (
                  <option key={h.id} value={h.id}>{h.nome || h.id}</option>
                ))}
              </select>
            </div>
            <div className="pokemon-habilidade-preview">
              <p className="pokemon-habilidade-preview-title">
                {habilidadeNome}
                {habilidadeNomeEn ? ` / ${habilidadeNomeEn}` : ''}
              </p>
              <p className="pokemon-habilidade-preview-desc">{habilidadeDescricao || 'Descrição da habilidade indisponível.'}</p>
            </div>
            <div className="pokemon-edit-field">
              <label>Item segurado</label>
              <select className="pokemon-edit-input" value={expandedEdit.itemSeguradoId} onChange={(evt) => setExpandedField('itemSeguradoId', evt.target.value)}>
                <option value="">—</option>
                {listaItens.map((i) => (
                  <option key={i.id} value={i.id}>{i.nome || i.id}</option>
                ))}
              </select>
            </div>
            <div className="pokemon-edit-field">
              <label>Pokébola de captura</label>
              <select className="pokemon-edit-input" value={expandedEdit.pokebolaCaptura} onChange={(evt) => setExpandedField('pokebolaCaptura', evt.target.value)}>
                {POKEBOLAS.map((pb) => (
                  <option key={pb} value={pb}>{pb}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pokemon-edit-section pokemon-edit-section--glass">
            <h4>Status e Notas</h4>
            <div className="pokemon-edit-field">
              <label>Berry favorita</label>
              <input className="pokemon-edit-input" value={expandedEdit.berryFavorita} onChange={(evt) => setExpandedField('berryFavorita', evt.target.value)} />
            </div>
            <div className="pokemon-edit-field">
              <label>Sprite customizado URL</label>
              <input className="pokemon-edit-input" value={expandedEdit.spriteCustomizadoUrl} onChange={(evt) => setExpandedField('spriteCustomizadoUrl', evt.target.value)} />
            </div>
            <div className="pokemon-edit-field">
              <label>Condições de status</label>
              <div className="pokemon-edit-status-list">
                {CONDICOES_STATUS.map((cond) => (
                  <label key={cond} className="pokemon-edit-status-item">
                    <input type="checkbox" checked={(expandedEdit.statusAtuais || []).includes(cond)} onChange={() => toggleStatus(cond)} />
                    <span>{cond}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="pokemon-edit-field">
              <label>Notas</label>
              <textarea className="pokemon-edit-input pokemon-edit-textarea" value={expandedEdit.notas} onChange={(evt) => setExpandedField('notas', evt.target.value)} />
            </div>
          </div>
        </div>

        <div className="pokemon-edit-section pokemon-edit-section--full pokemon-edit-section--glass">
          <h4>Atributos</h4>
          <div className="pokemon-atributo-list">
            {ATRIBUTOS_ALOCAVEIS.map((attr) => {
              const valor = Number(expandedEdit[attr.field]) || 0
              const custo = custoParaProximoPonto(attr.key, valor)
              const total = totalAtributoNoRascunho(attr.key, expandedPokemon, expandedEdit)
              const saldoAtual = Number(expandedEdit.pontosDistribuicaoDisponiveis) || 0
              const bloqueadoPlayer = saldoAtual < custo
              return (
                <div className="pokemon-atributo-row" key={attr.key}>
                  <div className="pokemon-atributo-info">
                    <span className="pokemon-atributo-label">{attr.label}</span>
                    <span className="pokemon-atributo-total">Total: {total}</span>
                  </div>
                  <div className="pokemon-atributo-controls">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={alocandoAtributo || bloqueadoPlayer}
                      onClick={() => handleAlocarAtributo(attr.key)}
                      title={`Custo atual: ${custo}`}
                    >
                      +1 (custo {custo})
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>
            Totais: HP {expandedEdit.hpMaximo ?? 0} | ST {expandedEdit.staminaMaxima ?? 0} | ATK {expandedEdit.ataque ?? 0} | DEF {expandedEdit.defesa ?? 0} | SPA {expandedEdit.ataqueEspecial ?? 0} | SPD {expandedEdit.defesaEspecial ?? 0} | SPE {expandedEdit.speed ?? 0} | TEC {totalAtributoNoRascunho('atr_tecnica', expandedPokemon, expandedEdit)} | RES {totalAtributoNoRascunho('atr_respeito', expandedPokemon, expandedEdit)}
          </p>
          {usuarioMestre && (
            <p style={{ marginTop: '0.35rem', color: 'var(--text-muted)' }}>
              Mestre: Técnica {expandedEdit.tecnica ?? 0} | Respeito {expandedEdit.respeito ?? 0}
            </p>
          )}
        </div>

        <div className="pokemon-edit-section pokemon-edit-section--full pokemon-edit-section--glass">
          <h4>Golpes ({(expandedEdit.movimentoIds || []).length}/{MAX_ATAQUES_POR_POKEMON})</h4>
          <div className="pokemon-movimentos-list">
            {movimentosAtuais.length === 0 ? (
              <p className="pokemon-movimento-empty">Nenhum golpe selecionado.</p>
            ) : movimentosAtuais.map((mov) => (
              <div key={mov.id} className="pokemon-movimento-card pokemon-movimento-card--typed">
                <div className="pokemon-movimento-card-inner">
                  <div className="pokemon-movimento-card-header">
                    <div className="pokemon-movimento-card-title-block">
                      <span className="pokemon-movimento-nome">{formatMovimentoNomeExibicao(mov)}</span>
                      {mov.tipo && (
                        <span className={`pokemon-type-tag pokemon-type-${String(mov.tipo).toLowerCase()}`}>{mov.tipo}</span>
                      )}
                    </div>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeMovimento(mov.id)}>
                      Remover
                    </button>
                  </div>
                  <div className="pokemon-movimento-card-body">
                    <div className="pokemon-movimento-stat-row">
                      <span className="pokemon-movimento-stat-label">Categoria</span>
                      <span>{mov.categoria || '—'}</span>
                    </div>
                    <div className="pokemon-movimento-stat-row">
                      <span className="pokemon-movimento-stat-label">Custo de stamina</span>
                      <span>{mov.custoStamina != null ? mov.custoStamina : '—'}</span>
                    </div>
                    <div className="pokemon-movimento-stat-row">
                      <span className="pokemon-movimento-stat-label">Dado de dano</span>
                      <span>{mov.dadoDeDano || '—'}</span>
                    </div>
                    <div className="pokemon-movimento-desc">
                      <span className="pokemon-movimento-stat-label">Efeito</span>
                      <p>{mov.descricaoEfeito || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {(expandedEdit.movimentoIds || []).length < MAX_ATAQUES_POR_POKEMON && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <select className="pokemon-edit-input" value={movimentoAdicionarId} onChange={(evt) => setMovimentoAdicionarId(evt.target.value)}>
                <option value="">Selecione um golpe para adicionar</option>
                {movimentosParaAdicionar.map((mov) => (
                  <option key={mov.id} value={mov.id}>{formatMovimentoNomeExibicao(mov)}</option>
                ))}
              </select>
              <button type="button" className="btn btn-primary" onClick={addMovimento} disabled={!movimentoAdicionarId}>
                Adicionar golpe
              </button>
            </div>
          )}
        </div>

        <div className="pokemon-expanded-form-actions">
          <button type="submit" className="btn btn-primary" disabled={savingId === expandedPokemon.id || alocandoAtributo}>
            {savingId === expandedPokemon.id ? 'Salvando...' : 'Salvar edição'}
          </button>
        </div>
      </form>
    )
  }

  const renderPokemon = (pokemon) => (
    <div
      key={pokemon.id}
      className={`pokemon-banner-card ${expandedId === pokemon.id ? 'is-expanded' : ''}`}
      style={{ background: getCardBackground(pokemon) }}
      onClick={() => toggleExpand(pokemon)}
      role="button"
      tabIndex={0}
      aria-expanded={expandedId === pokemon.id}
      aria-label={expandedId === pokemon.id ? `Recolher ${pokemon.apelido || pokemon.especie}` : `Expandir ${pokemon.apelido || pokemon.especie}`}
      onKeyDown={(evt) => evt.key === 'Enter' && toggleExpand(pokemon)}
    >
      <div className="pokemon-banner-card-inner">
        <div className="pokemon-banner-image">
          {pokemon.imagemUrl ? (
            <img src={pokemon.imagemUrl} alt={pokemon.apelido || pokemon.especie} />
          ) : (
            <span className="pokemon-banner-placeholder">?</span>
          )}
        </div>
        <div className="pokemon-banner-main">
          <h2 className="pokemon-banner-apelido">{pokemon.apelido || pokemon.especie || '???'}</h2>
          <p className="pokemon-banner-especie">#{pokemon.pokedexId} · {pokemon.especie || '???'}</p>
          <div className="pokemon-banner-meta">
            <span>Lv. {pokemon.nivel}</span>
            <span>{(pokemon.movimentosConhecidos || []).length} ataques</span>
            <span>Hab.: {pokemon.habilidadeAtivaNome || '—'}</span>
            <span>Estado: {pokemon.estado || 'ATIVO'}</span>
            <span>Origem: {pokemon.origem || 'SELVAGEM'}</span>
            <span>HP {pokemon.hpAtual}/{pokemon.hpMaximo}</span>
            <span>Pontos: {pokemon.pontosDistribuicaoDisponiveis ?? 0}</span>
            <span>Tec/Res: {pokemon.tecnica ?? 0}/{pokemon.respeito ?? 0}</span>
            <span className="pokemon-banner-tipos">
              {[pokemon.tipoPrimario, pokemon.tipoSecundario].filter(Boolean).map((tipo) => (
                <span key={tipo} className={`pokemon-type-tag pokemon-type-${String(tipo).toLowerCase()}`}>{tipo}</span>
              ))}
            </span>
          </div>
        </div>
        <div className="pokemon-banner-actions" onClick={(evt) => evt.stopPropagation()}>
          <button className="btn btn-secondary" onClick={() => enviarParaCaptura(pokemon)}>Enviar para captura</button>
          <button className="btn btn-secondary" onClick={() => salvarParaDepois(pokemon)}>Salvar para depois</button>
          <button className="btn btn-danger" onClick={() => deletar(pokemon)}>Deletar</button>
        </div>
      </div>

      {expandedId === pokemon.id && (
        <div className="pokemon-banner-expanded" onClick={(evt) => evt.stopPropagation()}>
          {expandedLoading ? <p>Carregando...</p> : renderExpandedForm()}
        </div>
      )}
    </div>
  )

  if (!readyForPlayerApi) {
    return (
      <div className="container container--wide">
        <p>Carregando...</p>
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
            <input type="text" value={speciesBusca} onChange={(evt) => setSpeciesBusca(evt.target.value)} placeholder="Ex.: Pikachu ou 25" />
          </div>
          <div className="form-group">
            <label>Nível</label>
            <input type="number" min="1" max="100" value={nivel} onChange={(evt) => setNivel(evt.target.value)} />
          </div>
          <div className="form-group">
            <label>Distribuição de status</label>
            <select value={modoDistribuicao} onChange={(evt) => setModoDistribuicao(evt.target.value)}>
              <option value="AUTOMATICO">Automática na geração</option>
              <option value="MESTRE">Manual (mestre distribui depois)</option>
            </select>
            {!usuarioMestre && modoDistribuicao === 'MESTRE' ? (
              <small style={{ color: 'var(--text-muted)' }}>
                Modo manual pode ser salvo sem distribuição. A distribuição posterior depende das permissões do usuário.
              </small>
            ) : null}
          </div>
        </div>
        <button className="btn btn-primary" disabled={gerando} onClick={onGerar}>
          {gerando ? 'Gerando...' : 'Gerar Pokémon'}
        </button>
      </div>

      {erro && <p style={{ color: 'var(--danger)' }}>{erro}</p>}

      <section className="card">
        <h3>Selvagens salvos</h3>
        <p className="pokemon-banner-hint">Cards no formato da box do treinador: clique para expandir, visualizar tudo e editar no próprio card.</p>
        {selvagensQuery.isLoading ? <p>Carregando...</p> : null}
        {!selvagensQuery.isLoading && selvagens.length === 0 ? <p>Nenhum Pokémon selvagem salvo.</p> : null}
        <div className="pokemon-banner-list">
          {selvagens.map(renderPokemon)}
        </div>
      </section>
    </div>
  )
}
