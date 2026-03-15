import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMeuPerfil, criarPokemonVazio, getPokemon, atualizarPokemon, colocarNoTime, removerDoTime, excluirPokemon, getPokeApiList, getPokeApiPokemon, getMovimentos } from '../api'

const PAGE_SIZE = 20
function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

const TIPOS = ['NORMAL', 'FOGO', 'AGUA', 'ELETRICO', 'GRAMA', 'GELO', 'LUTADOR', 'VENENOSO', 'TERRA', 'VOADOR', 'PSIQUICO', 'INSETO', 'PEDRA', 'FANTASMA', 'DRAGAO', 'SOMBRIO', 'METAL', 'FADA']
const POKEBOLAS = ['POKEBALL', 'GREATBALL', 'ULTRABALL', 'MASTERBALL', 'SAFARIBALL', 'LUXURYBALL', 'FRIENDLYBALL', 'OUTRA']

export default function PokemonList() {
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modal, setModal] = useState(null)
  const [editingPokemonId, setEditingPokemonId] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [form, setForm] = useState({
    pokedexId: 1,
    especie: '',
    tipoPrimario: 'NORMAL',
    tipoSecundario: '',
    apelido: '',
    imagemUrl: '',
    genero: 'SEM_GENERO',
    pokebolaCaptura: 'POKEBALL',
    hpMaximo: 20,
    staminaMaxima: 10,
    movimentoIds: [],
  })
  const [listaMovimentos, setListaMovimentos] = useState([])
  const [catalogoLista, setCatalogoLista] = useState([])
  const [catalogoLoading, setCatalogoLoading] = useState(false)
  const [catalogoOffset, setCatalogoOffset] = useState(0)
  const [catalogoErro, setCatalogoErro] = useState('')
  const [catalogoBusca, setCatalogoBusca] = useState('')
  const [savingPokemon, setSavingPokemon] = useState(false)

  const load = () => {
    getMeuPerfil()
      .then(setPerfil)
      .catch(() => setErro('Erro ao carregar'))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

  useEffect(() => {
    if (modal === 'editar') carregarMovimentos()
  }, [modal])

  const setFormFromPokemon = (p) => {
    if (!p) return
    setForm({
      pokedexId: p.pokedexId ?? 0,
      especie: p.especie ?? '',
      tipoPrimario: p.tipoPrimario ?? 'NORMAL',
      tipoSecundario: p.tipoSecundario || '',
      apelido: p.apelido || '',
      imagemUrl: p.imagemUrl || '',
      genero: p.genero || 'SEM_GENERO',
      pokebolaCaptura: p.pokebolaCaptura || 'POKEBALL',
      hpMaximo: p.hpMaximo ?? 20,
      staminaMaxima: p.staminaMaxima ?? 10,
      movimentoIds: (p.movimentosConhecidos || []).map((m) => m.id),
    })
  }

  const handleColocarNoTime = async (id, ordem) => {
    try {
      await colocarNoTime(id, ordem)
      load()
    } catch (err) {
      setErro(err.message)
    }
  }

  const handleRemoverDoTime = async (id) => {
    try {
      await removerDoTime(id)
      load()
    } catch (err) {
      setErro(err.message)
    }
  }

  const handleExcluir = async (id) => {
    if (!window.confirm('Excluir este Pokémon?')) return
    try {
      await excluirPokemon(id)
      load()
      setModal(null)
    } catch (err) {
      setErro(err.message)
    }
  }

  const loadCatalogo = (offset = 0, busca = '') => {
    setCatalogoErro('')
    setCatalogoLoading(true)
    const trimmed = (busca || catalogoBusca || '').trim()
    const isNum = /^\d+$/.test(trimmed)
    const nome = !isNum && trimmed ? trimmed : ''
    const pokedexId = isNum && trimmed ? parseInt(trimmed, 10) : null
    getPokeApiList(PAGE_SIZE, offset, nome, pokedexId)
      .then(setCatalogoLista)
      .catch((err) => setCatalogoErro(err.message || 'Erro ao carregar catálogo'))
      .finally(() => setCatalogoLoading(false))
  }

  const handleAbrirCatalogo = () => {
    setModal('catalogo')
    setCatalogoOffset(0)
    setCatalogoBusca('')
    loadCatalogo(0, '')
  }

  const handleNovoPokemon = async () => {
    setErro('')
    try {
      const p = await criarPokemonVazio()
      load()
      setEditingPokemonId(p.id)
      setFormLoading(true)
      getPokemon(p.id)
        .then((full) => {
          setFormFromPokemon(full)
          setModal('editar')
        })
        .catch((err) => setErro(err.message))
        .finally(() => setFormLoading(false))
    } catch (err) {
      setErro(err.message)
    }
  }

  const handleEditar = (id) => {
    setEditingPokemonId(id)
    setFormLoading(true)
    setErro('')
    getPokemon(id)
      .then((full) => {
        setFormFromPokemon(full)
        setModal('editar')
      })
      .catch((err) => setErro(err.message))
      .finally(() => setFormLoading(false))
  }

  const handleBuscarCatalogo = () => {
    setCatalogoOffset(0)
    loadCatalogo(0, catalogoBusca)
  }

  const handleSelecionarDaApi = async (id) => {
    setCatalogoErro('')
    try {
      const detail = await getPokeApiPokemon(id)
      setForm((f) => ({
        ...f,
        pokedexId: detail.id,
        especie: capitalize(detail.name),
        tipoPrimario: detail.tipoPrimario || 'NORMAL',
        tipoSecundario: detail.tipoSecundario || '',
        imagemUrl: detail.imageUrl || '',
      }))
      setModal('editar')
    } catch (err) {
      setCatalogoErro(err.message)
    }
  }

  const carregarMovimentos = () => {
    getMovimentos().then(setListaMovimentos).catch(() => setListaMovimentos([]))
  }

  const toggleMovimento = (id) => {
    setForm((f) => {
      const ids = f.movimentoIds || []
      const idx = ids.indexOf(id)
      if (idx >= 0) return { ...f, movimentoIds: ids.filter((x) => x !== id) }
      if (ids.length >= 8) return f
      return { ...f, movimentoIds: [...ids, id] }
    })
  }

  const handleSalvarEdicao = async (e) => {
    e.preventDefault()
    if (!editingPokemonId) return
    setErro('')
    setSavingPokemon(true)
    try {
      await atualizarPokemon(editingPokemonId, {
        especie: form.especie || undefined,
        tipoPrimario: form.tipoPrimario || undefined,
        tipoSecundario: form.tipoSecundario || null,
        pokedexId: form.pokedexId ?? 0,
        apelido: form.apelido || null,
        imagemUrl: form.imagemUrl || null,
        movimentoIds: form.movimentoIds?.length ? form.movimentoIds : [],
      })
      await load()
      setModal(null)
      setEditingPokemonId(null)
    } catch (err) {
      setErro(err.message)
    } finally {
      setSavingPokemon(false)
    }
  }

  const timePrincipal = perfil?.timePrincipal ?? []
  const naBox = perfil?.box ?? []

  if (loading) return <div className="container">Carregando...</div>

  if (!perfil) {
    return (
      <div className="container">
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
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Pokémon</h1>
        <button type="button" className="btn btn-primary" onClick={handleNovoPokemon} disabled={formLoading}>
          {formLoading ? 'Criando...' : 'Novo Pokémon'}
        </button>
      </div>
      {erro && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{erro}</p>}

      <div className="card">
        <h3>Time principal (máx. 6)</h3>
        {timePrincipal.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum Pokémon no time. Coloque da box abaixo.</p>
        ) : (
          <div className="pokemon-cards">
            {timePrincipal.map((p) => (
              <div key={p.id} className="pokemon-card">
                <div className="pokemon-card-image">
                  {p.imagemUrl ? (
                    <img src={p.imagemUrl} alt={p.especie || 'Pokémon'} />
                  ) : (
                    <span className="pokemon-card-placeholder">?</span>
                  )}
                </div>
                <div className="pokemon-card-info">
                  <div className="pokemon-card-header">
                    <strong>{p.especie || '???'}</strong>
                    <span className="pokemon-card-pokedex">#{p.pokedexId}</span>
                  </div>
                  <p className="pokemon-card-apelido">{p.apelido || p.especie || '???'}</p>
                  <p className="pokemon-card-nivel">Nv. {p.nivel}</p>
                  <div className="pokemon-card-actions">
                    <button type="button" className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => handleEditar(p.id)}>Editar</button>
                    <button type="button" className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => handleRemoverDoTime(p.id)}>
                      Enviar para box
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Box</h3>
        {naBox.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum Pokémon na box.</p>
        ) : (
          <div className="pokemon-cards pokemon-cards-box">
            {naBox.map((p) => (
              <div key={p.id} className="pokemon-card">
                <div className="pokemon-card-image">
                  {p.imagemUrl ? (
                    <img src={p.imagemUrl} alt={p.especie || 'Pokémon'} />
                  ) : (
                    <span className="pokemon-card-placeholder">?</span>
                  )}
                </div>
                <div className="pokemon-card-info">
                  <div className="pokemon-card-header">
                    <strong>{p.especie || '???'}</strong>
                    <span className="pokemon-card-pokedex">#{p.pokedexId}</span>
                  </div>
                  <p className="pokemon-card-apelido">{p.apelido || p.especie || '???'}</p>
                  <p className="pokemon-card-nivel">Nv. {p.nivel}</p>
                  <div className="pokemon-card-actions">
                    <button type="button" className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => handleEditar(p.id)}>Editar</button>
                    {timePrincipal.length < 6 && (
                      <button type="button" className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => handleColocarNoTime(p.id, timePrincipal.length + 1)}>
                        Colocar no time
                      </button>
                    )}
                    <button type="button" className="btn btn-danger" style={{ fontSize: '0.85rem' }} onClick={() => handleExcluir(p.id)}>
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal === 'catalogo' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: 560, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Catálogo PokéAPI</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>Busque por nome ou número da Pokédex. Clique em um para preencher o formulário de edição.</p>
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
                <button type="button" className="btn btn-secondary" onClick={() => loadCatalogo(0, '')} disabled={catalogoLoading}>
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
                        onClick={() => handleSelecionarDaApi(p.id)}
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
                        }}
                      >
                        <span style={{ minWidth: 28, color: 'var(--text-muted)', fontSize: '0.85rem' }}>#{p.id}</span>
                        <img src={p.imageUrl} alt={p.name} style={{ width: 48, height: 48, objectFit: 'contain' }} />
                        <span>{capitalize(p.name)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {catalogoLista.length === 0 && !catalogoLoading && <p style={{ color: 'var(--text-muted)' }}>Nenhum resultado. Use a busca ou liste todos.</p>}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" disabled={catalogoOffset === 0} onClick={() => { const o = Math.max(0, catalogoOffset - PAGE_SIZE); setCatalogoOffset(o); loadCatalogo(o, catalogoBusca); }}>
                    Anterior
                  </button>
                  <button type="button" className="btn btn-secondary" disabled={catalogoLista.length < PAGE_SIZE} onClick={() => { const o = catalogoOffset + PAGE_SIZE; setCatalogoOffset(o); loadCatalogo(o, catalogoBusca); }}>
                    Próxima
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => { setModal(editingPokemonId ? 'editar' : null); setCatalogoErro(''); }}>
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {modal === 'editar' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: 420, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>Editar Pokémon</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={handleAbrirCatalogo}>
                Buscar na PokéAPI
              </button>
            </div>
            <form onSubmit={handleSalvarEdicao}>
              <div className="form-group">
                <label>Pokedex ID (0 = custom)</label>
                <input type="number" min={0} value={form.pokedexId} onChange={(e) => setForm((f) => ({ ...f, pokedexId: parseInt(e.target.value, 10) || 0 }))} />
              </div>
              <div className="form-group">
                <label>Espécie *</label>
                <input value={form.especie} onChange={(e) => setForm((f) => ({ ...f, especie: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label>Tipo primário</label>
                <select value={form.tipoPrimario} onChange={(e) => setForm((f) => ({ ...f, tipoPrimario: e.target.value }))}>
                  {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo secundário (opcional)</label>
                <select value={form.tipoSecundario} onChange={(e) => setForm((f) => ({ ...f, tipoSecundario: e.target.value }))}>
                  <option value="">—</option>
                  {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Apelido</label>
                <input value={form.apelido} onChange={(e) => setForm((f) => ({ ...f, apelido: e.target.value }))} />
              </div>
              {form.imagemUrl && (
                <div className="form-group">
                  <label>Imagem</label>
                  <img src={form.imagemUrl} alt={form.especie} style={{ width: 96, height: 96, objectFit: 'contain', display: 'block' }} />
                </div>
              )}
              <div className="form-group">
                <label>Gênero</label>
                <select value={form.genero} onChange={(e) => setForm((f) => ({ ...f, genero: e.target.value }))}>
                  <option value="MACHO">Macho</option>
                  <option value="FEMEA">Fêmea</option>
                  <option value="SEM_GENERO">Sem gênero</option>
                </select>
              </div>
              <div className="form-group">
                <label>Pokébola de captura</label>
                <select value={form.pokebolaCaptura} onChange={(e) => setForm((f) => ({ ...f, pokebolaCaptura: e.target.value }))}>
                  {POKEBOLAS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>HP máximo</label>
                  <input type="number" min={1} value={form.hpMaximo} onChange={(e) => setForm((f) => ({ ...f, hpMaximo: parseInt(e.target.value, 10) || 20 }))} />
                </div>
                <div className="form-group">
                  <label>Stamina máxima</label>
                  <input type="number" min={1} value={form.staminaMaxima} onChange={(e) => setForm((f) => ({ ...f, staminaMaxima: parseInt(e.target.value, 10) || 10 }))} />
                </div>
              </div>
              <div className="form-group">
                <label>Ataques (máx. 8)</label>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{(form.movimentoIds || []).length}/8 selecionados</p>
                <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, padding: '0.5rem' }}>
                  {listaMovimentos.length === 0 && <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Carregando...</span>}
                  {listaMovimentos.map((m) => (
                    <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: '0.25rem' }}>
                      <input
                        type="checkbox"
                        checked={(form.movimentoIds || []).includes(m.id)}
                        onChange={() => toggleMovimento(m.id)}
                        disabled={(form.movimentoIds || []).length >= 8 && !(form.movimentoIds || []).includes(m.id)}
                      />
                      <span style={{ fontSize: '0.9rem' }}>{m.nome} ({m.tipo})</span>
                    </label>
                  ))}
                </div>
              </div>
              {erro && <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{erro}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={savingPokemon}>
                  {savingPokemon ? 'Salvando...' : 'Salvar'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => { setModal(null); setEditingPokemonId(null); setErro(''); }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
