import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getMeuPerfil, getUsuario, criarPokemon, getPokemon, atualizarPokemon, colocarNoTime, removerDoTime, excluirPokemon, getSpeciesCatalogLocal, getSpeciesCatalogLocalVersion, getMovimentos, getMovimentosDisponiveisPokemon, getPersonalidades, getItens, getHabilidades, ganharXpPokemon, aceitarMovimentoAprendido, recusarMovimentoAprendido, mestreDefinirTiposPokemon } from '../api'
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
    hpMaximo: p.hpMaximo ?? 20,
    staminaMaxima: p.staminaMaxima ?? 10,
    ataque: p.ataque ?? 0,
    ataqueEspecial: p.ataqueEspecial ?? 0,
    defesa: p.defesa ?? 0,
    defesaEspecial: p.defesaEspecial ?? 0,
    speed: p.speed ?? 0,
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
        </div>
      </div>

      <div className="pokemon-expanded-bars">
        <div className="pokemon-expanded-bar">
          <div className="pokemon-expanded-bar-header">
            <span className="pokemon-expanded-bar-label pokemon-expanded-bar-label--hp">HP (Vida)</span>
            <span className="pokemon-expanded-bar-value">Total {expandedEdit.hpMaximo}</span>
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
            <span className="pokemon-expanded-bar-value">Total {expandedEdit.staminaMaxima}</span>
          </div>
          <div className="pokemon-expanded-bar-track">
            <div
              className="pokemon-expanded-bar-fill pokemon-expanded-bar-fill--st"
              style={{ width: `${staminaPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pokemon-expanded-main-grid">
        <div className="pokemon-expanded-main-column">
          <div className="pokemon-edit-section pokemon-edit-section--glass">
            <h4>Identificação</h4>
            <div className="pokemon-expanded-inline-fields">
              <Field label="Pokédex #">
                <input
                  type="number"
                  min={1}
                  value={expandedEdit.pokedexId}
                  className="pokemon-edit-input"
                  readOnly
                />
              </Field>
              <Field label="URL da imagem">
                <input
                  value={expandedEdit.imagemUrl}
                  className="pokemon-edit-input"
                  readOnly
                />
              </Field>
            </div>
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
                    {ganharXpLoading ? '...' : 'Ganhar'}
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
            <h4>Atributos</h4>
            <div className="pokemon-expanded-atributos-grid">
              <Field label="HP máximo">
                <input
                  type="number"
                  min={1}
                  value={expandedEdit.hpMaximo}
                  className="pokemon-edit-input pokemon-edit-input--num"
                  readOnly
                />
              </Field>
              <Field label="Stamina máxima">
                <input
                  type="number"
                  min={1}
                  value={expandedEdit.staminaMaxima}
                  onChange={(e) => set('staminaMaxima', parseInt(e.target.value, 10) || 1)}
                  className="pokemon-edit-input pokemon-edit-input--num"
                />
              </Field>
              <Field label="Ataque">
                <input
                  type="number"
                  min={0}
                  value={expandedEdit.ataque}
                  className="pokemon-edit-input pokemon-edit-input--num"
                  readOnly
                />
              </Field>
              <Field label="Ataque especial">
                <input
                  type="number"
                  min={0}
                  value={expandedEdit.ataqueEspecial}
                  className="pokemon-edit-input pokemon-edit-input--num"
                  readOnly
                />
              </Field>
              <Field label="Defesa">
                <input
                  type="number"
                  min={0}
                  value={expandedEdit.defesa}
                  className="pokemon-edit-input pokemon-edit-input--num"
                  readOnly
                />
              </Field>
              <Field label="Defesa especial">
                <input
                  type="number"
                  min={0}
                  value={expandedEdit.defesaEspecial}
                  className="pokemon-edit-input pokemon-edit-input--num"
                  readOnly
                />
              </Field>
              <Field label="Velocidade">
                <input
                  type="number"
                  min={0}
                  value={expandedEdit.speed}
                  className="pokemon-edit-input pokemon-edit-input--num"
                  readOnly
                />
              </Field>
              <Field label="Técnica">
                <input
                  type="number"
                  min={0}
                  value={expandedEdit.tecnica}
                  onChange={(e) => set('tecnica', parseInt(e.target.value, 10) || 0)}
                  className="pokemon-edit-input pokemon-edit-input--num"
                />
              </Field>
              <Field label="Respeito">
                <input
                  type="number"
                  min={0}
                  value={expandedEdit.respeito}
                  onChange={(e) => set('respeito', parseInt(e.target.value, 10) || 0)}
                  className="pokemon-edit-input pokemon-edit-input--num"
                />
              </Field>
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
        <h4>Golpes &amp; Técnicas ({movimentosAtuais.length}/8)</h4>
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
        {movimentosAtuais.length < 8 && (
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
  const [speciesCatalogoLista, setSpeciesCatalogoLista] = useState([])
  const [speciesCatalogoVersion, setSpeciesCatalogoVersion] = useState('')
  const [savingPokemon, setSavingPokemon] = useState(false)
  const [xpLoading, setXpLoading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [expandedPokemon, setExpandedPokemon] = useState(null)
  const [expandedEdit, setExpandedEdit] = useState(null)
  const [expandedLoading, setExpandedLoading] = useState(false)

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
    if (expandedPokemon) setExpandedEdit(editStateFromPokemon(expandedPokemon))
    else setExpandedEdit(null)
  }, [expandedPokemon])

  useEffect(() => {
    if (!popupAprendizagemAberta) return
    const ids = expandedEdit?.movimentoIds || []
    if (ids.length >= 8) {
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
    if (!pokemonId) return
    setErro('')
    setNivelSubiuMsg('')
    setXpLoading(true)
    try {
      const response = await ganharXpPokemon(pokemonId, xpGanho, playerId)
      if (response?.nivelSubiu) {
        setNivelSubiuMsg(`Nível do Pokémon subiu para Lv. ${response.nivelDepois}!`)
        if (response.movimentosAprendendo && response.movimentosAprendendo.length > 0) {
          setOfertasAprendizagem(response.movimentosAprendendo)
          setOfertaIdx(0)
          setSubstituirMovimentoId('')
        } else {
          setOfertasAprendizagem([])
          setOfertaIdx(0)
        }
      } else {
        setOfertasAprendizagem([])
        setOfertaIdx(0)
      }
      if (response?.pokemon) {
        setExpandedPokemon(response.pokemon)
      }
      load()
    } catch (err) {
      setErro(err.message)
      throw err
    } finally {
      setXpLoading(false)
    }
  }

  const toggleExpand = (p) => {
    if (expandedId === p.id) {
      setExpandedId(null)
      setExpandedPokemon(null)
      setListaMovimentosDisponiveis([])
      return
    }
    setExpandedId(p.id)
    setExpandedLoading(true)
    setExpandedPokemon(null)
    getPokemon(p.id, playerId)
      .then(async (pokemon) => {
        setExpandedPokemon(pokemon)
        try {
          const disponiveis = await getMovimentosDisponiveisPokemon(p.id, playerId)
          setListaMovimentosDisponiveis(disponiveis || [])
        } catch {
          setListaMovimentosDisponiveis(listaMovimentos)
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
        const created = await criarPokemon({ pokedexId: species.pokedexId }, playerId)
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
    setXpLoading(true)
    try {
      await recusarMovimentoAprendido(expandedPokemon.id, oferta.id, playerId)
      const proximo = ofertaIdx + 1
      if (proximo >= ofertasAprendizagem.length) {
        setOfertasAprendizagem([])
        setOfertaIdx(0)
        setNivelSubiuMsg('')
      } else {
        setOfertaIdx(proximo)
      }
      await load()
    } catch (err) {
      setErro(err.message)
    } finally {
      setXpLoading(false)
    }
  }

  const handleAceitarOfertaAprendizagem = async () => {
    const oferta = ofertasAprendizagem[ofertaIdx]
    if (!oferta || !expandedPokemon) return
    setErro('')
    setXpLoading(true)
    try {
      const idsAtuais = expandedEdit?.movimentoIds || []
      const noLimite = idsAtuais.length >= 8
      let substituto = null
      if (noLimite) {
        // Garante que a substituição use a lista atual (pode mudar conforme pop-ups anteriores).
        substituto = idsAtuais.includes(substituirMovimentoId) ? substituirMovimentoId : (idsAtuais[0] || null)
      }
      const atualizado = await aceitarMovimentoAprendido(expandedPokemon.id, oferta.id, substituto, playerId)
      if (atualizado) setExpandedPokemon(atualizado)

      const proximo = ofertaIdx + 1
      if (proximo >= ofertasAprendizagem.length) {
        setOfertasAprendizagem([])
        setOfertaIdx(0)
        setNivelSubiuMsg('')
      } else {
        setOfertaIdx(proximo)
      }
      await load()
    } catch (err) {
      setErro(err.message)
    } finally {
      setXpLoading(false)
    }
  }

  const addMovimento = (id) => {
    setExpandedEdit((e) => {
      if (!e || (e.movimentoIds || []).length >= 8) return e
      if ((e.movimentoIds || []).includes(id)) return e
      return { ...e, movimentoIds: [...(e.movimentoIds || []), id] }
    })
  }

  const removeMovimento = (movimentoId) => {
    setExpandedEdit((e) => (!e ? e : { ...e, movimentoIds: (e.movimentoIds || []).filter((id) => id !== movimentoId) }))
  }

  const handleRestaurarTiposEspecie = async () => {
    if (!expandedPokemon?.id || !usuarioMestre?.mestre) return
    setErro('')
    setSavingPokemon(true)
    try {
      await mestreDefinirTiposPokemon(expandedPokemon.id, { resetTiposParaEspecie: true })
      const updated = await getPokemon(expandedPokemon.id, playerId)
      setExpandedPokemon(updated)
      await load()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSavingPokemon(false)
    }
  }

  const handleSalvarExpanded = async (e) => {
    e.preventDefault()
    if (!expandedPokemon || !expandedEdit) return
    setErro('')
    setSavingPokemon(true)
    try {
      if (usuarioMestre?.mestre) {
        const sec = expandedEdit.tipoSecundario || null
        if (sec && sec === expandedEdit.tipoPrimario) {
          setErro('Tipo primário e secundário não podem ser iguais.')
          setSavingPokemon(false)
          return
        }
        await mestreDefinirTiposPokemon(expandedPokemon.id, {
          tipoPrimario: expandedEdit.tipoPrimario,
          tipoSecundario: sec,
        })
      }
      const resultado = await atualizarPokemon(expandedPokemon.id, {
        pokedexId: expandedEdit.pokedexId && expandedEdit.pokedexId > 0 ? expandedEdit.pokedexId : null,
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
        tecnica: expandedEdit.tecnica,
        respeito: expandedEdit.respeito,
        habilidadeId: expandedEdit.habilidadeId || null,
        statusAtuais: expandedEdit.statusAtuais?.length ? expandedEdit.statusAtuais : null,
        movimentoIds: expandedEdit.movimentoIds?.length ? expandedEdit.movimentoIds : [],
      }, playerId)
      if (resultado?.pokemon) {
        setExpandedPokemon(resultado.pokemon)
      } else {
        const updated = await getPokemon(expandedPokemon.id, playerId)
        setExpandedPokemon(updated)
      }
      await load()

      const movimentosAprendendo = resultado?.movimentosAprendendo || []
      if (movimentosAprendendo.length > 0) {
        setOfertasAprendizagem(movimentosAprendendo)
        setOfertaIdx(0)
        setNivelSubiuMsg(`Nível do Pokémon subiu para Lv. ${resultado.nivelDepois}`)
        // Mantém o card aberto até aceitar/recusar os ataques.
      } else {
        // Após salvar, recolhe o card expandido
        setExpandedId(null)
        setExpandedPokemon(null)
        setOfertasAprendizagem([])
        setOfertaIdx(0)
        setNivelSubiuMsg('')
      }
    } catch (err) {
      setErro(err.message)
    } finally {
      setSavingPokemon(false)
    }
  }

  const perfil = perfilQuery.data ?? null
  const timePrincipal = perfil?.timePrincipal ?? []
  const naBox = perfil?.box ?? []

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

                {(expandedEdit.movimentoIds || []).length >= 8 && (
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
                    disabled={xpLoading || ((expandedEdit.movimentoIds || []).length >= 8 && !substituirMovimentoId)}
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
    </div>
  )
}
