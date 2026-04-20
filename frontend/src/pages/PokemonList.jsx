import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getMeuPerfil, getUsuario, criarPokemon, getPokemon, atualizarPokemon, colocarNoTime, removerDoTime, excluirPokemon, getSpeciesCatalogLocal, getSpeciesCatalogLocalVersion, getMovimentos, getMovimentosDisponiveisPokemon, getPersonalidades, getItens, getHabilidades, previewGanhoXpPokemon, mestreDefinirTiposPokemon, alocarAtributosPokemon, listarEvolucoesPossiveisPokemon, evoluirPokemon } from '../api'
import { usePlayerTarget } from '../context/PlayerTargetContext'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../query/queryKeys'

const PAGE_SIZE = 20
const SPECIES_CACHE_KEY = 'pokemonamethyst:species-local-cache:v1'
const SPECIES_CACHE_VERSION_KEY = 'pokemonamethyst:species-local-version:v1'

const TIPOS = ['NORMAL', 'FOGO', 'AGUA', 'ELETRICO', 'GRAMA', 'GELO', 'LUTADOR', 'VENENOSO', 'TERRA', 'VOADOR', 'PSIQUICO', 'INSETO', 'PEDRA', 'FANTASMA', 'DRAGAO', 'SOMBRIO', 'METAL', 'FADA']

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

/** Fundo no mesmo estilo do card de Pokémon, usando só o tipo do movimento. */
function getMoveCardBackground(tipo) {
  const t = tipo || 'NORMAL'
  return getCardBackground({ tipoPrimario: t, tipoSecundario: null })
}

function formatMovimentoNomeExibicao(m) {
  if (!m) return ''
  const pt = (m.nome || '').trim()
  const en = (m.nomeEn || '').trim()
  if (pt && en) return `${pt} / ${en}`
  return pt || en || ''
}

const POKEBOLAS = ['POKEBALL', 'GREATBALL', 'ULTRABALL', 'MASTERBALL', 'SAFARIBALL', 'LUXURYBALL', 'FRIENDLYBALL', 'OUTRA']
const ESPECIALIZACOES = ['VELOCISTA', 'ATACANTE_FISICO', 'ATACANTE_ESPECIAL', 'TANQUE', 'SUPORTE', 'UTILITARIO']
const CONDICOES_STATUS = ['PARALISADO', 'ENVENENADO', 'DORMINDO', 'QUEIMADO', 'CONGELADO', 'CONFUSO']
const MAX_ATAQUES_POR_POKEMON = 6

const ATRIBUTO_EDIT_FIELD_MAP = {
  atr_ataque: 'atrAtaque',
  atr_defesa: 'atrDefesa',
  atr_ataque_especial: 'atrAtaqueEspecial',
  atr_defesa_especial: 'atrDefesaEspecial',
  atr_speed: 'atrSpeed',
  atr_hp: 'atrHp',
  atr_stamina: 'atrStamina',
  atr_tecnica: 'atrTecnica',
  atr_respeito: 'atrRespeito',
}

function editStateFromPokemon(p) {
  if (!p) return null
  return {
    especie: p.especie ?? '',
    tipoPrimario: p.tipoPrimario ?? 'NORMAL',
    tipoSecundario: p.tipoSecundario || '',
    tipoPrimarioEspecie: p.tipoPrimarioEspecie ?? p.tipoPrimario ?? 'NORMAL',
    tipoSecundarioEspecie: p.tipoSecundarioEspecie || '',
    tiposComOverride: !!p.tiposComOverride,
    pokedexId: p.pokedexId ?? 0,
    apelido: p.apelido || '',
    imagemUrl: p.imagemUrl || '',
    notas: p.notas || '',
    genero: p.genero || 'SEM_GENERO',
    shiny: !!p.shiny,
    personalidadeId: p.personalidadeId || '',
    especializacao: p.especializacao || '',
    berryFavorita: p.berryFavorita || '',
    nivelDeVinculo: p.nivelDeVinculo ?? 0,
    nivel: p.nivel ?? 1,
    xpAtual: p.xpAtual ?? 0,
    pokebolaCaptura: p.pokebolaCaptura || 'POKEBALL',
    itemSeguradoId: p.itemSeguradoId || '',
    spriteCustomizadoUrl: p.spriteCustomizadoUrl || '',
    hpMaximo: p.hpMaximo ?? 20,
    staminaMaxima: p.staminaMaxima ?? 10,
    ataque: p.ataque ?? 0,
    ataqueEspecial: p.ataqueEspecial ?? 0,
    defesa: p.defesa ?? 0,
    defesaEspecial: p.defesaEspecial ?? 0,
    speed: p.speed ?? 0,
    ivClass: p.ivClass || '',
    pontosDistribuicaoDisponiveis: p.pontosDistribuicaoDisponiveis ?? 0,
    hpBaseRng: p.hpBaseRng ?? 0,
    staminaBaseRng: p.staminaBaseRng ?? 0,
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
    statusAtuais: Array.isArray(p.statusAtuais) ? [...p.statusAtuais] : [],
    movimentoIds: (p.movimentosConhecidos || []).map((m) => m.id),
    habilidadeId: p.habilidadeAtivaId || '',
  }
}

function Field({ label, children, className = '' }) {
  return (
    <div className={`pokemon-edit-field ${className}`}>
      <label>{label}</label>
      {children}
    </div>
  )
}

