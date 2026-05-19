import { useEffect, useMemo, useState } from 'react'
import { getHabilidades, importarHabilidadesPokeApi, criarHabilidade, atualizarHabilidade, getUsuario } from '../api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../query/queryKeys'

export default function HabilidadesCatalogo() {
  const queryClient = useQueryClient()
  const [erro, setErro] = useState('')
  const [info, setInfo] = useState('')
  const [busca, setBusca] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [creatingItem, setCreatingItem] = useState(false)
  const [editForm, setEditForm] = useState({ nome: '', nomeEn: '', descricao: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editErro, setEditErro] = useState('')
  const [importing, setImporting] = useState(false)

  const userQuery = useQuery({
    queryKey: queryKeys.auth.usuario,
    queryFn: getUsuario,
    staleTime: 10 * 60 * 1000,
  })

  const habilidadesQuery = useQuery({
    queryKey: queryKeys.catalogo.habilidades,
    queryFn: getHabilidades,
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })

  useEffect(() => {
    if (userQuery.isError || habilidadesQuery.isError) {
      setErro('Erro ao carregar habilidades')
    }
  }, [userQuery.isError, habilidadesQuery.isError])

  const handleEditar = (item) => {
    setEditingItem(item)
    setEditForm({
      nome: item.nome ?? '',
      nomeEn: item.nomeEn ?? '',
      descricao: item.descricao ?? '',
    })
    setEditErro('')
  }

  const handleImportarPokeApi = async () => {
    setErro('')
    setInfo('')
    setImporting(true)
    try {
      const res = await importarHabilidadesPokeApi()
      const n = res?.importados ?? 0
      setInfo(`${n} habilidades importadas da PokéAPI (nomes em PT e EN, descrição em PT quando disponível).`)
      queryClient.invalidateQueries({ queryKey: queryKeys.catalogo.habilidades })
    } catch (e) {
      setErro(e.message || 'Erro ao importar habilidades')
    } finally {
      setImporting(false)
    }
  }

  const handleAbrirCriar = () => {
    setCreatingItem(true)
    setEditForm({ nome: '', nomeEn: '', descricao: '' })
    setEditErro('')
  }

  const handleSalvarEdicao = async (e) => {
    e?.preventDefault()
    if (!editingItem) return
    setEditErro('')
    setSavingEdit(true)
    try {
      await atualizarHabilidade(editingItem.id, {
        nome: editForm.nome || undefined,
        nomeEn: editForm.nomeEn || undefined,
        descricao: editForm.descricao || undefined,
      })
      setInfo('Habilidade atualizada com sucesso.')
      setEditingItem(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.catalogo.habilidades })
    } catch (e) {
      setEditErro(e.message || 'Erro ao salvar')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleSalvarNovo = async (e) => {
    e?.preventDefault()
    if (!editForm.nome?.trim()) {
      setEditErro('Nome (português) é obrigatório.')
      return
    }
    setEditErro('')
    setSavingEdit(true)
    try {
      await criarHabilidade({
        nome: editForm.nome.trim(),
        nomeEn: editForm.nomeEn || undefined,
        descricao: editForm.descricao || undefined,
      })
      setInfo('Habilidade criada com sucesso.')
      setCreatingItem(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.catalogo.habilidades })
    } catch (e) {
      setEditErro(e.message || 'Erro ao criar habilidade')
    } finally {
      setSavingEdit(false)
    }
  }

  if (userQuery.isLoading || habilidadesQuery.isLoading) {
    return <div className="container">Carregando catálogo de habilidades...</div>
  }

  const user = userQuery.data
  const habilidades = habilidadesQuery.data || []

  if (!user?.mestre) {
    return (
      <div className="container">
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ marginTop: 0 }}>Acesso restrito</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Apenas usuários marcados como <strong>Mestre</strong> podem gerenciar habilidades.
          </p>
        </div>
      </div>
    )
  }

  const habilidadesFiltradas = busca.trim()
    ? habilidades.filter((h) => {
        const q = busca.trim().toLowerCase()
        return (h.nome || '').toLowerCase().includes(q) || (h.nomeEn || '').toLowerCase().includes(q)
      })
    : habilidades

  const countLabel = busca.trim()
    ? `${habilidadesFiltradas.length} de ${habilidades.length}`
    : String(habilidades.length)

  return (
    <div className="container">
      <h1 style={{ marginBottom: '1rem' }}>Catálogo de Habilidades</h1>

      {erro && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{erro}</p>}
      {info && <p style={{ color: 'var(--success)', marginBottom: '1rem' }}>{info}</p>}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Habilidades cadastradas ({countLabel})</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '0.85rem' }}
              onClick={handleAbrirCriar}
            >
              Criar habilidade
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
              onClick={handleImportarPokeApi}
              disabled={importing}
            >
              {importing ? 'Importando...' : 'Importar todas da PokéAPI'}
            </button>
          </div>
        </div>

        {habilidades.length > 0 && (
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <svg
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou nome em inglês..."
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem 0.6rem 2.25rem',
                background: 'rgba(8, 6, 18, 0.8)',
                border: '1px solid rgba(168, 85, 247, 0.18)',
                borderRadius: 'var(--radius)',
                color: 'var(--text)',
                fontSize: '0.95rem',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(168,85,247,.55)'
                e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,.08)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(168,85,247,.18)'
                e.target.style.boxShadow = 'none'
              }}
            />
          </div>
        )}

        {habilidadesFiltradas.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>
            {busca.trim()
              ? `Nenhuma habilidade encontrada para "${busca}".`
              : 'Nenhuma habilidade. Use "Criar habilidade" ou "Importar todas da PokéAPI".'}
          </p>
        ) : (
          <div className="habilidades-grid">
            {habilidadesFiltradas.map((h) => (
              <div key={h.id} className="habilidade-card card">
                <div className="habilidade-card-header">
                  <h4 className="habilidade-card-nome">{h.nome}</h4>
                  {h.nomeEn && <span className="habilidade-card-nome-en">{h.nomeEn}</span>}
                </div>
                <p className="habilidade-card-descricao">{h.descricao || '—'}</p>
                <div className="habilidade-card-actions">
                  <button type="button" className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => handleEditar(h)}>
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {(editingItem || creatingItem) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: 480, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>{creatingItem ? 'Criar habilidade' : 'Editar habilidade'}</h3>
            <form onSubmit={creatingItem ? handleSalvarNovo : handleSalvarEdicao}>
              <div className="form-group">
                <label>Nome (português) *</label>
                <input
                  type="text"
                  className="input"
                  value={editForm.nome}
                  onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nome (inglês)</label>
                <input
                  type="text"
                  className="input"
                  value={editForm.nomeEn}
                  onChange={(e) => setEditForm((f) => ({ ...f, nomeEn: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  className="input"
                  rows={4}
                  value={editForm.descricao}
                  onChange={(e) => setEditForm((f) => ({ ...f, descricao: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>
              {editErro && <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{editErro}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={savingEdit}>
                  {savingEdit ? (creatingItem ? 'Criando...' : 'Salvando...') : (creatingItem ? 'Criar' : 'Salvar')}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setEditingItem(null); setCreatingItem(false); setEditErro(''); }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
