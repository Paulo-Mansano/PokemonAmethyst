import { useEffect, useState } from 'react'
import { getHabilidades, importarHabilidadesPokeApi, criarHabilidade, atualizarHabilidade, getUsuario } from '../api'

export default function HabilidadesCatalogo() {
  const [user, setUser] = useState(null)
  const [habilidades, setHabilidades] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [info, setInfo] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [creatingItem, setCreatingItem] = useState(false)
  const [editForm, setEditForm] = useState({ nome: '', nomeEn: '', descricao: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editErro, setEditErro] = useState('')
  const [importing, setImporting] = useState(false)

  const load = () => {
    setLoading(true)
    setErro('')
    getUsuario()
      .then((u) => {
        setUser(u)
        return getHabilidades()
      })
      .then(setHabilidades)
      .catch((e) => setErro(e.message || 'Erro ao carregar habilidades'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

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
      load()
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
      load()
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
      load()
    } catch (e) {
      setEditErro(e.message || 'Erro ao criar habilidade')
    } finally {
      setSavingEdit(false)
    }
  }

  if (loading) {
    return <div className="container">Carregando catálogo de habilidades...</div>
  }

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

  return (
    <div className="container">
      <h1 style={{ marginBottom: '1rem' }}>Catálogo de Habilidades</h1>

      {erro && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{erro}</p>}
      {info && <p style={{ color: 'var(--success)', marginBottom: '1rem' }}>{info}</p>}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Habilidades cadastradas ({habilidades.length})</h3>
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
        {habilidades.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhuma habilidade. Use &quot;Criar habilidade&quot; ou &quot;Importar todas da PokéAPI&quot;.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nome (PT)</th>
                  <th>Nome (EN)</th>
                  <th>Descrição</th>
                  <th style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {habilidades.map((h) => (
                  <tr key={h.id}>
                    <td>{h.nome}</td>
                    <td>{h.nomeEn || '—'}</td>
                    <td style={{ maxWidth: 400 }}>{h.descricao || '—'}</td>
                    <td>
                      <button type="button" className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => handleEditar(h)}>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
