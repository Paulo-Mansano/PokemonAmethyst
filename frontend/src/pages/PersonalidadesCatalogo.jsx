import { useEffect, useState } from 'react'
import { getPersonalidades, criarPersonalidade, atualizarPersonalidade, getUsuario } from '../api'

export default function PersonalidadesCatalogo() {
  const [user, setUser] = useState(null)
  const [personalidades, setPersonalidades] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [info, setInfo] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [creatingItem, setCreatingItem] = useState(false)
  const [editForm, setEditForm] = useState({ nome: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editErro, setEditErro] = useState('')

  const load = () => {
    setLoading(true)
    setErro('')
    getUsuario()
      .then((u) => {
        setUser(u)
        return getPersonalidades()
      })
      .then(setPersonalidades)
      .catch((e) => setErro(e.message || 'Erro ao carregar personalidades'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleEditar = (item) => {
    setEditingItem(item)
    setEditForm({ nome: item.nome ?? '' })
    setEditErro('')
  }

  const handleAbrirCriar = () => {
    setCreatingItem(true)
    setEditForm({ nome: '' })
    setEditErro('')
  }

  const handleSalvarEdicao = async (e) => {
    e?.preventDefault()
    if (!editingItem) return
    setEditErro('')
    setSavingEdit(true)
    try {
      await atualizarPersonalidade(editingItem.id, { nome: editForm.nome?.trim() || undefined })
      setInfo('Personalidade atualizada com sucesso.')
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
      setEditErro('Nome é obrigatório.')
      return
    }
    setEditErro('')
    setSavingEdit(true)
    try {
      await criarPersonalidade({ nome: editForm.nome.trim() })
      setInfo('Personalidade criada com sucesso.')
      setCreatingItem(false)
      load()
    } catch (e) {
      setEditErro(e.message || 'Erro ao criar personalidade')
    } finally {
      setSavingEdit(false)
    }
  }

  if (loading) {
    return <div className="container">Carregando personalidades...</div>
  }

  if (!user?.mestre) {
    return (
      <div className="container">
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ marginTop: 0 }}>Acesso restrito</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Apenas usuários marcados como <strong>Mestre</strong> podem gerenciar personalidades.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '1rem' }}>Personalidades</h1>

      {erro && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{erro}</p>}
      {info && <p style={{ color: 'var(--success)', marginBottom: '1rem' }}>{info}</p>}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Personalidades cadastradas ({personalidades.length})</h3>
          <button
            type="button"
            className="btn btn-primary"
            style={{ fontSize: '0.85rem' }}
            onClick={handleAbrirCriar}
          >
            Criar personalidade
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 0, marginBottom: '0.75rem' }}>
          Todas as personalidades são autorais (não vêm da PokéAPI).
        </p>
        {personalidades.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhuma personalidade. Clique em &quot;Criar personalidade&quot;.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {personalidades.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nome}</td>
                    <td>
                      <button type="button" className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => handleEditar(p)}>
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
          <div className="card" style={{ maxWidth: 400, width: '100%' }}>
            <h3 style={{ marginTop: 0 }}>{creatingItem ? 'Criar personalidade' : 'Editar personalidade'}</h3>
            <form onSubmit={creatingItem ? handleSalvarNovo : handleSalvarEdicao}>
              <div className="form-group">
                <label>Nome *</label>
                <input
                  type="text"
                  className="input"
                  value={editForm.nome}
                  onChange={(e) => setEditForm((f) => ({ ...f, nome: e.target.value }))}
                  required
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
