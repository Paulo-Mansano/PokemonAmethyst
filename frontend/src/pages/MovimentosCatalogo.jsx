import { useEffect, useState } from 'react'
import { getMovimentos, importarMovimentosPokeApi, criarMovimento, atualizarMovimento, getUsuario } from '../api'

const TIPAGENS = ['NORMAL', 'FOGO', 'AGUA', 'ELETRICO', 'GRAMA', 'GELO', 'LUTADOR', 'VENENOSO', 'TERRA', 'VOADOR', 'PSIQUICO', 'INSETO', 'PEDRA', 'FANTASMA', 'DRAGAO', 'SOMBRIO', 'METAL', 'FADA']
const CATEGORIAS = ['FISICO', 'ESPECIAL', 'STATUS']

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

function getMoveCardBackground(move) {
  const base = '#151521'
  const tipo = move?.tipo
  const hex = tipo && TYPE_COLORS[tipo] ? TYPE_COLORS[tipo] : null
  if (!hex) return base
  const [r, g, b] = hexToRgb(hex)
  return `linear-gradient(135deg, rgba(${r},${g},${b},0.25), rgba(${r},${g},${b},0.05)), ${base}`
}

export default function MovimentosCatalogo() {
  const [user, setUser] = useState(null)
  const [movimentos, setMovimentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [info, setInfo] = useState('')
  const [editingItem, setEditingItem] = useState(null)
  const [creatingItem, setCreatingItem] = useState(false)
  const [editForm, setEditForm] = useState({
    nome: '',
    nomeEn: '',
    tipo: 'NORMAL',
    categoria: '',
    custoStamina: 0,
    dadoDeDano: '',
    descricaoEfeito: '',
  })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editErro, setEditErro] = useState('')
  const [importing, setImporting] = useState(false)

  const load = () => {
    setLoading(true)
    setErro('')
    getUsuario()
      .then((u) => {
        setUser(u)
        return getMovimentos()
      })
      .then(setMovimentos)
      .catch((e) => setErro(e.message || 'Erro ao carregar movimentos'))
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
      tipo: item.tipo || 'NORMAL',
      categoria: item.categoria ?? '',
      custoStamina: item.custoStamina ?? 0,
      dadoDeDano: item.dadoDeDano ?? '',
      descricaoEfeito: item.descricaoEfeito ?? '',
    })
    setEditErro('')
  }

  const handleImportarPokeApi = async () => {
    setErro('')
    setInfo('')
    setImporting(true)
    try {
      const res = await importarMovimentosPokeApi()
      const n = res?.importados ?? 0
      setInfo(`${n} movimentos importados da PokéAPI (nomes e descrição em PT quando disponível).`)
      load()
    } catch (e) {
      setErro(e.message || 'Erro ao importar movimentos')
    } finally {
      setImporting(false)
    }
  }

  const handleAbrirCriar = () => {
    setCreatingItem(true)
    setEditForm({
      nome: '',
      nomeEn: '',
      tipo: 'NORMAL',
      categoria: '',
      custoStamina: 0,
      dadoDeDano: '',
      descricaoEfeito: '',
    })
    setEditErro('')
  }

  const handleSalvarEdicao = async (e) => {
    e?.preventDefault()
    if (!editingItem) return
    setEditErro('')
    setSavingEdit(true)
    try {
      await atualizarMovimento(editingItem.id, {
        nome: editForm.nome || undefined,
        nomeEn: editForm.nomeEn || undefined,
        tipo: editForm.tipo,
        categoria: editForm.categoria || undefined,
        custoStamina: editForm.custoStamina,
        dadoDeDano: editForm.dadoDeDano || undefined,
        descricaoEfeito: editForm.descricaoEfeito || undefined,
      })
      setInfo('Movimento atualizado com sucesso.')
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
      await criarMovimento({
        nome: editForm.nome.trim(),
        nomeEn: editForm.nomeEn || undefined,
        tipo: editForm.tipo,
        categoria: editForm.categoria || undefined,
        custoStamina: editForm.custoStamina,
        dadoDeDano: editForm.dadoDeDano || undefined,
        descricaoEfeito: editForm.descricaoEfeito || undefined,
      })
      setInfo('Movimento criado com sucesso.')
      setCreatingItem(false)
      load()
    } catch (e) {
      setEditErro(e.message || 'Erro ao criar movimento')
    } finally {
      setSavingEdit(false)
    }
  }

  if (loading) {
    return <div className="container">Carregando catálogo de movimentos...</div>
  }

  if (!user?.mestre) {
    return (
      <div className="container">
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ marginTop: 0 }}>Acesso restrito</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Apenas usuários marcados como <strong>Mestre</strong> podem gerenciar ataques/movimentos.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '1rem' }}>Ataques / Movimentos</h1>

      {erro && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{erro}</p>}
      {info && <p style={{ color: 'var(--success)', marginBottom: '1rem' }}>{info}</p>}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Movimentos cadastrados ({movimentos.length})</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '0.85rem' }}
              onClick={handleAbrirCriar}
            >
              Criar movimento
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
              onClick={handleImportarPokeApi}
              disabled={importing}
            >
              {importing ? 'Importando...' : 'Importar todos da PokéAPI'}
            </button>
          </div>
        </div>
        {movimentos.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum movimento. Use &quot;Criar movimento&quot; ou &quot;Importar todos da PokéAPI&quot;.</p>
        ) : (
          <div className="movimentos-grid">
            {movimentos.map((m) => (
              <div key={m.id} className="movimento-card card" style={{ background: getMoveCardBackground(m) }}>
                <div className="movimento-card-header">
                  <h4 className="movimento-card-nome">{m.nome}</h4>
                  {m.tipo && (
                    <span className={`pokemon-type-tag pokemon-type-${(m.tipo || '').toLowerCase()}`}>
                      {m.tipo}
                    </span>
                  )}
                </div>
                {m.nomeEn && <span className="movimento-card-nome-en">{m.nomeEn}</span>}
                <div className="movimento-card-meta">
                  {m.categoria && <span>{m.categoria}</span>}
                  <span>Stamina: {m.custoStamina ?? 0}</span>
                  {m.dadoDeDano && <span>Dado: {m.dadoDeDano}</span>}
                </div>
                <p className="movimento-card-efeito">{m.descricaoEfeito || '—'}</p>
                <div className="movimento-card-actions">
                  <button type="button" className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => handleEditar(m)}>
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
          <div className="card" style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>{creatingItem ? 'Criar movimento' : 'Editar movimento'}</h3>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Tipo *</label>
                  <select
                    className="input"
                    value={editForm.tipo}
                    onChange={(e) => setEditForm((f) => ({ ...f, tipo: e.target.value }))}
                  >
                    {TIPAGENS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Categoria</label>
                  <select
                    className="input"
                    value={editForm.categoria}
                    onChange={(e) => setEditForm((f) => ({ ...f, categoria: e.target.value }))}
                  >
                    <option value="">—</option>
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Custo stamina</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    value={editForm.custoStamina}
                    onChange={(e) => setEditForm((f) => ({ ...f, custoStamina: parseInt(e.target.value, 10) || 0 }))}
                  />
                </div>
                <div className="form-group">
                  <label>Dado de dano</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="ex: 2d6"
                    value={editForm.dadoDeDano}
                    onChange={(e) => setEditForm((f) => ({ ...f, dadoDeDano: e.target.value }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Descrição do efeito</label>
                <textarea
                  className="input"
                  rows={4}
                  value={editForm.descricaoEfeito}
                  onChange={(e) => setEditForm((f) => ({ ...f, descricaoEfeito: e.target.value }))}
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
