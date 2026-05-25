import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getLogs } from '../api'
import { queryKeys } from '../query/queryKeys'
import { usePlayerTarget } from '../context/PlayerTargetContext'

// ── Metadados por tipo de ação ──────────────────────────────────────────────

const ACOES_META = {
  POKEMON_GERADO:          { label: 'Pokémon gerado',        cor: 'var(--success)',      grupo: 'pokemon' },
  POKEMON_CRIADO:          { label: 'Pokémon criado',         cor: 'var(--success)',      grupo: 'pokemon' },
  POKEMON_EXCLUIDO:        { label: 'Pokémon excluído',       cor: 'var(--danger)',       grupo: 'pokemon' },
  POKEMON_CAPTURADO:       { label: 'Pokémon capturado',      cor: 'var(--accent-hover)', grupo: 'pokemon' },
  POKEMON_EVOLUIDO:        { label: 'Pokémon evoluiu',        cor: 'var(--accent)',       grupo: 'pokemon' },
  XP_GANHO:                { label: 'XP ganho',              cor: 'var(--accent)',       grupo: 'pokemon' },
  FICHA_SALVA:             { label: 'Ficha salva',           cor: 'var(--accent)',       grupo: 'perfil'  },
  ITEM_ADICIONADO:         { label: 'Item adicionado',        cor: 'var(--success)',      grupo: 'mochila' },
  ITEM_REMOVIDO:           { label: 'Item removido',          cor: 'var(--danger)',       grupo: 'mochila' },
  HABILIDADE_CRIADA:       { label: 'Habilidade criada',      cor: 'var(--success)',      grupo: 'catalogo' },
  HABILIDADE_ATUALIZADA:   { label: 'Habilidade atualizada',  cor: 'var(--accent)',       grupo: 'catalogo' },
  MOVIMENTO_CRIADO:        { label: 'Movimento criado',       cor: 'var(--success)',      grupo: 'catalogo' },
  MOVIMENTO_ATUALIZADO:    { label: 'Movimento atualizado',   cor: 'var(--accent)',       grupo: 'catalogo' },
  MOVIMENTO_EXCLUIDO:      { label: 'Movimento excluído',     cor: 'var(--danger)',       grupo: 'catalogo' },
  ITEM_CRIADO:             { label: 'Item criado',            cor: 'var(--success)',      grupo: 'catalogo' },
  ITEM_ATUALIZADO:         { label: 'Item atualizado',        cor: 'var(--accent)',       grupo: 'catalogo' },
  ITEM_EXCLUIDO:           { label: 'Item excluído',          cor: 'var(--danger)',       grupo: 'catalogo' },
  PERSONALIDADE_CRIADA:    { label: 'Personalidade criada',   cor: 'var(--success)',      grupo: 'catalogo' },
  PERSONALIDADE_ATUALIZADA:{ label: 'Personalidade atualizada',cor: 'var(--accent)',      grupo: 'catalogo' },
  CONTA_MESTRE_CRIADA:     { label: 'Conta Mestre criada',    cor: 'var(--success)',      grupo: 'admin'   },
}

const GRUPOS = [
  { value: '',        label: 'Todas as ações' },
  { value: 'pokemon', label: 'Pokémon' },
  { value: 'perfil',  label: 'Fichas' },
  { value: 'mochila', label: 'Mochila' },
  { value: 'catalogo',label: 'Catálogo' },
  { value: 'admin',   label: 'Admin' },
]

// ── Utilitários ──────────────────────────────────────────────────────────────

