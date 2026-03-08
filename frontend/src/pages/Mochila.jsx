import { useState, useEffect } from 'react'
import { getMochila, getItens, adicionarItemMochila, removerItemMochila } from '../api'

export default function Mochila() {
  const [mochila, setMochila] = useState(null)
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [addItemId, setAddItemId] = useState('')
  const [addQtd, setAddQtd] = useState(1)
  const [adding, setAdding] = useState(false)

  const load = () => {
    Promise.all([getMochila(), getItens()])
      .then(([m, list]) => {
        setMochila(m)
        setItens(list)
        if (list.length > 0 && !addItemId) setAddItemId(list[0]?.id ?? '')
      })
      .catch(() => setErro('Erro ao carregar'))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  const handleAdicionar = async (e) => {
    e.preventDefault()
    if (!addItemId || addQtd < 1) return
    setErro('')
    setAdding(true)
    try {
      await adicionarItemMochila(addItemId, addQtd)
      load()
    } catch (err) {
      setErro(err.message)
    } finally {
      setAdding(false)
    }
  }

  const handleRemover = async (itemId, qtd) => {
    try {
      await removerItemMochila(itemId, qtd)
      load()
    } catch (err) {
      setErro(err.message)
    }
  }

  if (loading) return <div className="container">Carregando mochila...</div>

  return (
    <div className="container">
      <h1 style={{ marginBottom: '1rem' }}>Mochila</h1>
      {erro && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{erro}</p>}

      {mochila && (
        <div className="card">
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>
            Peso: {mochila.pesoAtual?.toFixed(1) ?? 0} / {mochila.pesoMaximo} kg
          </p>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Adicionar item</h3>
        <form onSubmit={handleAdicionar} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 200 }}>
            <label>Item</label>
            <select value={addItemId} onChange={(e) => setAddItemId(e.target.value)}>
              {itens.map((i) => (
                <option key={i.id} value={i.id}>{i.nome}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0, width: 80 }}>
            <label>Qtd</label>
            <input type="number" min={1} value={addQtd} onChange={(e) => setAddQtd(parseInt(e.target.value, 10) || 1)} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={adding || itens.length === 0}>
            {adding ? '...' : 'Adicionar'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Itens na mochila</h3>
        {!mochila?.itens?.length ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum item. Adicione itens pelo formulário acima (é necessário ter itens no catálogo).</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {mochila.itens.map((mi) => (
              <li key={mi.itemId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <span><strong>{mi.itemNome}</strong> × {mi.quantidade} ({(mi.pesoUnitario * mi.quantidade).toFixed(1)} kg)</span>
                <button type="button" className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => handleRemover(mi.itemId, 1)}>
                  Remover 1
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