function ExpandedForm({
  expandedEdit,
  setExpandedEdit,
  listaMovimentos,
  listaMovimentosDisponiveis,
  listaPersonalidades,
  listaHabilidades,
  listaItens,
  expandedPokemon,
  onSalvar,
  savingPokemon,
  erro,
  onAbrirCatalogo,
  addMovimento,
  removeMovimento,
  TIPOS,
  POKEBOLAS,
  ESPECIALIZACOES,
  CONDICOES_STATUS,
  onGanharXp,
  ganharXpLoading,
  acoesBloqueadas,
  usuarioMestre,
  onRestaurarTiposEspecie,
  onAlocarAtributo,
  onSetAtributoValor,
  alocandoAtributo,
  custoParaProximo,
  evolucoesPossiveis,
  onEvoluir,
  pendingResumo,
  pendingEvolucaoPokedexId,
}) {
  const [movimentoBusca, setMovimentoBusca] = useState('')
  const [xpGanho, setXpGanho] = useState('')
  const set = (key, value) => setExpandedEdit((e) => (e ? { ...e, [key]: value } : e))
  const movimentosAtuais = (expandedEdit.movimentoIds || [])
    .map((id) => {
      const fromCatalog = listaMovimentos.find((m) => m.id === id)
      const fromPokemon = expandedPokemon?.movimentosConhecidos?.find((m) => m.id === id)
      if (!fromCatalog && !fromPokemon) return null
      return { ...(fromCatalog || {}), ...(fromPokemon || {}) }
    })
    .filter(Boolean)
  const movimentosDisponiveis = (listaMovimentosDisponiveis || []).filter((m) => !(expandedEdit.movimentoIds || []).includes(m.id))
  const buscaTrim = (movimentoBusca || '').trim().toLowerCase()
  const movimentosFiltrados = buscaTrim
    ? movimentosDisponiveis.filter((m) => {
        const nome = (m.nome || '').toLowerCase()
        const nomeEn = (m.nomeEn || '').toLowerCase()
        const tipo = (m.tipo || '').toLowerCase()
        return nome.includes(buscaTrim) || nomeEn.includes(buscaTrim) || tipo.includes(buscaTrim)
      })
    : movimentosDisponiveis
  const toggleStatus = (cond) => {
    setExpandedEdit((e) => {
      if (!e) return e
      const list = e.statusAtuais || []
      const idx = list.indexOf(cond)
      const next = idx >= 0 ? list.filter((_, i) => i !== idx) : [...list, cond]
      return { ...e, statusAtuais: next }
    })
  }

  const hpPercent = 100
  const staminaPercent = 100
  const nivelAtual = Math.max(1, Math.min(100, Number(expandedEdit.nivel) || 1))
  const xpAtual = Math.max(0, Number(expandedEdit.xpAtual) || 0)
  const xpNivelAtual = 5 * (nivelAtual - 1) * nivelAtual
  const xpProximoNivel = nivelAtual >= 100 ? xpNivelAtual : 5 * nivelAtual * (nivelAtual + 1)
  const xpFaixaNivel = Math.max(1, xpProximoNivel - xpNivelAtual)
  const xpNoNivel = Math.max(0, Math.min(xpFaixaNivel, xpAtual - xpNivelAtual))
  const xpPercent = nivelAtual >= 100 ? 100 : Math.max(0, Math.min(100, (xpNoNivel / xpFaixaNivel) * 100))
  const xpFaltanteProximoNivel = nivelAtual >= 100 ? 0 : Math.max(0, xpProximoNivel - xpAtual)
  const isMestre = !!usuarioMestre?.mestre
  const saldoAtual = Number(expandedEdit.pontosDistribuicaoDisponiveis) || 0
  const habilidadeSelecionada = listaHabilidades.find((hab) => hab.id === (expandedEdit.habilidadeId || '')) || null
  const habilidadeDescricao = (habilidadeSelecionada?.descricao || habilidadeSelecionada?.descricaoEfeito || '').trim()
  const bonusHpStamina = Math.max(1, Math.min(10, Math.max(1, Number(expandedEdit.nivel) || 1)))
  const hpMaximoRascunho = (Math.max(0, Number(expandedEdit.hpBaseRng) || 0)
    + Math.max(0, Number(expandedEdit.atrHp) || 0)
    + bonusHpStamina)
  const staminaMaximaRascunho = (Math.max(0, Number(expandedEdit.staminaBaseRng) || 0)
    + Math.max(0, Number(expandedEdit.atrStamina) || 0)
    + bonusHpStamina)

  const atributoRows = [
    { key: 'atr_ataque', label: 'Ataque', valor: Number(expandedEdit.atrAtaque) || 0, total: Number(expandedEdit.ataque) || 0 },
    { key: 'atr_defesa', label: 'Defesa', valor: Number(expandedEdit.atrDefesa) || 0, total: Number(expandedEdit.defesa) || 0 },
    { key: 'atr_ataque_especial', label: 'Ataque especial', valor: Number(expandedEdit.atrAtaqueEspecial) || 0, total: Number(expandedEdit.ataqueEspecial) || 0 },
    { key: 'atr_defesa_especial', label: 'Defesa especial', valor: Number(expandedEdit.atrDefesaEspecial) || 0, total: Number(expandedEdit.defesaEspecial) || 0 },
    { key: 'atr_speed', label: 'Velocidade', valor: Number(expandedEdit.atrSpeed) || 0, total: Number(expandedEdit.speed) || 0 },
    { key: 'atr_hp', label: 'HP investido', valor: Number(expandedEdit.atrHp) || 0, total: hpMaximoRascunho },
    { key: 'atr_stamina', label: 'Stamina investida', valor: Number(expandedEdit.atrStamina) || 0, total: staminaMaximaRascunho },
    { key: 'atr_tecnica', label: 'Técnica investida', valor: Number(expandedEdit.atrTecnica) || 0, total: Number(expandedEdit.tecnica) || 0 },
    { key: 'atr_respeito', label: 'Respeito investido', valor: Number(expandedEdit.atrRespeito) || 0, total: Number(expandedEdit.respeito) || 0 },
  ]

  return (
    <form onSubmit={onSalvar} className="pokemon-expanded-form pokemon-expanded-form--modern">
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
                onChange={(e) => set('apelido', e.target.value)}
                className="pokemon-expanded-apelido"
                placeholder="Apelido"
              />
              <input
                value={expandedEdit.especie}
                className="pokemon-expanded-especie"
                placeholder="Espécie"
                readOnly
              />
            </div>
            <div className="pokemon-expanded-badges">
              <span
                className={`pokemon-type-tag pokemon-type-${(expandedEdit.tipoPrimario || 'NORMAL').toLowerCase()}`}
              >
                {expandedEdit.tipoPrimario || 'NORMAL'}
              </span>
              {expandedEdit.tipoSecundario && (
                <span
                  className={`pokemon-type-tag pokemon-type-${expandedEdit.tipoSecundario.toLowerCase()}`}
                >
                  {expandedEdit.tipoSecundario}
                </span>
              )}
              <span className="pokemon-expanded-badge pokemon-expanded-badge--meta">
                Nível{' '}
                <input
                  type="number"
                  min={1}
                  value={expandedEdit.nivel}
                  onChange={(e) => set('nivel', parseInt(e.target.value, 10) || 1)}
                />
              </span>
              <span className="pokemon-expanded-badge pokemon-expanded-badge--meta">
                Gênero{' '}
                <select
                  value={expandedEdit.genero}
                  onChange={(e) => set('genero', e.target.value)}
                >
                  <option value="MACHO">♂️</option>
                  <option value="FEMEA">♀️</option>
                  <option value="SEM_GENERO">Sem gênero</option>
                </select>
              </span>
            </div>
          </div>
        </div>
        <div className="pokemon-expanded-header-actions">
          <button type="button" className="btn btn-secondary" onClick={onAbrirCatalogo}>
            Buscar na PokéAPI
          </button>
          {Array.isArray(evolucoesPossiveis) && evolucoesPossiveis.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {evolucoesPossiveis.map((evo) => {
                const trigger = String(evo.triggerType || '').toUpperCase()
                const minLevel = Number(evo.minLevel || 0)
                const nivelAtual = Number(expandedEdit.nivel || 1)
                const disponivelAgora = trigger === 'LEVEL_UP' ? nivelAtual >= minLevel : !!evo.disponivelAgora
                const estaPendente = Number(pendingEvolucaoPokedexId) === Number(evo.pokedexId)
                return (
                  <button
                    key={`${evo.pokedexId}-${evo.triggerType}-${evo.minLevel || 0}`}
                    type="button"
                    className="btn btn-primary"
                    disabled={savingPokemon || (!disponivelAgora)}
                    onClick={() => onEvoluir && onEvoluir(evo.pokedexId)}
                    title={disponivelAgora ? '' : (evo.minLevel ? `Necessário nível ${evo.minLevel}` : 'Evolução indisponível no momento')}
                  >
                    {estaPendente ? 'Evolução marcada' : 'Marcar evolução'} → {evo.especie || `#${evo.pokedexId}`}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="pokemon-expanded-bars">
        <div className="pokemon-expanded-bar">
          <div className="pokemon-expanded-bar-header">
            <span className="pokemon-expanded-bar-label pokemon-expanded-bar-label--hp">HP (Vida)</span>
            <span className="pokemon-expanded-bar-value">Total {hpMaximoRascunho}</span>
          </div>
          <div className="pokemon-expanded-bar-track">
            <div
              className={`pokemon-expanded-bar-fill pokemon-expanded-bar-fill--hp ${hpPercent < 30 ? 'is-low' : ''}`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>
        <div className="pokemon-expanded-bar">
          <div className="pokemon-expanded-bar-header">
            <span className="pokemon-expanded-bar-label pokemon-expanded-bar-label--st">ST (Stamina)</span>
            <span className="pokemon-expanded-bar-value">Total {staminaMaximaRascunho}</span>
          </div>
          <div className="pokemon-expanded-bar-track">
            <div
              className="pokemon-expanded-bar-fill pokemon-expanded-bar-fill--st"
              style={{ width: `${staminaPercent}%` }}
            />
          </div>
        </div>
        <div className="pokemon-expanded-bar">
          <div className="pokemon-expanded-bar-header">
            <span className="pokemon-expanded-bar-label pokemon-expanded-bar-label--xp">XP até próximo nível</span>
            <span className="pokemon-expanded-bar-value">
              {nivelAtual >= 100 ? 'Nível máximo' : `Faltam ${xpFaltanteProximoNivel} XP`}
            </span>
          </div>
          <div className="pokemon-expanded-bar-track">
            <div
              className="pokemon-expanded-bar-fill pokemon-expanded-bar-fill--xp"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pokemon-expanded-main-grid">
        <div className="pokemon-expanded-main-column">
          <div className="pokemon-edit-section pokemon-edit-section--glass">
            <h4>Identificação</h4>
            <div className="pokemon-expanded-inline-fields">
              <Field label="Tipo primário">
                <select
                  value={expandedEdit.tipoPrimario}
                  className="pokemon-edit-input"
                  disabled={!usuarioMestre?.mestre}
                  onChange={(e) => {
                    const v = e.target.value
                    setExpandedEdit((ed) => {
                      if (!ed) return ed
                      let sec = ed.tipoSecundario
                      if (sec && sec === v) sec = ''
                      return { ...ed, tipoPrimario: v, tipoSecundario: sec }
                    })
                  }}
                >
                  {TIPOS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tipo secundário">
                <select
                  value={expandedEdit.tipoSecundario}
                  className="pokemon-edit-input"
                  disabled={!usuarioMestre?.mestre}
                  onChange={(e) => set('tipoSecundario', e.target.value)}
                >
                  <option value="">—</option>
                  {TIPOS.filter((t) => t !== expandedEdit.tipoPrimario).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </Field>
            </div>
            {usuarioMestre?.mestre && (
              <p className="pokemon-mestre-tipos-hint" style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Tipos da espécie (Pokédex):{' '}
                <strong>{expandedEdit.tipoPrimarioEspecie || '—'}</strong>
                {expandedEdit.tipoSecundarioEspecie ? (
                  <> / <strong>{expandedEdit.tipoSecundarioEspecie}</strong></>
                ) : null}
                . {expandedEdit.tiposComOverride ? 'Este Pokémon usa tipos personalizados.' : 'Altere acima para sobrescrever só nesta instância.'}
                {typeof onRestaurarTiposEspecie === 'function' && (
                  <>
                    {' '}
                    <button type="button" className="btn btn-secondary btn-sm" onClick={onRestaurarTiposEspecie}>
                      Restaurar tipos da espécie
                    </button>
                  </>
                )}
              </p>
            )}
            <div className="pokemon-expanded-inline-fields">
              <Field label="Shiny">
                <input
                  type="checkbox"
                  checked={expandedEdit.shiny}
                  onChange={(e) => set('shiny', e.target.checked)}
                />
              </Field>
              <Field label="Pokébola de captura">
                <select
                  value={expandedEdit.pokebolaCaptura}
                  onChange={(e) => set('pokebolaCaptura', e.target.value)}
                  className="pokemon-edit-input"
                >
                  {POKEBOLAS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="pokemon-expanded-inline-fields">
              <Field label="XP atual">
                <input
                  type="number"
                  min={0}
                  value={expandedEdit.xpAtual}
                  onChange={(e) => set('xpAtual', parseInt(e.target.value, 10) || 0)}
                  className="pokemon-edit-input pokemon-edit-input--num"
                />
              </Field>
              <Field label="Ganhar XP">
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="number"
                    min={1}
                    value={xpGanho}
                    onChange={(e) => setXpGanho(e.target.value)}
                    placeholder="Ex.: 15"
                    className="pokemon-edit-input pokemon-edit-input--num"
                    style={{ width: 120 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={ganharXpLoading || acoesBloqueadas || !xpGanho || parseInt(xpGanho, 10) <= 0}
                    onClick={() => {
                      const valor = parseInt(xpGanho, 10)
                      if (!valor || valor <= 0) return
                      Promise.resolve(onGanharXp && onGanharXp(expandedPokemon?.id, valor)).finally(() => setXpGanho(''))
                    }}
                  >
                    {ganharXpLoading ? '...' : 'Adicionar ao rascunho'}
                  </button>
                </div>
              </Field>
              <Field label="Nível de vínculo">
                <input
                  type="number"
                  min={0}
                  value={expandedEdit.nivelDeVinculo}
                  onChange={(e) => set('nivelDeVinculo', parseInt(e.target.value, 10) || 0)}
                  className="pokemon-edit-input pokemon-edit-input--num"
                />
              </Field>
            </div>
          </div>

          <div className="pokemon-edit-section pokemon-edit-section--glass">
            <h4>Detalhes e anotações</h4>
            <Field label="Notas">
              <textarea
                value={expandedEdit.notas}
                onChange={(e) => set('notas', e.target.value)}
                className="pokemon-edit-input pokemon-edit-textarea"
                rows={3}
              />
            </Field>
          </div>
        </div>

        <div className="pokemon-expanded-main-column">
          <div className="pokemon-edit-section pokemon-edit-section--glass">
            <h4>Personalidade e preferências</h4>
            <Field label="Personalidade">
              <select
                value={expandedEdit.personalidadeId}
                onChange={(e) => set('personalidadeId', e.target.value)}
                className="pokemon-edit-input"
              >
                <option value="">—</option>
                {listaPersonalidades.map((per) => (
                  <option key={per.id} value={per.id}>{per.nome}</option>
                ))}
              </select>
            </Field>
            <Field label="Fruta favorita (berry)">
              <input
                value={expandedEdit.berryFavorita}
                onChange={(e) => set('berryFavorita', e.target.value)}
                className="pokemon-edit-input"
              />
            </Field>
            <Field label="Especialização">
              <select
                value={expandedEdit.especializacao}
                onChange={(e) => set('especializacao', e.target.value)}
                className="pokemon-edit-input"
              >
                <option value="">—</option>
                {ESPECIALIZACOES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="pokemon-edit-section pokemon-edit-section--glass pokemon-expanded-atributos">
            <h4>Atributos e distribuição</h4>
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <p style={{ margin: '0 0 0.75rem', color: saldoAtual < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                Classe IV: <strong>{expandedEdit.ivClass || '—'}</strong> | Pontos disponíveis: <strong>{saldoAtual}</strong>
              </p>
              {saldoAtual < 0 && isMestre && (
                <p style={{ margin: '0 0 0.75rem', color: 'var(--danger)' }}>
                  Atenção: você está excedendo o limite recomendado de pontos deste Pokémon.
                </p>
              )}
              <p style={{ margin: '0 0 0.75rem', color: 'var(--text-muted)' }}>
                A distribuição é aplicada no banco somente ao clicar em <strong>Salvar</strong>.
              </p>
              <div className="pokemon-atributo-list">
                {atributoRows.map((row) => {
                  const custo = custoParaProximo ? custoParaProximo(row.key, row.valor) : 1
                  const bloqueadoPlayer = !isMestre && saldoAtual < custo
                  return (
                    <div key={row.key} className="pokemon-atributo-row">
                      <div className="pokemon-atributo-info">
                        <span className="pokemon-atributo-label">{row.label}</span>
                        <span className="pokemon-atributo-total">Total {row.total}</span>
                      </div>
                      <div className="pokemon-atributo-controls">
                        <input
                          type="number"
                          min={0}
                          value={row.valor}
                          className="pokemon-edit-input pokemon-edit-input--num"
                          onChange={(e) => onSetAtributoValor && onSetAtributoValor(row.key, e.target.value)}
                          onBlur={(e) => onSetAtributoValor && onSetAtributoValor(row.key, e.target.value)}
                          inputMode="numeric"
                          aria-label={`Valor investido de ${row.label}`}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          disabled={alocandoAtributo || bloqueadoPlayer}
                          onClick={() => onAlocarAtributo && onAlocarAtributo(row.key)}
                          title={`Custo atual: ${custo}`}
                        >
                          +1 (custo {custo})
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              {!isMestre && (
                <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>
                  Jogadores não podem ultrapassar os pontos disponíveis.
                </p>
              )}
            </div>
          </div>

          <div className="pokemon-edit-section pokemon-edit-section--glass">
            <h4>Status e itens</h4>
            <Field label="Habilidade ativa">
              <select
                value={expandedEdit.habilidadeId || ''}
                onChange={(e) => set('habilidadeId', e.target.value)}
                className="pokemon-edit-input"
              >
                <option value="">Sortear automaticamente</option>
                {listaHabilidades.map((hab) => (
                  <option key={hab.id} value={hab.id}>{hab.nome || hab.nomeEn || hab.id}</option>
                ))}
              </select>
              <div className="pokemon-habilidade-preview">
                {habilidadeSelecionada ? (
                  <>
                    <p className="pokemon-habilidade-preview-title">
                      {habilidadeSelecionada.nome || habilidadeSelecionada.nomeEn || 'Habilidade selecionada'}
                    </p>
                    <p className="pokemon-habilidade-preview-desc">
                      {habilidadeDescricao || 'Descrição ainda não disponível para esta habilidade.'}
                    </p>
                  </>
                ) : (
                  <p className="pokemon-habilidade-preview-desc">
                    Selecione uma habilidade para visualizar a descrição aqui.
                  </p>
                )}
              </div>
            </Field>
            <Field label="Item segurado">
              <select
                value={expandedEdit.itemSeguradoId}
                onChange={(e) => set('itemSeguradoId', e.target.value)}
                className="pokemon-edit-input"
              >
                <option value="">—</option>
                {listaItens.map((item) => (
                  <option key={item.id} value={item.id}>{item.nome || item.id}</option>
                ))}
              </select>
            </Field>
            <div className="pokemon-edit-field">
              <label>Condições de status</label>
              <div className="pokemon-edit-status-list">
                {CONDICOES_STATUS.map((c) => (
                  <label key={c} className="pokemon-edit-status-item">
                    <input
                      type="checkbox"
                      checked={(expandedEdit.statusAtuais || []).includes(c)}
                      onChange={() => toggleStatus(c)}
                    />
                    <span>{c}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pokemon-edit-section pokemon-edit-section--full pokemon-edit-section--glass">
        <h4>Golpes &amp; Técnicas ({movimentosAtuais.length}/{MAX_ATAQUES_POR_POKEMON})</h4>
        <div className="pokemon-movimentos-list">
          {movimentosAtuais.map((m) => (
            <div
              key={m.id}
              className="pokemon-movimento-card pokemon-movimento-card--typed"
              style={{ background: getMoveCardBackground(m.tipo) }}
            >
              <div className="pokemon-movimento-card-inner">
                <div className="pokemon-movimento-card-header">
                  <div className="pokemon-movimento-card-title-block">
                    <span className="pokemon-movimento-nome">{formatMovimentoNomeExibicao(m)}</span>
                    {m.tipo && (
                      <span className={`pokemon-type-tag pokemon-type-${String(m.tipo).toLowerCase()}`}>{m.tipo}</span>
                    )}
                  </div>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeMovimento(m.id)}>Remover</button>
                </div>
                <div className="pokemon-movimento-card-body">
                  <div className="pokemon-movimento-stat-row">
                    <span className="pokemon-movimento-stat-label">Categoria</span>
                    <span>{m.categoria || '—'}</span>
                  </div>
                  <div className="pokemon-movimento-stat-row">
                    <span className="pokemon-movimento-stat-label">Custo de stamina</span>
                    <span>{m.custoStamina != null ? m.custoStamina : '—'}</span>
                  </div>
                  <div className="pokemon-movimento-stat-row">
                    <span className="pokemon-movimento-stat-label">Dado de dano</span>
                    <span>{m.dadoDeDano || '—'}</span>
                  </div>
                  <div className="pokemon-movimento-desc">
                    <span className="pokemon-movimento-stat-label">Efeito</span>
                    <p>{m.descricaoEfeito || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {movimentosAtuais.length < MAX_ATAQUES_POR_POKEMON && (
          <div className="pokemon-movimento-add">
            <input
              type="text"
              placeholder="Buscar movimento por nome ou tipo..."
              value={movimentoBusca}
              onChange={(e) => setMovimentoBusca(e.target.value)}
              className="pokemon-edit-input pokemon-movimento-search"
            />
            <div className="pokemon-movimentos-disponiveis">
              {movimentosFiltrados.length === 0 ? (
                <p className="pokemon-movimento-empty">{movimentoBusca.trim() ? 'Nenhum movimento encontrado.' : 'Digite para filtrar os movimentos disponíveis.'}</p>
              ) : (
                movimentosFiltrados.slice(0, 12).map((m) => (
                  <div
                    key={m.id}
                    className="pokemon-movimento-disponivel"
                    style={{ background: getMoveCardBackground(m.tipo) }}
                  >
                    <span className="pokemon-movimento-disp-nome">{formatMovimentoNomeExibicao(m)}</span>
                    {m.tipo && (
                      <span className={`pokemon-type-tag pokemon-type-${String(m.tipo).toLowerCase()}`}>{m.tipo}</span>
                    )}
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => addMovimento(m.id)}>Adicionar</button>
                  </div>
                ))
              )}
              {movimentosFiltrados.length > 12 && <p className="pokemon-movimento-more">Digite mais para refinar. Mostrando 12 de {movimentosFiltrados.length}.</p>}
            </div>
          </div>
        )}
      </div>

      {erro && <p className="pokemon-expanded-erro">{erro}</p>}
      {pendingResumo && (
        <p style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem' }}>{pendingResumo}</p>
      )}
      <div className="pokemon-expanded-form-actions">
        <button type="submit" className="btn btn-primary" disabled={savingPokemon || acoesBloqueadas}>
          {savingPokemon ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

export default function PokemonList() {
  const { playerId, readyForPlayerApi } = usePlayerTarget()
  const queryClient = useQueryClient()
  const [erro, setErro] = useState('')
  const [modal, setModal] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [listaMovimentos, setListaMovimentos] = useState([])
  const [listaMovimentosDisponiveis, setListaMovimentosDisponiveis] = useState([])
  const [listaPersonalidades, setListaPersonalidades] = useState([])
  const [listaHabilidades, setListaHabilidades] = useState([])
  const [listaItens, setListaItens] = useState([])
  const [catalogoLista, setCatalogoLista] = useState([])
  const [catalogoHasMore, setCatalogoHasMore] = useState(false)
  const [catalogoLoading, setCatalogoLoading] = useState(false)
  const [catalogoOffset, setCatalogoOffset] = useState(0)
  const [catalogoErro, setCatalogoErro] = useState('')
  const [catalogoBusca, setCatalogoBusca] = useState('')
  const [catalogoModo, setCatalogoModo] = useState('edit')
  const [catalogoNivelCriacao, setCatalogoNivelCriacao] = useState(5)
  const [speciesCatalogoLista, setSpeciesCatalogoLista] = useState([])
  const [speciesCatalogoVersion, setSpeciesCatalogoVersion] = useState('')
  const [savingPokemon, setSavingPokemon] = useState(false)
  const [xpLoading, setXpLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [expandedPokemon, setExpandedPokemon] = useState(null)
  const [expandedEdit, setExpandedEdit] = useState(null)
  const [expandedLoading, setExpandedLoading] = useState(false)
  const [alocandoAtributo, setAlocandoAtributo] = useState(false)
  const [evolucoesPossiveis, setEvolucoesPossiveis] = useState([])
  const [pendingXpGanhoTotal, setPendingXpGanhoTotal] = useState(0)
  const [pendingAlocacoes, setPendingAlocacoes] = useState({})
  const [pendingEvolucaoPokedexId, setPendingEvolucaoPokedexId] = useState(null)
  const [pendingResetTiposEspecie, setPendingResetTiposEspecie] = useState(false)
  const [confirmarTopUp, setConfirmarTopUp] = useState(null)

  // Pop-up sequencial quando o Pokémon aprende novos ataques ao subir de nível.
  const [ofertasAprendizagem, setOfertasAprendizagem] = useState([])
  const [ofertaIdx, setOfertaIdx] = useState(0)
  const [substituirMovimentoId, setSubstituirMovimentoId] = useState('')
  const [nivelSubiuMsg, setNivelSubiuMsg] = useState('')
  const [usuarioMestre, setUsuarioMestre] = useState(null)

  const perfilQuery = useQuery({
    queryKey: queryKeys.perfil(playerId),
    queryFn: () => getMeuPerfil(playerId),
    enabled: readyForPlayerApi,
    staleTime: 60 * 1000,
  })

  const usuarioQuery = useQuery({
    queryKey: queryKeys.auth.usuario,
    queryFn: getUsuario,
    staleTime: 10 * 60 * 1000,
  })

  const movimentosQuery = useQuery({
    queryKey: queryKeys.catalogo.movimentos,
    queryFn: getMovimentos,
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })

  const habilidadesQuery = useQuery({
    queryKey: queryKeys.catalogo.habilidades,
    queryFn: getHabilidades,
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })

  const personalidadesQuery = useQuery({
    queryKey: queryKeys.catalogo.personalidades,
    queryFn: getPersonalidades,
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })

  const itensQuery = useQuery({
    queryKey: queryKeys.catalogo.itens,
    queryFn: getItens,
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })

  useQuery({
    queryKey: queryKeys.species.version,
    queryFn: getSpeciesCatalogLocalVersion,
    staleTime: 10 * 60 * 1000,
    enabled: false,
  })

  useQuery({
    queryKey: queryKeys.species.lista,
    queryFn: async () => {
      const versaoRemota = await queryClient.fetchQuery({
        queryKey: queryKeys.species.version,
        queryFn: getSpeciesCatalogLocalVersion,
        staleTime: 10 * 60 * 1000,
      })
      const cache = readSpeciesCache()
      if (cache.lista && cache.version === versaoRemota) {
        setSpeciesCatalogoVersion(versaoRemota)
        setSpeciesCatalogoLista(cache.lista)
        return cache.lista
      }
      if (speciesCatalogoLista.length > 0 && speciesCatalogoVersion === versaoRemota) {
        return speciesCatalogoLista
      }
      const listaRemota = await getSpeciesCatalogLocal()
      const listaSegura = Array.isArray(listaRemota) ? listaRemota : []
      setSpeciesCatalogoVersion(versaoRemota)
      setSpeciesCatalogoLista(listaSegura)
      writeSpeciesCache(versaoRemota, listaSegura)
      return listaSegura
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    enabled: false,
  })

  const popupAprendizagemAberta = ofertasAprendizagem.length > 0 && ofertaIdx < ofertasAprendizagem.length

  const load = useCallback(async () => {
    if (!readyForPlayerApi) return
    await queryClient.invalidateQueries({ queryKey: queryKeys.perfil(playerId) })
  }, [playerId, readyForPlayerApi, queryClient])

  useEffect(() => {
    if (usuarioQuery.data) setUsuarioMestre(usuarioQuery.data)
    else if (usuarioQuery.isError) setUsuarioMestre(null)
  }, [usuarioQuery.data, usuarioQuery.isError])

  useEffect(() => {
    if (movimentosQuery.data) setListaMovimentos(movimentosQuery.data)
  }, [movimentosQuery.data])

  useEffect(() => {
    if (habilidadesQuery.data) setListaHabilidades(habilidadesQuery.data)
  }, [habilidadesQuery.data])

  useEffect(() => {
    if (personalidadesQuery.data) setListaPersonalidades(personalidadesQuery.data)
  }, [personalidadesQuery.data])

  useEffect(() => {
    if (itensQuery.data) setListaItens(itensQuery.data)
  }, [itensQuery.data])

  useEffect(() => {
    if (expandedPokemon) {
      setExpandedEdit(editStateFromPokemon(expandedPokemon))
      setPendingXpGanhoTotal(0)
      setPendingAlocacoes({})
      setPendingEvolucaoPokedexId(null)
      setPendingResetTiposEspecie(false)
      setConfirmarTopUp(null)
    } else {
      setExpandedEdit(null)
    }
  }, [expandedPokemon])

  useEffect(() => {
    if (!popupAprendizagemAberta) return
    const ids = expandedEdit?.movimentoIds || []
    if (ids.length >= MAX_ATAQUES_POR_POKEMON) {
      if (!substituirMovimentoId || !ids.includes(substituirMovimentoId)) {
        setSubstituirMovimentoId(ids[0] || '')
      }
    } else if (substituirMovimentoId) {
      setSubstituirMovimentoId('')
    }
  }, [popupAprendizagemAberta, ofertaIdx, expandedEdit])

  const handleColocarNoTime = async (id, ordem) => {
    try {
      await colocarNoTime(id, ordem, playerId)
      load()
    } catch (err) {
      setErro(err.message)
    }
  }

  const handleRemoverDoTime = async (id) => {
    try {
      await removerDoTime(id, playerId)
      load()
      if (expandedId === id) setExpandedId(null)
    } catch (err) {
      setErro(err.message)
    }
  }

  const handleGanharXp = async (pokemonId, xpGanho) => {
    if (!pokemonId || !expandedEdit) return
    const valor = Math.max(0, Number(xpGanho) || 0)
    if (!valor) return
    setErro('')
    setNivelSubiuMsg('')
    setXpLoading(true)
    try {
      const preview = await previewGanhoXpPokemon(pokemonId, valor, Number(expandedEdit.xpAtual) || 0, playerId)
      setExpandedEdit((current) => {
        if (!current) return current
        return {
          ...current,
          xpAtual: Number(preview?.xpDepois ?? current.xpAtual) || 0,
          nivel: Number(preview?.nivelDepois ?? current.nivel) || current.nivel,
          pontosDistribuicaoDisponiveis: Number(preview?.pontosDistribuicaoDepois ?? current.pontosDistribuicaoDisponiveis) || 0,
        }
      })
      setPendingXpGanhoTotal((current) => current + valor)
      if (preview?.nivelSubiu) {
        setNivelSubiuMsg(`Nível em rascunho: Lv. ${preview.nivelDepois}`)
      }
      const ofertas = Array.isArray(preview?.movimentosAprendendo) ? preview.movimentosAprendendo : []
      if (ofertas.length > 0) {
        setOfertasAprendizagem((atual) => {
          const ids = new Set((atual || []).map((m) => m.id))
          const novos = ofertas.filter((m) => m?.id && !ids.has(m.id))
          return [...(atual || []), ...novos]
        })
      }
    } catch (err) {
      setErro(err.message || 'Erro ao calcular XP em rascunho')
    } finally {
      setXpLoading(false)
    }
  }

  const custoParaProximo = (atributo, valorAtual) => {
    const v = Math.max(0, Number(valorAtual) || 0)
    if (atributo === 'atr_hp' || atributo === 'atr_stamina') return 1
    if (v >= 10) return 3
    if (v >= 5) return 2
    return 1
  }

  const custoIntervalo = (atributo, valorInicial, valorFinal) => {
    const inicio = Math.max(0, Number(valorInicial) || 0)
    const fim = Math.max(0, Number(valorFinal) || 0)
    if (fim <= inicio) return 0
    let total = 0
    for (let v = inicio; v < fim; v += 1) {
      total += custoParaProximo(atributo, v)
    }
    return total
  }

  const construirPendenciasAtributo = (editState, pokemonBase) => {
    const pendencias = {}
    Object.entries(ATRIBUTO_EDIT_FIELD_MAP).forEach(([atributo, campo]) => {
      const base = Math.max(0, Number(pokemonBase?.[campo]) || 0)
      const atual = Math.max(0, Number(editState?.[campo]) || 0)
      const diff = atual - base
      if (diff > 0) {
        pendencias[atributo] = diff
      }
    })
    return pendencias
  }

  const handleSetAtributoValor = (atributo, valorDigitado) => {
    if (!expandedEdit || !expandedPokemon) return
    const campo = ATRIBUTO_EDIT_FIELD_MAP[atributo]
    if (!campo) return

    const base = Math.max(0, Number(expandedPokemon[campo]) || 0)
    const atual = Math.max(0, Number(expandedEdit[campo]) || 0)
    let novo = Number.parseInt(String(valorDigitado ?? '').trim(), 10)
    if (!Number.isFinite(novo)) {
      novo = atual
    }
    novo = Math.max(base, novo)
    if (novo === atual) return

    const saldoAtual = Number(expandedEdit.pontosDistribuicaoDisponiveis) || 0
    const isMestre = !!usuarioMestre?.mestre

    let saldoNovo = saldoAtual
    if (novo > atual) {
      const custo = custoIntervalo(atributo, atual, novo)
      if (!isMestre && saldoAtual < custo) {
        setErro(`Pontos insuficientes para aumentar ${atributo}.`) 
        return
      }
      saldoNovo -= custo
    } else {
      const reembolso = custoIntervalo(atributo, novo, atual)
      saldoNovo += reembolso
    }

    setErro('')
    const nextEdit = {
      ...expandedEdit,
      [campo]: novo,
      pontosDistribuicaoDisponiveis: saldoNovo,
    }
    if (atributo === 'atr_tecnica') {
      nextEdit.tecnica = novo
    }
    if (atributo === 'atr_respeito') {
      nextEdit.respeito = novo
    }

    setExpandedEdit(nextEdit)
    setPendingAlocacoes(construirPendenciasAtributo(nextEdit, expandedPokemon))
  }

  const handleAlocarAtributo = async (atributo) => {
    if (!expandedPokemon?.id || !expandedEdit) return
    const mapValor = {
      atr_ataque: expandedEdit.atrAtaque,
      atr_defesa: expandedEdit.atrDefesa,
      atr_ataque_especial: expandedEdit.atrAtaqueEspecial,
      atr_defesa_especial: expandedEdit.atrDefesaEspecial,
      atr_speed: expandedEdit.atrSpeed,
      atr_hp: expandedEdit.atrHp,
      atr_stamina: expandedEdit.atrStamina,
      atr_tecnica: expandedEdit.atrTecnica,
      atr_respeito: expandedEdit.atrRespeito,
    }
    const custo = custoParaProximo(atributo, mapValor[atributo] ?? 0)
    const saldo = Number(expandedEdit.pontosDistribuicaoDisponiveis) || 0
    const isMestre = !!usuarioMestre?.mestre
    if (!isMestre && saldo < custo) {
      setErro(`Pontos insuficientes para aumentar ${atributo}. Custo atual: ${custo}.`)
      return
    }
    const editField = ATRIBUTO_EDIT_FIELD_MAP[atributo]
    if (!editField) return
    handleSetAtributoValor(atributo, (Number(expandedEdit[editField]) || 0) + 1)
  }

  const handleEvoluir = async (pokedexId) => {
    if (!expandedPokemon?.id || !expandedEdit) return
    setErro('')
    setPendingEvolucaoPokedexId(pokedexId)
  }

  const toggleExpand = (p) => {
    if (expandedId === p.id) {
      setExpandedId(null)
      setExpandedPokemon(null)
      setListaMovimentosDisponiveis([])
      setEvolucoesPossiveis([])
      setOfertasAprendizagem([])
      setOfertaIdx(0)
      setSubstituirMovimentoId('')
      setNivelSubiuMsg('')
      setConfirmarTopUp(null)
      return
    }
    setOfertasAprendizagem([])
    setOfertaIdx(0)
    setSubstituirMovimentoId('')
    setNivelSubiuMsg('')
    setExpandedId(p.id)
    setExpandedLoading(true)
    setExpandedPokemon(null)
    setEvolucoesPossiveis([])
    getPokemon(p.id, playerId)
      .then(async (pokemon) => {
        setExpandedPokemon(pokemon)
        try {
          const disponiveis = await getMovimentosDisponiveisPokemon(p.id, playerId, { includeMetodosExtras: !!usuarioMestre?.mestre })
          setListaMovimentosDisponiveis(disponiveis || [])
        } catch {
          setListaMovimentosDisponiveis(listaMovimentos)
        }
        try {
          const evolucoes = await listarEvolucoesPossiveisPokemon(p.id, playerId)
          setEvolucoesPossiveis(Array.isArray(evolucoes) ? evolucoes : [])
        } catch {
          setEvolucoesPossiveis([])
        }
      })
      .catch(() => setExpandedId(null))
      .finally(() => setExpandedLoading(false))
  }

  const formatGenero = (g) => {
    if (!g) return '—'
    if (g === 'MACHO') return '♂️'
    if (g === 'FEMEA') return '♀️'
    return 'Sem gênero'
  }

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir este Pokémon?')) return
    try {
      await excluirPokemon(id, playerId)
      load()
      if (expandedId === id) setExpandedId(null)
    } catch (err) {
      setErro(err.message)
    }
  }

  function readSpeciesCache() {
    try {
      const version = localStorage.getItem(SPECIES_CACHE_VERSION_KEY)
      const raw = localStorage.getItem(SPECIES_CACHE_KEY)
      if (!raw) return { version, lista: null }
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return { version, lista: null }
      return { version, lista: parsed }
    } catch {
      return { version: null, lista: null }
    }
  }

  function writeSpeciesCache(version, lista) {
    try {
      localStorage.setItem(SPECIES_CACHE_VERSION_KEY, version || 'empty')
      localStorage.setItem(SPECIES_CACHE_KEY, JSON.stringify(Array.isArray(lista) ? lista : []))
    } catch {
      // armazenamento local é opcional
    }
  }

  const aplicarFiltroCatalogo = (listaBase, offset = 0, busca = '') => {
    const trimmed = (busca || '').trim().toLowerCase()
    const isNum = /^\d+$/.test(trimmed)
    const filtered = !trimmed
      ? listaBase
      : (listaBase || []).filter((sp) => {
          if (isNum) return Number(sp?.pokedexId) === Number(trimmed)
          return (sp?.nome || '').toLowerCase().includes(trimmed)
        })
    const pagina = filtered.slice(offset, offset + PAGE_SIZE)
    setCatalogoLista(pagina)
    setCatalogoHasMore(offset + PAGE_SIZE < filtered.length)
  }

  const ensureSpeciesCatalogo = async (validarVersaoRemota = false) => {
    if (!validarVersaoRemota && speciesCatalogoLista.length > 0) {
      return speciesCatalogoLista
    }
    return queryClient.fetchQuery({
      queryKey: queryKeys.species.lista,
      queryFn: async () => {
        const versaoRemota = await queryClient.fetchQuery({
          queryKey: queryKeys.species.version,
          queryFn: getSpeciesCatalogLocalVersion,
          staleTime: 10 * 60 * 1000,
        })
        const cache = readSpeciesCache()
        if (cache.lista && cache.version === versaoRemota) {
          setSpeciesCatalogoVersion(versaoRemota)
          setSpeciesCatalogoLista(cache.lista)
          return cache.lista
        }
        const listaRemota = await getSpeciesCatalogLocal()
        const listaSegura = Array.isArray(listaRemota) ? listaRemota : []
        setSpeciesCatalogoVersion(versaoRemota)
        setSpeciesCatalogoLista(listaSegura)
        writeSpeciesCache(versaoRemota, listaSegura)
        return listaSegura
      },
      staleTime: validarVersaoRemota ? 0 : 10 * 60 * 1000,
      gcTime: 24 * 60 * 60 * 1000,
    })
  }

  const loadCatalogo = async (offset = 0, busca = '', validarVersaoRemota = false) => {
    setCatalogoErro('')
    setCatalogoLoading(true)
    try {
      const lista = await ensureSpeciesCatalogo(validarVersaoRemota)
      aplicarFiltroCatalogo(lista, offset, busca || catalogoBusca || '')
    } catch (err) {
      setCatalogoErro(err.message || 'Erro ao carregar catálogo')
      setCatalogoLista([])
      setCatalogoHasMore(false)
    } finally {
      setCatalogoLoading(false)
    }
  }

  const handleAbrirCatalogo = (modo = 'edit') => {
    setCatalogoModo(modo)
    setModal('catalogo')
    setCatalogoOffset(0)
    setCatalogoBusca('')
    setCatalogoNivelCriacao(5)
    loadCatalogo(0, '', true)
  }

  const handleNovoPokemon = async () => {
    setErro('')
    handleAbrirCatalogo('create')
  }

  const handleBuscarCatalogo = () => {
    setCatalogoOffset(0)
    loadCatalogo(0, catalogoBusca, false)
  }

  const handleSelecionarDoCatalogo = async (species) => {
    setCatalogoErro('')
    try {
      if (!species) return
      if (catalogoModo === 'create') {
        setFormLoading(true)
        const created = await criarPokemon({ pokedexId: species.pokedexId, nivel: Number(catalogoNivelCriacao) || 5 }, playerId)
        await load()
        setExpandedId(created.id)
        setExpandedLoading(true)
        setExpandedPokemon(null)
        const full = await getPokemon(created.id, playerId)
        setExpandedPokemon(full)
      } else {
        setExpandedEdit((e) => (e ? {
          ...e,
          pokedexId: species.pokedexId,
          especie: species.nome || '',
          tipoPrimario: species.tipoPrimario || 'NORMAL',
          tipoSecundario: species.tipoSecundario || '',
          imagemUrl: species.imagemUrl || '',
        } : e))
      }
      setModal(null)
    } catch (err) {
      setCatalogoErro(err.message)
    } finally {
      setFormLoading(false)
      setExpandedLoading(false)
    }
  }

  const handleRecusarOfertaAprendizagem = async () => {
    const oferta = ofertasAprendizagem[ofertaIdx]
    if (!oferta || !expandedPokemon) return
    setErro('')
    const proximo = ofertaIdx + 1
    if (proximo >= ofertasAprendizagem.length) {
      setOfertasAprendizagem([])
      setOfertaIdx(0)
      setNivelSubiuMsg('')
    } else {
      setOfertaIdx(proximo)
    }
  }

  const handleAceitarOfertaAprendizagem = async () => {
    const oferta = ofertasAprendizagem[ofertaIdx]
    if (!oferta || !expandedPokemon || !expandedEdit) return
    setErro('')
    const idsAtuais = expandedEdit?.movimentoIds || []
    const noLimite = idsAtuais.length >= MAX_ATAQUES_POR_POKEMON
    let nextMovimentos = idsAtuais
    if (noLimite) {
      const substituto = idsAtuais.includes(substituirMovimentoId) ? substituirMovimentoId : (idsAtuais[0] || null)
      nextMovimentos = idsAtuais.map((id) => (id === substituto ? oferta.id : id))
    } else if (!idsAtuais.includes(oferta.id)) {
      nextMovimentos = [...idsAtuais, oferta.id]
    }
    setExpandedEdit((current) => (!current ? current : { ...current, movimentoIds: nextMovimentos }))

    const proximo = ofertaIdx + 1
    if (proximo >= ofertasAprendizagem.length) {
      setOfertasAprendizagem([])
      setOfertaIdx(0)
      setNivelSubiuMsg('')
    } else {
      setOfertaIdx(proximo)
    }
  }

  const addMovimento = (id) => {
    setExpandedEdit((e) => {
      if (!e || (e.movimentoIds || []).length >= MAX_ATAQUES_POR_POKEMON) return e
      if ((e.movimentoIds || []).includes(id)) return e
      return { ...e, movimentoIds: [...(e.movimentoIds || []), id] }
    })
  }

  const removeMovimento = (movimentoId) => {
    setExpandedEdit((e) => (!e ? e : { ...e, movimentoIds: (e.movimentoIds || []).filter((id) => id !== movimentoId) }))
  }

  const handleRestaurarTiposEspecie = async () => {
    if (!expandedPokemon?.id || !usuarioMestre?.mestre || !expandedEdit) return
    setErro('')
    setExpandedEdit((current) => {
      if (!current) return current
      return {
        ...current,
        tipoPrimario: current.tipoPrimarioEspecie || 'NORMAL',
        tipoSecundario: current.tipoSecundarioEspecie || '',
        tiposComOverride: false,
      }
    })
    setPendingResetTiposEspecie(true)
  }

  const salvarPokemonExpanded = async (bonusDistribuicao = 0) => {
    if (!expandedPokemon || !expandedEdit) return
    setErro('')
    setSavingPokemon(true)
    try {
      const evolucaoPendente = pendingEvolucaoPokedexId
      if (usuarioMestre?.mestre) {
        const sec = expandedEdit.tipoSecundario || null
        if (sec && sec === expandedEdit.tipoPrimario) {
          setErro('Tipo primário e secundário não podem ser iguais.')
          return
        }
        if (pendingResetTiposEspecie) {
          await mestreDefinirTiposPokemon(expandedPokemon.id, { resetTiposParaEspecie: true })
        } else {
          const tipoAlterado = expandedEdit.tipoPrimario !== expandedPokemon.tipoPrimario
            || (expandedEdit.tipoSecundario || null) !== (expandedPokemon.tipoSecundario || null)
          if (tipoAlterado) {
            await mestreDefinirTiposPokemon(expandedPokemon.id, {
              tipoPrimario: expandedEdit.tipoPrimario,
              tipoSecundario: sec,
            })
          }
        }
      }

      const resultado = await atualizarPokemon(expandedPokemon.id, {
        pokedexId: evolucaoPendente ? null : (expandedEdit.pokedexId && expandedEdit.pokedexId > 0 ? expandedEdit.pokedexId : null),
        apelido: expandedEdit.apelido || null,
        notas: expandedEdit.notas || null,
        genero: (expandedEdit.genero && expandedEdit.genero !== '' ? expandedEdit.genero : 'SEM_GENERO'),
        shiny: expandedEdit.shiny,
        personalidadeId: expandedEdit.personalidadeId || null,
        especializacao: expandedEdit.especializacao || null,
        berryFavorita: expandedEdit.berryFavorita || null,
        nivelDeVinculo: expandedEdit.nivelDeVinculo,
        nivel: expandedEdit.nivel,
        xpAtual: expandedEdit.xpAtual,
        pokebolaCaptura: expandedEdit.pokebolaCaptura || undefined,
        itemSeguradoId: expandedEdit.itemSeguradoId || null,
        spriteCustomizadoUrl: expandedEdit.spriteCustomizadoUrl || null,
        tecnica: expandedEdit.tecnica,
        respeito: expandedEdit.respeito,
        pontosDistribuicaoBonus: Math.max(0, Number(bonusDistribuicao) || 0),
        habilidadeId: expandedEdit.habilidadeId || null,
        statusAtuais: expandedEdit.statusAtuais?.length ? expandedEdit.statusAtuais : null,
        movimentoIds: expandedEdit.movimentoIds?.length ? expandedEdit.movimentoIds : [],
      }, playerId)

      let pokemonAtualizado = resultado?.pokemon || expandedPokemon
      const alocacoesPendentes = Object.entries(pendingAlocacoes).filter(([, quantidade]) => Number(quantidade) > 0)
      for (const [atributo, quantidade] of alocacoesPendentes) {
        for (let i = 0; i < Number(quantidade); i += 1) {
          pokemonAtualizado = await alocarAtributosPokemon(pokemonAtualizado.id, atributo, 1, playerId)
        }
      }

      if (evolucaoPendente) {
        pokemonAtualizado = await evoluirPokemon(pokemonAtualizado.id, evolucaoPendente, playerId)
      }

      const updated = await getPokemon(pokemonAtualizado.id, playerId)
      setExpandedPokemon(updated)
      await load()

      const movimentosAprendendo = pendingXpGanhoTotal > 0 ? [] : (resultado?.movimentosAprendendo || [])
      if (movimentosAprendendo.length > 0) {
        setOfertasAprendizagem(movimentosAprendendo)
        setOfertaIdx(0)
        setNivelSubiuMsg(`Nível do Pokémon subiu para Lv. ${resultado.nivelDepois}`)
      } else {
        setOfertasAprendizagem([])
        setOfertaIdx(0)
        setNivelSubiuMsg('')
      }
      setPendingXpGanhoTotal(0)
      setPendingAlocacoes({})
      setPendingEvolucaoPokedexId(null)
      setPendingResetTiposEspecie(false)
    } catch (err) {
      setErro(err.message)
    } finally {
      setSavingPokemon(false)
    }
  }

  const handleSalvarExpanded = async (e) => {
    e.preventDefault()
    if (!expandedPokemon || !expandedEdit) return
    const saldoAtual = Number(expandedEdit.pontosDistribuicaoDisponiveis) || 0
    const bonusNecessario = usuarioMestre?.mestre ? Math.max(0, -saldoAtual) : 0
    if (bonusNecessario > 0) {
      setConfirmarTopUp({ bonus: bonusNecessario })
      return
    }
    await salvarPokemonExpanded(0)
  }

  const confirmarTopUpSave = async () => {
    const bonus = Number(confirmarTopUp?.bonus) || 0
    setConfirmarTopUp(null)
    await salvarPokemonExpanded(bonus)
  }

  const cancelarTopUpSave = () => {
    setConfirmarTopUp(null)
  }

  const perfil = perfilQuery.data ?? null
  const timePrincipal = perfil?.timePrincipal ?? []
  const naBox = perfil?.box ?? []
  const totalAlocacoesPendentes = Object.values(pendingAlocacoes).reduce((acc, qtd) => acc + (Number(qtd) || 0), 0)
  const pendingPartes = []
  if (pendingXpGanhoTotal > 0) pendingPartes.push(`XP +${pendingXpGanhoTotal}`)
  if (totalAlocacoesPendentes > 0) pendingPartes.push(`Alocações ${totalAlocacoesPendentes}`)
  if (pendingEvolucaoPokedexId) pendingPartes.push(`Evolução #${pendingEvolucaoPokedexId}`)
  if (pendingResetTiposEspecie) pendingPartes.push('Tipos restaurados para espécie')
  const pendingResumo = pendingPartes.length > 0
    ? `Rascunho pendente: ${pendingPartes.join(' · ')}. As mudanças serão persistidas somente ao salvar.`
    : 'As mudanças nesta ficha ficam em rascunho e só vão para o banco ao clicar em Salvar.'

  if (!readyForPlayerApi) return <div className="container">Carregando...</div>

  if (perfilQuery.isLoading) return <div className="container">Carregando...</div>

  if (!perfil) {
    return (
      <div className="container container--wide">
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ marginTop: 0 }}>Ficha do treinador necessária</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Crie sua ficha do treinador na aba Ficha para gerenciar seus Pokémon.
          </p>
          <Link to="/" className="btn btn-primary">Ir para Ficha</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container container--wide">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Pokémon</h1>
        <button type="button" className="btn btn-primary" onClick={handleNovoPokemon} disabled={formLoading}>
          {formLoading ? 'Criando...' : 'Novo Pokémon'}
        </button>
      </div>
      {erro && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{erro}</p>}

      <div className="card">
        <h3>Time principal (máx. 6)</h3>
        <p className="pokemon-banner-hint">Clique em um card para expandir e editar todos os atributos.</p>
        {timePrincipal.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum Pokémon no time. Coloque da box abaixo.</p>
        ) : (
          <div className="pokemon-banner-list">
            {timePrincipal.map((p) => (
              <div
                key={p.id}
                className={`pokemon-banner-card ${expandedId === p.id ? 'is-expanded' : ''}`}
                style={{ background: getCardBackground(p) }}
                onClick={() => toggleExpand(p)}
                role="button"
                tabIndex={0}
                aria-expanded={expandedId === p.id}
                aria-label={expandedId === p.id ? `Recolher ${p.apelido || p.especie}` : `Expandir ${p.apelido || p.especie}`}
                onKeyDown={(e) => e.key === 'Enter' && toggleExpand(p)}
              >
                <div className="pokemon-banner-card-inner">
                  <div className="pokemon-banner-image">
                    {p.imagemUrl ? (
                      <img src={p.imagemUrl} alt={p.especie || 'Pokémon'} />
                    ) : (
                      <span className="pokemon-banner-placeholder">?</span>
                    )}
                  </div>
                  <div className="pokemon-banner-main">
                    <h2 className="pokemon-banner-apelido">{p.apelido || p.especie || '???'}</h2>
                    <p className="pokemon-banner-especie">{p.especie || '???'}</p>
                    <div className="pokemon-banner-meta">
                      <span>Lv. {p.nivel}</span>
                      <span>{(p.movimentosConhecidos || []).length} ataques</span>
                      <span className="pokemon-banner-tipos">
                        {[p.tipoPrimario, p.tipoSecundario]
                          .filter(Boolean)
                          .map((t) => (
                            <span
                              key={t}
                              className={`pokemon-type-tag pokemon-type-${t.toLowerCase()}`}
                            >
                              {t}
                            </span>
                          ))}
                      </span>
                      <span>{formatGenero(p.genero)}</span>
                      <span>Tec/Res: {p.tecnica ?? 0}/{p.respeito ?? 0}</span>
                      {p.habilidadeAtivaNome && <span>Hab.: {p.habilidadeAtivaNome}</span>}
                      {p.personalidade && <span>{p.personalidade}</span>}
                      {p.berryFavorita && <span>Fruta: {p.berryFavorita}</span>}
                    </div>
                  </div>
                  <div className="pokemon-banner-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="btn btn-secondary" onClick={() => handleRemoverDoTime(p.id)}>Enviar para box</button>
                  </div>
                </div>
                {expandedId === p.id && (
                  <div className="pokemon-banner-expanded" onClick={(e) => e.stopPropagation()}>
                    {expandedLoading ? (
                      <p>Carregando...</p>
                    ) : expandedPokemon && expandedPokemon.id === p.id && expandedEdit ? (
                      <ExpandedForm
                        expandedEdit={expandedEdit}
                        setExpandedEdit={setExpandedEdit}
                        listaMovimentos={listaMovimentos}
                        listaMovimentosDisponiveis={listaMovimentosDisponiveis.length ? listaMovimentosDisponiveis : listaMovimentos}
                        listaPersonalidades={listaPersonalidades}
                        listaHabilidades={listaHabilidades}
                        listaItens={listaItens}
                        expandedPokemon={expandedPokemon}
                        onSalvar={handleSalvarExpanded}
                        savingPokemon={savingPokemon}
                        erro={erro}
                        onAbrirCatalogo={() => handleAbrirCatalogo('edit')}
                        addMovimento={addMovimento}
                        removeMovimento={removeMovimento}
                        TIPOS={TIPOS}
                        POKEBOLAS={POKEBOLAS}
                        ESPECIALIZACOES={ESPECIALIZACOES}
                        CONDICOES_STATUS={CONDICOES_STATUS}
                        onGanharXp={handleGanharXp}
                        ganharXpLoading={xpLoading}
                        acoesBloqueadas={popupAprendizagemAberta}
                        usuarioMestre={usuarioMestre}
                        onRestaurarTiposEspecie={handleRestaurarTiposEspecie}
                        onAlocarAtributo={handleAlocarAtributo}
                        onSetAtributoValor={handleSetAtributoValor}
                        alocandoAtributo={alocandoAtributo}
                        custoParaProximo={custoParaProximo}
                        evolucoesPossiveis={evolucoesPossiveis}
                        onEvoluir={handleEvoluir}
                        pendingResumo={pendingResumo}
                        pendingEvolucaoPokedexId={pendingEvolucaoPokedexId}
                      />
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Box</h3>
        <p className="pokemon-banner-hint">Clique em um card para expandir e editar todos os atributos.</p>
        {naBox.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum Pokémon na box.</p>
        ) : (
          <div className="pokemon-banner-list">
            {naBox.map((p) => (
              <div
                key={p.id}
                className={`pokemon-banner-card ${expandedId === p.id ? 'is-expanded' : ''}`}
                style={{ background: getCardBackground(p) }}
                onClick={() => toggleExpand(p)}
                role="button"
                tabIndex={0}
                aria-expanded={expandedId === p.id}
                aria-label={expandedId === p.id ? `Recolher ${p.apelido || p.especie}` : `Expandir ${p.apelido || p.especie}`}
                onKeyDown={(e) => e.key === 'Enter' && toggleExpand(p)}
              >
                <div className="pokemon-banner-card-inner">
                  <div className="pokemon-banner-image">
                    {p.imagemUrl ? (
                      <img src={p.imagemUrl} alt={p.especie || 'Pokémon'} />
                    ) : (
                      <span className="pokemon-banner-placeholder">?</span>
                    )}
                  </div>
                  <div className="pokemon-banner-main">
                    <h2 className="pokemon-banner-apelido">{p.apelido || p.especie || '???'}</h2>
                    <p className="pokemon-banner-especie">{p.especie || '???'}</p>
                    <div className="pokemon-banner-meta">
                      <span>Lv. {p.nivel}</span>
                      <span>{(p.movimentosConhecidos || []).length} ataques</span>
                      <span className="pokemon-banner-tipos">
                        {[p.tipoPrimario, p.tipoSecundario]
                          .filter(Boolean)
                          .map((t) => (
                            <span
                              key={t}
                              className={`pokemon-type-tag pokemon-type-${t.toLowerCase()}`}
                            >
                              {t}
                            </span>
                          ))}
                      </span>
                      <span>{formatGenero(p.genero)}</span>
                      <span>Tec/Res: {p.tecnica ?? 0}/{p.respeito ?? 0}</span>
                      {p.habilidadeAtivaNome && <span>Hab.: {p.habilidadeAtivaNome}</span>}
                      {p.personalidade && <span>{p.personalidade}</span>}
                      {p.berryFavorita && <span>Fruta: {p.berryFavorita}</span>}
                    </div>
                  </div>
                  <div className="pokemon-banner-actions" onClick={(e) => e.stopPropagation()}>
                    {timePrincipal.length < 6 && (
                      <button type="button" className="btn btn-secondary" onClick={() => handleColocarNoTime(p.id, timePrincipal.length + 1)}>Colocar no time</button>
                    )}
                    <button type="button" className="btn btn-danger" onClick={() => handleExcluir(p.id)}>Excluir</button>
                  </div>
                </div>
                {expandedId === p.id && (
                  <div className="pokemon-banner-expanded" onClick={(e) => e.stopPropagation()}>
                    {expandedLoading ? (
                      <p>Carregando...</p>
                    ) : expandedPokemon && expandedPokemon.id === p.id && expandedEdit ? (
                      <ExpandedForm
                        expandedEdit={expandedEdit}
                        setExpandedEdit={setExpandedEdit}
                        listaMovimentos={listaMovimentos}
                        listaMovimentosDisponiveis={listaMovimentosDisponiveis.length ? listaMovimentosDisponiveis : listaMovimentos}
                        listaPersonalidades={listaPersonalidades}
                        listaHabilidades={listaHabilidades}
                        listaItens={listaItens}
                        expandedPokemon={expandedPokemon}
                        onSalvar={handleSalvarExpanded}
                        savingPokemon={savingPokemon}
                        erro={erro}
                        onAbrirCatalogo={() => handleAbrirCatalogo('edit')}
                        addMovimento={addMovimento}
                        removeMovimento={removeMovimento}
                        TIPOS={TIPOS}
                        POKEBOLAS={POKEBOLAS}
                        ESPECIALIZACOES={ESPECIALIZACOES}
                        CONDICOES_STATUS={CONDICOES_STATUS}
                        onGanharXp={handleGanharXp}
                        ganharXpLoading={xpLoading}
                        acoesBloqueadas={popupAprendizagemAberta}
                        usuarioMestre={usuarioMestre}
                        onRestaurarTiposEspecie={handleRestaurarTiposEspecie}
                        onAlocarAtributo={handleAlocarAtributo}
                        onSetAtributoValor={handleSetAtributoValor}
                        alocandoAtributo={alocandoAtributo}
                        custoParaProximo={custoParaProximo}
                        evolucoesPossiveis={evolucoesPossiveis}
                        onEvoluir={handleEvoluir}
                        pendingResumo={pendingResumo}
                        pendingEvolucaoPokedexId={pendingEvolucaoPokedexId}
                      />
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modal === 'catalogo' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Catálogo local de espécies</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              {catalogoModo === 'create'
                ? 'Busque por nome ou número da Pokédex. Clique em uma espécie para criar o Pokémon.'
                : 'Busque por nome ou número da Pokédex. Clique em uma espécie para preencher espécie, tipos e imagem no card expandido.'}
            </p>
            {catalogoModo === 'create' && (
              <div className="form-group" style={{ marginBottom: '0.75rem', maxWidth: 220 }}>
                <label>Nível inicial do Pokémon</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={catalogoNivelCriacao}
                  onChange={(e) => setCatalogoNivelCriacao(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Nome ou número da Pokédex"
                value={catalogoBusca}
                onChange={(e) => setCatalogoBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleBuscarCatalogo())}
                style={{ flex: 1, minWidth: 160 }}
              />
              <button type="button" className="btn btn-primary" onClick={handleBuscarCatalogo} disabled={catalogoLoading}>
                Buscar
              </button>
              {!catalogoBusca.trim() && (
                <button type="button" className="btn btn-secondary" onClick={() => loadCatalogo(0, '', false)} disabled={catalogoLoading}>
                  Listar
                </button>
              )}
            </div>
            {catalogoErro && <p style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{catalogoErro}</p>}
            {catalogoLoading ? (
              <p>Carregando...</p>
            ) : (
              <>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: '1rem' }}>
                  {catalogoLista.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => handleSelecionarDoCatalogo(p)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          width: '100%',
                          padding: '0.5rem 0.5rem',
                          border: '1px solid var(--border)',
                          borderRadius: 8,
                          background: 'var(--bg)',
                          cursor: 'pointer',
                          marginBottom: '0.5rem',
                          textAlign: 'left',
                          color: 'var(--text)',
                        }}
                      >
                        <span style={{ minWidth: 60, color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{p.pokedexId}</span>
                        <img src={p.imagemUrl} alt={p.nome} style={{ width: 48, height: 48, objectFit: 'contain' }} />
                        <span>{p.nome || 'Sem nome'}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {catalogoLista.length === 0 && !catalogoLoading && <p style={{ color: 'var(--text-muted)' }}>Nenhum resultado. Use a busca ou liste todos.</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" disabled={catalogoOffset === 0} onClick={() => { const o = Math.max(0, catalogoOffset - PAGE_SIZE); setCatalogoOffset(o); loadCatalogo(o, catalogoBusca, false); }}>
                    Anterior
                  </button>
                  <button type="button" className="btn btn-secondary" disabled={!catalogoHasMore} onClick={() => { const o = catalogoOffset + PAGE_SIZE; setCatalogoOffset(o); loadCatalogo(o, catalogoBusca, false); }}>
                    Próxima
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => { setModal(null); setCatalogoErro(''); }}>
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {popupAprendizagemAberta && expandedPokemon && expandedEdit && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            padding: '1rem',
          }}
        >
          <div className="card" style={{ maxWidth: 560, width: '100%' }}>
            <h3 style={{ marginTop: 0 }}>Aprender novo ataque</h3>
            {nivelSubiuMsg ? <p style={{ color: 'var(--text-muted)' }}>{nivelSubiuMsg}</p> : null}
            {ofertasAprendizagem[ofertaIdx] ? (
              <>
                <p style={{ marginBottom: '0.75rem' }}>
                  Aceitar <b>{ofertasAprendizagem[ofertaIdx].nome}</b> ({ofertasAprendizagem[ofertaIdx].tipo})?
                </p>

                {(expandedEdit.movimentoIds || []).length >= MAX_ATAQUES_POR_POKEMON && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.25rem' }}>Selecione um ataque para substituir</label>
                    <select
                      value={substituirMovimentoId}
                      onChange={(e) => setSubstituirMovimentoId(e.target.value)}
                      className="pokemon-edit-input"
                    >
                      {(expandedEdit.movimentoIds || [])
                        .map((id) => listaMovimentos.find((m) => m.id === id))
                        .filter(Boolean)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.nome}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={xpLoading}
                    onClick={handleRecusarOfertaAprendizagem}
                  >
                    Recusar
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={xpLoading || ((expandedEdit.movimentoIds || []).length >= MAX_ATAQUES_POR_POKEMON && !substituirMovimentoId)}
                    onClick={handleAceitarOfertaAprendizagem}
                  >
                    Aceitar
                  </button>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Nenhuma oferta no momento.</p>
            )}
          </div>
        </div>
      )}

      {confirmarTopUp && expandedPokemon && expandedEdit && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 30,
            padding: '1rem',
          }}
        >
          <div className="card" style={{ maxWidth: 560, width: '100%' }}>
            <h3 style={{ marginTop: 0 }}>Confirmar ajuste de pontos</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Este Pokémon está com saldo negativo de <strong>{Math.max(0, Number(confirmarTopUp?.bonus) || 0)}</strong> ponto(s).
              Ao confirmar, esse total será adicionado antes de salvar para zerar o déficit.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary" onClick={cancelarTopUpSave} disabled={savingPokemon}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={confirmarTopUpSave} disabled={savingPokemon}>
                Confirmar e salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
