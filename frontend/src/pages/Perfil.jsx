import { useState, useEffect } from 'react'
import { getMeuPerfil, salvarPerfil } from '../api'

const CLASSES = ['CIVIL', 'TREINADOR', 'COMPETIDOR', 'CACADOR', 'MEDICO', 'PESQUISADOR']

export default function Perfil() {
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
    hpAtual: 10,
    staminaMaxima: 10,
    staminaAtual: 10,
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
            hpAtual: p.hpAtual ?? 10,
            staminaMaxima: p.staminaMaxima ?? 10,
            staminaAtual: p.staminaAtual ?? 10,
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

  if (loading) return <div className="container">Carregando perfil...</div>
  if (erro && !perfil) return <div className="container"><p style={{ color: 'var(--danger)' }}>{erro}</p></div>

  return (
    <div className="container">
      <h1 style={{ marginBottom: '1rem' }}>Ficha do Jogador</h1>
      <form onSubmit={handleSubmit} className="card">
        <div className="form-group">
          <label>Nome do personagem</label>
          <input
            value={form.nomePersonagem}
            onChange={(e) => handleChange('nomePersonagem', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Classe</label>
          <select value={form.classe} onChange={(e) => handleChange('classe', e.target.value)}>
            {CLASSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="grid-2">
          <div className="form-group">
            <label>Pokedólares</label>
            <input type="number" min={0} value={form.pokedolares} onChange={(e) => handleChange('pokedolares', parseInt(e.target.value, 10) || 0)} />
          </div>
          <div className="form-group">
            <label>Nível</label>
            <input type="number" min={1} value={form.nivel} onChange={(e) => handleChange('nivel', parseInt(e.target.value, 10) || 1)} />
          </div>
          <div className="form-group">
            <label>XP atual</label>
            <input type="number" min={0} value={form.xpAtual} onChange={(e) => handleChange('xpAtual', parseInt(e.target.value, 10) || 0)} />
          </div>
          <div className="form-group">
            <label>HP máximo / atual</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="number" min={1} value={form.hpMaximo} onChange={(e) => handleChange('hpMaximo', parseInt(e.target.value, 10) || 1)} />
              <input type="number" min={0} value={form.hpAtual} onChange={(e) => handleChange('hpAtual', parseInt(e.target.value, 10) || 0)} />
            </div>
          </div>
          <div className="form-group">
            <label>Stamina máxima / atual</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="number" min={1} value={form.staminaMaxima} onChange={(e) => handleChange('staminaMaxima', parseInt(e.target.value, 10) || 1)} />
              <input type="number" min={0} value={form.staminaAtual} onChange={(e) => handleChange('staminaAtual', parseInt(e.target.value, 10) || 0)} />
            </div>
          </div>
          <div className="form-group">
            <label>Habilidade</label>
            <input type="number" min={0} value={form.habilidade} onChange={(e) => handleChange('habilidade', parseInt(e.target.value, 10) || 0)} />
          </div>
        </div>
        <h3 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Atributos</h3>
        <div className="grid-2">
          {['forca', 'speed', 'inteligencia', 'tecnica', 'sabedoria', 'percepcao', 'dominio', 'respeito'].map((attr) => (
            <div key={attr} className="form-group">
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
        {erro && <p style={{ color: 'var(--danger)', marginTop: '1rem' }}>{erro}</p>}
        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar ficha'}
        </button>
      </form>
      {perfil?.timePrincipal?.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>Time principal</h3>
          <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
            {perfil.timePrincipal.map((p) => (
              <li key={p.id}>{p.apelido || p.especie} (Nv. {p.nivel})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
