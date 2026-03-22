import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getMeuPerfil, getMochila, getItens, adicionarItemMochila, removerItemMochila } from '../api'
import { usePlayerTarget } from '../context/PlayerTargetContext'

export default function Mochila() {
  const { playerId, readyForPlayerApi } = usePlayerTarget()
  const [perfil, setPerfil] = useState(null)
  const [mochila, setMochila] = useState(null)
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [addItemId, setAddItemId] = useState('')
  const [addQtd, setAddQtd] = useState(1)
  const [adding, setAdding] = useState(false)

  const load = useCallback(() => {
    if (!readyForPlayerApi) return Promise.resolve()
    setLoading(true)
    return getMeuPerfil(playerId)
      .then((p) => {
        setPerfil(p)
        if (!p) return null
        return Promise.all([getMochila(playerId), getItens()])
      })
      .then((result) => {
        if (result) {
          const [m, list] = result
          setMochila(m)
          setItens(list)
          setAddItemId((prev) => prev || list[0]?.id || '')
        }
      })
      .catch(() => setErro('Erro ao carregar'))
      .finally(() => setLoading(false))
  }, [readyForPlayerApi, playerId])

  useEffect(() => {
    if (!readyForPlayerApi) return
    load()
  }, [readyForPlayerApi, playerId, load])

  const handleAdicionar = async (e) => {
    e.preventDefault()
    if (!addItemId || addQtd < 1) return
    setErro('')
    setAdding(true)
    try {
      await adicionarItemMochila(addItemId, addQtd, playerId)
      await load()
    } catch (err) {
      setErro(err.message)
    } finally {
      setAdding(false)
    }
  }

  const handleRemover = async (itemId, qtd) => {
    try {
      await removerItemMochila(itemId, qtd, playerId)
      await load()
    } catch (err) {
      setErro(err.message)
    }
  }

  if (!readyForPlayerApi) return <div className="container">Carregando mochila...</div>

  if (loading) return <div className="container">Carregando mochila...</div>

  if (!perfil) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ marginTop: 0 }}>Ficha do treinador necessária</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Crie sua ficha do treinador na aba Ficha para acessar a mochila.
          </p>
          <Link to="/" className="btn btn-primary">Ir para Ficha</Link>
        </div>
      </div>
    )
  }

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
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 56 }}></th>
                  <th>Nome (PT)</th>
                  <th>Nome (EN)</th>
                  <th>Descrição</th>
                  <th>Peso</th>
                  <th>Preço</th>
                  <th>Qtd</th>
                  <th style={{ width: 90 }}></th>
                </tr>
              </thead>
              <tbody>
                {mochila.itens.map((mi) => (
                  <tr key={mi.itemId}>
                    <td>
                      {mi.imagemUrl ? (
                        <img src={mi.imagemUrl} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                      ) : (
                        <span style={{ width: 40, height: 40, display: 'inline-block', background: 'var(--border)', borderRadius: 4 }} title="Sem imagem" />
                      )}
                    </td>
                    <td>{mi.itemNome}</td>
                    <td>{mi.itemNomeEn || '—'}</td>
                    <td style={{ maxWidth: 400 }}>{mi.descricao || '—'}</td>
                    <td>{mi.pesoUnitario}</td>
                    <td>{mi.preco}</td>
                    <td>{mi.quantidade}</td>
                    <td>
                      <button type="button" className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => handleRemover(mi.itemId, 1)}>
                        Remover 1
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
