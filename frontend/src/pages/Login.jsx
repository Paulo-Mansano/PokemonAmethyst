import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, registro, getMeuPerfil, getMestreJogadores } from '../api'

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [mestre, setMestre] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      if (tab === 'registro') {
        await registro(nomeUsuario, senha, mestre)
      }
      const user = await login(nomeUsuario, senha)
      onLogin(user)
      let perfil = null
      if (user.mestre) {
        const jogadores = await getMestreJogadores()
        if (jogadores.length) {
          perfil = await getMeuPerfil(jogadores[0].id)
        }
      } else {
        perfil = await getMeuPerfil()
      }
      navigate('/', { state: perfil ? undefined : { semPerfil: true } })
    } catch (err) {
      setErro(err.message || 'Erro ao processar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: '4rem' }}>
      <div className="card">
        <h1 style={{ marginTop: 0, marginBottom: '1.5rem', fontSize: '1.75rem' }}>Pokémon Amethyst</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>RPG de Mesa - Fichas e Jogadores</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <button
            type="button"
            className={`btn ${tab === 'login' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => { setTab('login'); setErro(''); }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`btn ${tab === 'registro' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => { setTab('registro'); setErro(''); }}
          >
            Registrar
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome de usuário</label>
            <input
              type="text"
              value={nomeUsuario}
              onChange={(e) => setNomeUsuario(e.target.value)}
              required
              minLength={2}
              maxLength={50}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
          </div>
          {tab === 'registro' && (
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="mestre"
                checked={mestre}
                onChange={(e) => setMestre(e.target.checked)}
              />
              <label htmlFor="mestre" style={{ marginBottom: 0 }}>Conta de Mestre</label>
            </div>
          )}
          {erro && <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.9rem' }}>{erro}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
