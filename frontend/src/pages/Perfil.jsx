import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getMeuPerfil, salvarPerfil } from '../api'

const CLASSES = ['CIVIL', 'TREINADOR', 'COMPETIDOR', 'CACADOR', 'MEDICO', 'PESQUISADOR']

export default function Perfil() {
  const location = useLocation()
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nomePersonagem: '',
    classe: 'TREINADOR',
    pokedolares: 0,
    nivel: 1,
    xpAtual: 0,
    hpMaximo: 10,
    staminaMaxima: 10,
    habilidade: 0,
    atributos: { forca: 0, speed: 0, inteligencia: 0, tecnica: 0, sabedoria: 0, percepcao: 0, dominio: 0, respeito: 0 },
  })

  useEffect(() => {
    getMeuPerfil()
      .then((p) => {
        setPerfil(p)
        if (p) {
          setForm({
            nomePersonagem: p.nomePersonagem ?? '',
            classe: p.classe ?? 'TREINADOR',
            pokedolares: p.pokedolares ?? 0,
            nivel: p.nivel ?? 1,
            xpAtual: p.xpAtual ?? 0,
            hpMaximo: p.hpMaximo ?? 10,
            staminaMaxima: p.staminaMaxima ?? 10,
            habilidade: p.habilidade ?? 0,
            atributos: p.atributos ?? { forca: 0, speed: 0, inteligencia: 0, tecnica: 0, sabedoria: 0, percepcao: 0, dominio: 0, respeito: 0 },
          })
        }
      })
      .catch(() => setErro('Erro ao carregar perfil'))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleAtributo = (attr, value) => {
    setForm((f) => ({
      ...f,
      atributos: { ...f.atributos, [attr]: parseInt(value, 10) || 0 },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setSaving(true)
    try {
      const saved = await salvarPerfil(form)
      setPerfil(saved)
    } catch (err) {
      setErro(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="container container--wide">Carregando perfil...</div>
  if (erro && !perfil) return <div className="container container--wide"><p style={{ color: 'var(--danger)' }}>{erro}</p></div>

  const avisoSemPerfil = location.state?.semPerfil && !perfil
  const ATRIBUTOS = ['forca', 'speed', 'inteligencia', 'tecnica', 'sabedoria', 'percepcao', 'dominio', 'respeito']

  return (
    <div className="container container--wide perfil-page">
      <h1 className="perfil-page-title">Ficha do Jogador</h1>
      {avisoSemPerfil && (
        <p className="perfil-aviso">
          Crie sua ficha para acessar Pokémon e Mochila.
        </p>
      )}
      <form onSubmit={handleSubmit} className="card perfil-card">
        <div className="perfil-grid perfil-grid--identity">
          <div className="form-group perfil-field perfil-field--nome">
            <label>Nome do personagem</label>
            <input
              value={form.nomePersonagem}
              onChange={(e) => handleChange('nomePersonagem', e.target.value)}
              required
            />
          </div>
          <div className="form-group perfil-field perfil-field--classe">
            <label>Classe</label>
            <select value={form.classe} onChange={(e) => handleChange('classe', e.target.value)}>
              {CLASSES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="perfil-section">
          <h3 className="perfil-section-title">Recursos</h3>
          <div className="perfil-grid perfil-grid--stats">
            <div className="form-group perfil-field">
              <label>Pokedólares</label>
              <input type="number" min={0} value={form.pokedolares} onChange={(e) => handleChange('pokedolares', parseInt(e.target.value, 10) || 0)} />
            </div>
            <div className="form-group perfil-field">
              <label>Nível</label>
              <input type="number" min={1} value={form.nivel} onChange={(e) => handleChange('nivel', parseInt(e.target.value, 10) || 1)} />
            </div>
            <div className="form-group perfil-field">
              <label>XP atual</label>
              <input type="number" min={0} value={form.xpAtual} onChange={(e) => handleChange('xpAtual', parseInt(e.target.value, 10) || 0)} />
            </div>
            <div className="form-group perfil-field">
              <label>HP</label>
              <input type="number" min={1} value={form.hpMaximo} onChange={(e) => handleChange('hpMaximo', parseInt(e.target.value, 10) || 1)} />
            </div>
            <div className="form-group perfil-field">
              <label>Stamina</label>
              <input type="number" min={1} value={form.staminaMaxima} onChange={(e) => handleChange('staminaMaxima', parseInt(e.target.value, 10) || 1)} />
            </div>
            <div className="form-group perfil-field">
              <label>Habilidade</label>
              <input type="number" min={0} value={form.habilidade} onChange={(e) => handleChange('habilidade', parseInt(e.target.value, 10) || 0)} />
            </div>
          </div>
        </div>

        <div className="perfil-section">
          <h3 className="perfil-section-title">Atributos</h3>
          <div className="perfil-grid perfil-grid--atributos">
            {ATRIBUTOS.map((attr) => (
              <div key={attr} className="form-group perfil-field">
                <label>{attr}</label>
                <input
                  type="number"
                  min={0}
                  value={form.atributos[attr] ?? 0}
                  onChange={(e) => handleAtributo(attr, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {erro && <p className="perfil-erro">{erro}</p>}
        <div className="perfil-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar ficha'}
          </button>
        </div>
      </form>

      {perfil?.timePrincipal?.length > 0 && (
        <div className="card perfil-time-card">
          <h3 className="perfil-section-title">Time principal</h3>
          <ul className="perfil-time-list">
            {perfil.timePrincipal.map((p) => (
              <li key={p.id}>{p.apelido || p.especie} (Nv. {p.nivel})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
