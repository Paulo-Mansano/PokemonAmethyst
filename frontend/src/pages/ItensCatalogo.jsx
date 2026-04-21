import { useEffect, useState } from 'react'
import { getItens, importarItemPokeApi, listarItensPokeApi, atualizarItem, criarItem, atualizarImagensItens, getUsuario, excluirItem } from '../api'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../query/queryKeys'

export default function ItensCatalogo() {
  const queryClient = useQueryClient()
  const [erro, setErro] = useState('')
  const [info, setInfo] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchErro, setSearchErro] = useState('')
  const [importingId, setImportingId] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [creatingItem, setCreatingItem] = useState(false)
  const [editForm, setEditForm] = useState({ nome: '', nomeEn: '', descricao: '', peso: 0, preco: 0, imagemUrl: '' })
  const [savingEdit, setSavingEdit] = useState(false)
  const [editErro, setEditErro] = useState('')
  const [atualizandoImagens, setAtualizandoImagens] = useState(false)
  const [excluindoItemId, setExcluindoItemId] = useState(null)

  const userQuery = useQuery({
    queryKey: queryKeys.auth.usuario,
    queryFn: getUsuario,
    staleTime: 10 * 60 * 1000,
  })

  const itensQuery = useQuery({
    queryKey: queryKeys.catalogo.itens,
    queryFn: getItens,
    staleTime: 15 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })

  useEffect(() => {
    if (userQuery.isError || itensQuery.isError) {
      setErro('Erro ao carregar itens')
    }
  }, [userQuery.isError, itensQuery.isError])

  const handleBuscarItens = async (e) => {
    e?.preventDefault()
    const q = searchQuery?.trim()
    if (!q) return
    setSearchErro('')
    setSearchResults([])
    setSearchLoading(true)
    try {
      const lista = await listarItensPokeApi(q)
      setSearchResults(lista)
      if (lista.length === 0) setSearchErro('Nenhum item encontrado com esse termo.')
    } catch (e) {
      setSearchErro(e.message || 'Erro ao buscar itens na PokéAPI')
    } finally {
      setSearchLoading(false)
    }
  }

  const handleImportarItem = async (name) => {
    setSearchErro('')
    setImportingId(name)
    try {
      await importarItemPokeApi(name)
      setInfo(`"${name}" importado com sucesso.`)
      setSearchResults((prev) => prev.map((i) => (i.name === name ? { ...i, jaCadastrado: true } : i)))
      queryClient.invalidateQueries({ queryKey: queryKeys.catalogo.itens })
    } catch (e) {
      setSearchErro(e.message || 'Erro ao importar item')
    } finally {
      setImportingId(null)
    }
  }

  const handleEditar = (item) => {
    setEditingItem(item)
    setEditForm({
      nome: item.nome ?? '',
      nomeEn: item.nomeEn ?? '',
      descricao: item.descricao ?? '',
      peso: item.peso ?? 0,
      preco: item.preco ?? 0,
      imagemUrl: item.imagemUrl ?? '',
    })
    setEditErro('')
  }

  const handleAtualizarImagens = async () => {
    setErro('')
    setInfo('')
    setAtualizandoImagens(true)
    try {
      const res = await atualizarImagensItens()
      const n = res?.atualizados ?? 0
      setInfo(`${n} itens tiveram a imagem atualizada pela PokéAPI.`)
      queryClient.invalidateQueries({ queryKey: queryKeys.catalogo.itens })
    } catch (e) {
      setErro(e.message || 'Erro ao atualizar imagens')
    } finally {
      setAtualizandoImagens(false)
    }
  }

  const handleSalvarEdicao = async (e) => {
    e?.preventDefault()
    if (!editingItem) return
    setEditErro('')
    setSavingEdit(true)
    try {
      await atualizarItem(editingItem.id, {
        nome: editForm.nome || undefined,
        nomeEn: editForm.nomeEn || undefined,
        descricao: editForm.descricao || undefined,
        peso: editForm.peso,
        preco: editForm.preco,
        imagemUrl: editForm.imagemUrl || undefined,
      })
      setInfo('Item atualizado com sucesso.')
      setEditingItem(null)
      queryClient.invalidateQueries({ queryKey: queryKeys.catalogo.itens })
    } catch (e) {
      setEditErro(e.message || 'Erro ao salvar')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleAbrirCriar = () => {
    setCreatingItem(true)
    setEditForm({ nome: '', nomeEn: '', descricao: '', peso: 0, preco: 0, imagemUrl: '' })
    setEditErro('')
  }

  const handleSalvarNovoItem = async (e) => {
    e?.preventDefault()
    if (!editForm.nome?.trim()) {
      setEditErro('Nome (português) é obrigatório.')
      return
    }
    setEditErro('')
    setSavingEdit(true)
    try {
      await criarItem({
        nome: editForm.nome.trim(),
        nomeEn: editForm.nomeEn || undefined,
        descricao: editForm.descricao || undefined,
        peso: editForm.peso,
        preco: editForm.preco,
        imagemUrl: editForm.imagemUrl || undefined,
      })
      setInfo('Item criado com sucesso.')
      setCreatingItem(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.catalogo.itens })
    } catch (e) {
      setEditErro(e.message || 'Erro ao criar item')
    } finally {
      setSavingEdit(false)
    }
  }

  const handleExcluirItem = async (item) => {
    if (!item?.id) return
    const nome = item.nome || item.nomeEn || 'item'
    const confirmar = window.confirm(`Excluir o item "${nome}" do banco e remover de todos os inventarios?`)
    if (!confirmar) return
    setErro('')
    setInfo('')
    setExcluindoItemId(item.id)
    try {
      await excluirItem(item.id)
      if (editingItem?.id === item.id) {
        setEditingItem(null)
      }
      setInfo(`Item "${nome}" excluido com sucesso.`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.catalogo.itens }),
        queryClient.invalidateQueries({ queryKey: ['mochila'] }),
      ])
    } catch (e) {
      setErro(e.message || 'Erro ao excluir item')
    } finally {
      setExcluindoItemId(null)
    }
  }

  if (userQuery.isLoading || itensQuery.isLoading) {
    return <div className="container">Carregando catálogo de itens...</div>
  }

  const user = userQuery.data
  const itens = itensQuery.data || []

  if (!user?.mestre) {
    return (
      <div className="container">
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ marginTop: 0 }}>Acesso restrito</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Apenas usuários marcados como <strong>Mestre</strong> podem gerenciar itens.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: '1rem' }}>Catálogo de Itens</h1>

      {erro && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{erro}</p>}
      {info && <p style={{ color: 'var(--success)', marginBottom: '1rem' }}>{info}</p>}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Buscar item na PokéAPI</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          Digite parte do nome do item (em inglês). Ex.: &quot;ball&quot; para ver pokébolas e itens com &quot;ball&quot; no nome. Clique em um item para importá-lo ao catálogo.
        </p>
        <form onSubmit={handleBuscarItens} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '0.75rem' }}>
          <input
            type="text"
            className="input"
            placeholder="Ex: ball, potion, berry"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: '1', minWidth: 200 }}
          />
          <button type="submit" className="btn btn-primary" disabled={searchLoading || !searchQuery?.trim()}>
            {searchLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
        {searchErro && <p style={{ color: 'var(--danger)', marginBottom: '0.5rem' }}>{searchErro}</p>}
        {searchResults.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: 280, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
            {searchResults.map((item) => (
              <li
                key={item.pokeapiId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  borderBottom: '1px solid var(--border)',
                  cursor: importingId === item.name ? 'wait' : 'pointer',
                }}
                onClick={() => importingId !== item.name && handleImportarItem(item.name)}
              >
                <span style={{ fontWeight: 500 }}>{item.name}</span>
                {item.jaCadastrado ? (
                  <span style={{ fontSize: '0.85rem', color: 'var(--success)' }}>Já no catálogo</span>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {importingId === item.name ? 'Importando...' : 'Clique para importar'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Itens cadastrados ({itens.length})</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: '0.85rem' }}
              onClick={handleAbrirCriar}
            >
              Criar item (exclusivo)
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
              onClick={handleAtualizarImagens}
              disabled={atualizandoImagens || itens.length === 0}
            >
              {atualizandoImagens ? 'Atualizando imagens...' : 'Atualizar imagens (PokéAPI)'}
            </button>
          </div>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 0, marginBottom: '0.75rem' }}>
          Use &quot;Atualizar imagens&quot; para preencher imagens dos itens já importados que ainda não têm.
        </p>
        {itens.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum item encontrado. Use &quot;Criar item (exclusivo)&quot; ou a busca acima para importar itens da PokéAPI.</p>
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
                  <th style={{ width: 180 }}></th>
                </tr>
              </thead>
              <tbody>
                {itens.map((i) => (
                  <tr key={i.id}>
                    <td>
                      {i.imagemUrl ? (
                        <img src={i.imagemUrl} alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                      ) : (
                        <span style={{ width: 40, height: 40, display: 'inline-block', background: 'var(--border)', borderRadius: 4 }} title="Sem imagem" />
                      )}
                    </td>
                    <td>{i.nome}</td>
                    <td>{i.nomeEn || '—'}</td>
                    <td style={{ maxWidth: 400 }}>{i.descricao || '—'}</td>
                    <td>{i.peso}</td>
                    <td>{i.preco}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => handleEditar(i)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          style={{ fontSize: '0.85rem' }}
                          onClick={() => handleExcluirItem(i)}
                          disabled={excluindoItemId === i.id}
                        >
                          {excluindoItemId === i.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                      </div>
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
            <h3 style={{ marginTop: 0 }}>{creatingItem ? 'Criar item' : 'Editar item'}</h3>
            <form onSubmit={creatingItem ? handleSalvarNovoItem : handleSalvarEdicao}>
              <div className="form-group">
                <label>Imagem (URL)</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://..."
                  value={editForm.imagemUrl}
                  onChange={(e) => setEditForm((f) => ({ ...f, imagemUrl: e.target.value }))}
                />
                {editForm.imagemUrl && (
                  <img src={editForm.imagemUrl} alt="" style={{ width: 48, height: 48, objectFit: 'contain', marginTop: '0.25rem' }} onError={(e) => { e.target.style.display = 'none'; }} />
                )}
              </div>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Peso</label>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    className="input"
                    value={editForm.peso}
                    onChange={(e) => setEditForm((f) => ({ ...f, peso: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="form-group">
                  <label>Preço</label>
                  <input
                    type="number"
                    min={0}
                    className="input"
                    value={editForm.preco}
                    onChange={(e) => setEditForm((f) => ({ ...f, preco: parseInt(e.target.value, 10) || 0 }))}
                  />
                </div>
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
