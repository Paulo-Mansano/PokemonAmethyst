import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMeuPerfil, getMochila, getItens, adicionarItemMochila, removerItemMochila } from '../api'
import { usePlayerTarget } from '../context/PlayerTargetContext'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../query/queryKeys'

export default function Mochila() {
  const { playerId, readyForPlayerApi } = usePlayerTarget()
  const queryClient = useQueryClient()
  const [erro, setErro] = useState('')
  const [addItemId, setAddItemId] = useState('')
  const [addBusca, setAddBusca] = useState('')
  const [addQtd, setAddQtd] = useState(1)
  const [itemQtdEdicao, setItemQtdEdicao] = useState({})

  const perfilQuery = useQuery({
    queryKey: queryKeys.perfil(playerId),
    queryFn: () => getMeuPerfil(playerId),
    enabled: readyForPlayerApi,
    staleTime: 60 * 1000,
  })

  const mochilaQuery = useQuery({
    queryKey: queryKeys.mochila(playerId),
    queryFn: () => getMochila(playerId),
    enabled: readyForPlayerApi && !!perfilQuery.data,
    staleTime: 60 * 1000,
  })

  const itensQuery = useQuery({
    queryKey: queryKeys.catalogo.itens,
    queryFn: getItens,
    enabled: readyForPlayerApi && !!perfilQuery.data,
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })

  useEffect(() => {
    const list = Array.isArray(itensQuery.data) ? itensQuery.data : []
    if (list.length > 0) {
      setAddItemId((prev) => prev || list[0]?.id || '')
    }
  }, [itensQuery.data])

  useEffect(() => {
    const mochilaItens = Array.isArray(mochilaQuery.data?.itens) ? mochilaQuery.data.itens : []
    const inicial = {}
    mochilaItens.forEach((mi) => {
      inicial[mi.itemId] = mi.quantidade ?? 0
    })
    setItemQtdEdicao(inicial)
  }, [mochilaQuery.data])

  const adicionarMutation = useMutation({
    mutationFn: ({ itemId, quantidade }) => adicionarItemMochila(itemId, quantidade, playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mochila(playerId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.perfil(playerId) })
    },
    onError: (err) => setErro(err?.message || 'Erro ao adicionar item'),
  })

  const removerMutation = useMutation({
    mutationFn: ({ itemId, quantidade }) => removerItemMochila(itemId, quantidade, playerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.mochila(playerId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.perfil(playerId) })
    },
    onError: (err) => setErro(err?.message || 'Erro ao remover item'),
  })

  const handleAdicionar = async (e) => {
    e.preventDefault()
    const itemSelecionado = selectedAddItemId || addItemId
    if (!itemSelecionado || addQtd < 1) return
    setErro('')
    await adicionarMutation.mutateAsync({ itemId: itemSelecionado, quantidade: addQtd })
  }

  const handleRemover = async (itemId, qtd) => {
    setErro('')
    await removerMutation.mutateAsync({ itemId, quantidade: qtd })
  }

  const handleSalvarQuantidade = async (itemId, quantidadeAtual) => {
    const alvo = Number(itemQtdEdicao[itemId] ?? quantidadeAtual)
    const quantidadeAlvo = Number.isFinite(alvo) ? Math.max(0, Math.trunc(alvo)) : 0
    const delta = quantidadeAlvo - quantidadeAtual
    if (delta === 0) return
    setErro('')
    if (delta > 0) {
      await adicionarMutation.mutateAsync({ itemId, quantidade: delta })
      return
    }
    await removerMutation.mutateAsync({ itemId, quantidade: Math.abs(delta) })
  }

  if (!readyForPlayerApi) return <div className="container">Carregando mochila...</div>

  if (perfilQuery.isLoading || mochilaQuery.isLoading || itensQuery.isLoading) return <div className="container">Carregando mochila...</div>

  const perfil = perfilQuery.data ?? null
  const mochila = mochilaQuery.data ?? null
  const itens = Array.isArray(itensQuery.data) ? itensQuery.data : []
  const termoBusca = addBusca.trim().toLowerCase()
  const itensFiltrados = termoBusca
    ? itens.filter((i) => (`${i.nome ?? ''} ${i.nomeEn ?? ''}`).toLowerCase().includes(termoBusca))
    : itens
  const selectedAddItemId = itensFiltrados.some((i) => i.id === addItemId)
    ? addItemId
    : (itensFiltrados[0]?.id || '')
  const itensTabela = Array.isArray(mochila?.itens) ? mochila.itens : []

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
        <form onSubmit={handleAdicionar} style={{ display: 'grid', gap: '0.75rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Pesquisar item</label>
            <input
              type="text"
              value={addBusca}
              onChange={(e) => setAddBusca(e.target.value)}
              placeholder="Digite o nome do item..."
            />
          </div>
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', maxHeight: 240, overflowY: 'auto', background: 'var(--bg)' }}>
            {itensFiltrados.length === 0 ? (
              <p style={{ margin: 0, padding: '0.75rem', color: 'var(--text-muted)' }}>Nenhum item encontrado para essa busca.</p>
            ) : (
              itensFiltrados.map((i) => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setAddItemId(i.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    padding: '0.55rem 0.7rem',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    background: selectedAddItemId === i.id ? 'rgba(124, 92, 191, 0.16)' : 'transparent',
                    color: 'var(--text)',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {i.imagemUrl ? (
                    <img src={i.imagemUrl} alt="" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }} />
                  ) : (
                    <span style={{ width: 32, height: 32, display: 'inline-block', background: 'var(--border)', borderRadius: 4, flexShrink: 0 }} title="Sem imagem" />
                  )}
                  <span style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.nome}</strong>
                    <small style={{ color: 'var(--text-muted)' }}>{i.nomeEn || '—'}</small>
                  </span>
                </button>
              ))
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ marginBottom: 0, width: 90 }}>
              <label>Qtd</label>
              <input type="number" min={1} value={addQtd} onChange={(e) => setAddQtd(parseInt(e.target.value, 10) || 1)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={adicionarMutation.isPending || itens.length === 0 || !selectedAddItemId}>
              {adicionarMutation.isPending ? '...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Itens na mochila</h3>
        {!itensTabela.length ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum item na mochila. Adicione itens pelo formulário acima.</p>
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
                  <th style={{ width: 240, textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {itensTabela.map((mi) => (
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
                    <td style={{ width: 80 }}>
                      <input
                        type="number"
                        min={0}
                        value={itemQtdEdicao[mi.itemId] ?? mi.quantidade}
                        onChange={(e) => {
                          const num = Number.parseInt(e.target.value, 10)
                          setItemQtdEdicao((prev) => ({ ...prev, [mi.itemId]: Number.isFinite(num) ? Math.max(0, num) : 0 }))
                        }}
                        style={{ width: 72 }}
                      />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleSalvarQuantidade(mi.itemId, mi.quantidade)}
                        disabled={adicionarMutation.isPending || removerMutation.isPending}
                        style={{ marginRight: '0.4rem' }}
                      >
                        Salvar qtd
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.85rem' }}
                        onClick={() => handleRemover(mi.itemId, mi.quantidade)}
                        disabled={(mi.quantidade ?? 0) <= 0 || removerMutation.isPending}
                      >
                        Remover
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
