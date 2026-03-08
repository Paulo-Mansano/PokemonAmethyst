import { useState, useEffect } from 'react'
import { getMeuPerfil, criarPokemon, colocarNoTime, removerDoTime, excluirPokemon, getPokeApiList, getPokeApiPokemon } from '../api'

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
  })
  const [catalogoLista, setCatalogoLista] = useState([])
  const [catalogoLoading, setCatalogoLoading] = useState(false)
  const [catalogoOffset, setCatalogoOffset] = useState(0)
  const [catalogoErro, setCatalogoErro] = useState('')

  const load = () => {
    getMeuPerfil()
      .then(setPerfil)
      .catch(() => setErro('Erro ao carregar'))
      .finally(() => setLoading(false))
  }

  useEffect(() => load(), [])

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

  const loadCatalogo = (offset = 0) => {
    setCatalogoErro('')
    setCatalogoLoading(true)
    getPokeApiList(PAGE_SIZE, offset)
      .then(setCatalogoLista)
      .catch((err) => setCatalogoErro(err.message || 'Erro ao carregar catálogo'))
      .finally(() => setCatalogoLoading(false))
  }

  const handleAbrirCatalogo = () => {
    setModal('catalogo')
    setCatalogoOffset(0)
    loadCatalogo(0)
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
      setModal('novo')
    } catch (err) {
      setCatalogoErro(err.message)
    }
  }

  const handleCriar = async (e) => {
    e.preventDefault()
    setErro('')
    try {
      await criarPokemon({
        ...form,
        tipoSecundario: form.tipoSecundario || null,
        imagemUrl: form.imagemUrl || null,
      })
      load()
      setModal(null)
      setForm({ pokedexId: 1, especie: '', tipoPrimario: 'NORMAL', tipoSecundario: '', apelido: '', imagemUrl: '', genero: 'SEM_GENERO', pokebolaCaptura: 'POKEBALL', hpMaximo: 20, staminaMaxima: 10 })
    } catch (err) {
      setErro(err.message)
    }
  }

  const timePrincipal = perfil?.timePrincipal ?? []
  const naBox = perfil?.box ?? []

  if (loading) return <div className="container">Carregando...</div>

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ margin: 0 }}>Pokémon</h1>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={() => setModal('novo')}>
            Novo Pokémon
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleAbrirCatalogo}>
            Buscar na PokéAPI
          </button>
        </div>
      </div>
      {erro && <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{erro}</p>}

      <div className="card">
        <h3>Time principal (máx. 6)</h3>
        {timePrincipal.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum Pokémon no time. Coloque da box abaixo.</p>
        ) : (
          <div className="grid-2">
            {timePrincipal.map((p) => (
              <div key={p.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '1rem' }}>
                <strong>{p.apelido || p.especie}</strong> — Nv. {p.nivel} ({p.tipoPrimario}{p.tipoSecundario ? ` / ${p.tipoSecundario}` : ''})
                <div style={{ marginTop: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => handleRemoverDoTime(p.id)}>
                    Enviar para box
                  </button>
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
          <div className="grid-2">
            {naBox.map((p) => (
              <div key={p.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '1rem' }}>
                <strong>{p.apelido || p.especie}</strong> — Nv. {p.nivel}
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {timePrincipal.length < 6 && (
                    <button type="button" className="btn btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => handleColocarNoTime(p.id, timePrincipal.length + 1)}>
                      Colocar no time
                    </button>
                  )}
                  <button type="button" className="btn btn-danger" style={{ fontSize: '0.85rem' }} onClick={() => handleExcluir(p.id)}>
                    Excluir
                  </button>
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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Clique em um Pokémon para preencher o formulário de novo Pokémon.</p>
            {catalogoErro && <p style={{ color: 'var(--danger)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{catalogoErro}</p>}
            {catalogoLoading ? (
              <p>Carregando...</p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                  {catalogoLista.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => handleSelecionarDaApi(p.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '0.5rem',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        background: 'var(--bg)',
                        cursor: 'pointer',
                      }}
                    >
                      <img src={p.imageUrl} alt={p.name} style={{ width: 64, height: 64, objectFit: 'contain' }} />
                      <span style={{ fontSize: '0.75rem', marginTop: '0.25rem', textAlign: 'center' }}>{capitalize(p.name)}</span>
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-secondary" disabled={catalogoOffset === 0} onClick={() => { const o = Math.max(0, catalogoOffset - PAGE_SIZE); setCatalogoOffset(o); loadCatalogo(o); }}>
                    Anterior
                  </button>
                  <button type="button" className="btn btn-secondary" disabled={catalogoLista.length < PAGE_SIZE} onClick={() => { const o = catalogoOffset + PAGE_SIZE; setCatalogoOffset(o); loadCatalogo(o); }}>
                    Próxima
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => { setModal(null); setCatalogoErro(''); }}>
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {modal === 'novo' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: '1rem' }}>
          <div className="card" style={{ maxWidth: 420, width: '100%' }}>
            <h3 style={{ marginTop: 0 }}>Novo Pokémon</h3>
            <form onSubmit={handleCriar}>
              <div className="form-group">
                <label>Pokedex ID</label>
                <input type="number" min={1} value={form.pokedexId} onChange={(e) => setForm((f) => ({ ...f, pokedexId: parseInt(e.target.value, 10) || 1 }))} />
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
              {erro && <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{erro}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">Criar</button>
                <button type="button" className="btn btn-secondary" onClick={() => { setModal(null); setErro(''); }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