function tempoRelativo(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`
  if (diff < 86400 * 7) return `há ${Math.floor(diff / 86400)} d`
  return d.toLocaleDateString('pt-BR')
}

function formatarDataCompleta(isoStr) {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleString('pt-BR')
}

function metaDeAcao(acao) {
  return ACOES_META[acao] ?? { label: acao, cor: 'var(--text-muted)', grupo: '' }
}

// ── Ícones ───────────────────────────────────────────────────────────────────

function IconCircle({ cor }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
      background: `${cor}22`, border: `1.5px solid ${cor}66`,
    }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: cor, display: 'block' }} />
    </span>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────

export default function Logs() {
  const { jogadores } = usePlayerTarget()

  const [filtroUsuarioId, setFiltroUsuarioId] = useState('')
  const [filtroGrupo, setFiltroGrupo] = useState('')
  const [page, setPage] = useState(0)

  const acoesDoGrupo = useMemo(() => {
    if (!filtroGrupo) return []
    return Object.entries(ACOES_META)
      .filter(([, m]) => m.grupo === filtroGrupo)
      .map(([k]) => k)
  }, [filtroGrupo])

  const filters = useMemo(() => ({
    page,
    size: 50,
    usuarioId: filtroUsuarioId || undefined,
    acao: acoesDoGrupo.length === 1 ? acoesDoGrupo[0] : undefined,
  }), [page, filtroUsuarioId, acoesDoGrupo])

  const logsQuery = useQuery({
    queryKey: queryKeys.logs(filters),
    queryFn: () => getLogs(filters),
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev,
  })

  const dados = logsQuery.data ?? { content: [], totalElements: 0, totalPages: 0, number: 0 }

  // filtro de grupo no cliente quando há múltiplas ações no grupo
  const itens = useMemo(() => {
    if (!filtroGrupo || acoesDoGrupo.length <= 1) return dados.content ?? []
    return (dados.content ?? []).filter((e) => acoesDoGrupo.includes(e.acao))
  }, [dados.content, filtroGrupo, acoesDoGrupo])

  function limparFiltros() {
    setFiltroUsuarioId('')
    setFiltroGrupo('')
    setPage(0)
  }

  const temFiltro = filtroUsuarioId || filtroGrupo

  return (
    <div className="container">
      <h1 style={{ marginBottom: '1rem' }}>Logs de Atividade</h1>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>

          {/* Filtro por jogador */}
          <div className="form-group" style={{ margin: 0, flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>
              Jogador
            </label>
            <select
              className="input"
              value={filtroUsuarioId}
              onChange={(e) => { setFiltroUsuarioId(e.target.value); setPage(0) }}
              style={{ width: '100%', padding: '0.5rem 0.75rem' }}
            >
              <option value="">Todos os jogadores</option>
              {jogadores.map((j) => (
                <option key={j.id} value={j.usuarioId ?? ''}>
                  {j.nomePersonagem?.trim() || j.nomeUsuario || `Perfil ${j.id.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por grupo */}
          <div className="form-group" style={{ margin: 0, flex: '1 1 180px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>
              Tipo de ação
            </label>
            <select
              className="input"
              value={filtroGrupo}
              onChange={(e) => { setFiltroGrupo(e.target.value); setPage(0) }}
              style={{ width: '100%', padding: '0.5rem 0.75rem' }}
            >
              {GRUPOS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          {temFiltro && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem', alignSelf: 'flex-end' }}
              onClick={limparFiltros}
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            {logsQuery.isFetching ? 'Carregando...' : `${dados.totalElements} registro${dados.totalElements !== 1 ? 's' : ''}`}
          </h3>
        </div>

        {logsQuery.isError && (
          <p style={{ color: 'var(--danger)' }}>Erro ao carregar logs.</p>
        )}

        {!logsQuery.isError && itens.length === 0 && !logsQuery.isFetching && (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
            Nenhum registro encontrado.
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {itens.map((entry) => {
            const meta = metaDeAcao(entry.acao)
            return (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius)',
                  background: 'rgba(8,6,18,.45)',
                  border: '1px solid rgba(168,85,247,.1)',
                  transition: 'border-color .15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,.28)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(168,85,247,.1)'}
              >
                <IconCircle cor={meta.cor} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '0.92rem' }}>
                      {entry.nomeUsuario}
                    </span>
                    <span style={{ color: meta.cor, fontSize: '0.82rem', fontWeight: 600 }}>
                      {meta.label}
                    </span>
                  </div>
                  {entry.detalhes && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.detalhes}
                    </div>
                  )}
                </div>

                <div
                  style={{ color: 'var(--text-muted)', fontSize: '0.78rem', flexShrink: 0, textAlign: 'right' }}
                  title={formatarDataCompleta(entry.criadoEm)}
                >
                  {tempoRelativo(entry.criadoEm)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Paginação */}
        {(dados.totalPages > 1 || page > 0) && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
              disabled={page === 0 || logsQuery.isFetching}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ← Anterior
            </button>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', alignSelf: 'center' }}>
              {page + 1} / {dados.totalPages}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
              disabled={page >= dados.totalPages - 1 || logsQuery.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
