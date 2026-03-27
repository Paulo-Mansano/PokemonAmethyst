import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getMeuPerfil, salvarPerfil } from '../api'
import { usePlayerTarget } from '../context/PlayerTargetContext'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../query/queryKeys'

const CLASSES = ['CIVIL', 'TREINADOR', 'COMPETIDOR', 'CACADOR', 'MEDICO', 'PESQUISADOR']
const SEM_PERFIL_SESSION_KEY = 'pokemonamethyst:login-sem-perfil'

export default function Perfil() {
  const location = useLocation()
  const { playerId, readyForPlayerApi } = usePlayerTarget()
  const queryClient = useQueryClient()
  const [perfil, setPerfil] = useState(null)
  const [erro, setErro] = useState('')
  const [form, setForm] = useState({
    nomePersonagem: '',
    classe: 'TREINADOR',
    pokedolares: 0,
    nivel: 1,
    xpAtual: 0,
    hpMaximo: 10,
    staminaMaxima: 10,
    habilidade: 1,
    atributos: { forca: 1, speed: 1, inteligencia: 1, tecnica: 1, sabedoria: 1, percepcao: 1, dominio: 1, respeito: 1 },
  })

  const perfilQuery = useQuery({
    queryKey: queryKeys.perfil(playerId),
    queryFn: () => getMeuPerfil(playerId),
    enabled: readyForPlayerApi,
    staleTime: 60 * 1000,
  })

  useEffect(() => {
    if (!readyForPlayerApi) return
    if (perfilQuery.isError) {
      setErro('Erro ao carregar perfil')
      return
    }
    const p = perfilQuery.data ?? null
    setPerfil(p)
    if (!p) return
    setForm({
      nomePersonagem: p.nomePersonagem ?? '',
      classe: p.classe ?? 'TREINADOR',
      pokedolares: p.pokedolares ?? 0,
      nivel: p.nivel ?? 1,
      xpAtual: p.xpAtual ?? 0,
      hpMaximo: p.hpMaximo ?? 10,
      staminaMaxima: p.staminaMaxima ?? 10,
      habilidade: Math.max(1, p.habilidade ?? 1),
      atributos: {
        forca: Math.max(1, p.atributos?.forca ?? 1),
        speed: Math.max(1, p.atributos?.speed ?? 1),
        inteligencia: Math.max(1, p.atributos?.inteligencia ?? 1),
        tecnica: Math.max(1, p.atributos?.tecnica ?? 1),
        sabedoria: Math.max(1, p.atributos?.sabedoria ?? 1),
        percepcao: Math.max(1, p.atributos?.percepcao ?? 1),
        dominio: Math.max(1, p.atributos?.dominio ?? 1),
        respeito: Math.max(1, p.atributos?.respeito ?? 1),
      },
    })
  }, [readyForPlayerApi, perfilQuery.data, perfilQuery.isError])

  useEffect(() => {
    if (!perfil) return
    try {
      sessionStorage.removeItem(SEM_PERFIL_SESSION_KEY)
    } catch {
      /* ignore */
    }
  }, [perfil])

  const salvarPerfilMutation = useMutation({
    mutationFn: (payload) => salvarPerfil(payload, playerId),
    onSuccess: (saved) => {
      setPerfil(saved)
      queryClient.setQueryData(queryKeys.perfil(playerId), saved)
      queryClient.invalidateQueries({ queryKey: queryKeys.perfil(playerId) })
    },
    onError: (err) => setErro(err?.message || 'Erro ao salvar perfil'),
  })

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleAtributo = (attr, value) => {
    const n = parseInt(value, 10)
    setForm((f) => ({
      ...f,
      // Garantimos que nenhum atributo seja salvo como 0.
      atributos: { ...f.atributos, [attr]: Number.isFinite(n) ? Math.max(1, n) : 1 },
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    await salvarPerfilMutation.mutateAsync(form)
  }

  if (!readyForPlayerApi || perfilQuery.isLoading) return <div className="container container--wide">Carregando perfil...</div>
  if (erro && !perfil) return <div className="container container--wide"><p style={{ color: 'var(--danger)' }}>{erro}</p></div>

  const avisoSemPerfil =
    !perfil &&
    (location.state?.semPerfil ||
      (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SEM_PERFIL_SESSION_KEY) === '1'))
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
              <input type="number" min={1} value={form.habilidade} onChange={(e) => handleChange('habilidade', Math.max(1, parseInt(e.target.value, 10) || 1))} />
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
                  min={1}
                  value={form.atributos[attr] ?? 1}
                  onChange={(e) => handleAtributo(attr, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {erro && <p className="perfil-erro">{erro}</p>}
        <div className="perfil-actions">
          <button type="submit" className="btn btn-primary" disabled={salvarPerfilMutation.isPending}>
            {salvarPerfilMutation.isPending ? 'Salvando...' : 'Salvar ficha'}
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
