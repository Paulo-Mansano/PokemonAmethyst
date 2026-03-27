import { useState, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login, registro, getMeuPerfil, getMestreJogadores } from '../api'

const TAB_KEY = 'pokemonamethyst:login-tab'
const SEM_PERFIL_KEY = 'pokemonamethyst:login-sem-perfil'
const LEMBRAR_PREF_KEY = 'pokemonamethyst:pref-lembrar'

function isSafeRedirectPath(pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith('/') || pathname.startsWith('//')) return false
  return true
}

/** Destino após login: `state.from` (rota protegida) ou query `?redirect=` (caminho interno). */
function resolvePostLoginPath(location) {
  const from = location.state?.from
  if (from && isSafeRedirectPath(from.pathname)) {
    return `${from.pathname}${from.search || ''}${from.hash || ''}`
  }
  const raw = new URLSearchParams(location.search).get('redirect')
  if (raw) {
    const path = raw.trim().startsWith('/') ? raw.trim() : `/${raw.trim()}`
    const pathnameOnly = path.split('?')[0]
    if (isSafeRedirectPath(pathnameOnly)) return path
  }
  return '/'
}

function inferirCampoErro(mensagem) {
  const m = (mensagem || '').toLowerCase()
  if (m.includes('inválidos')) return 'senha'
  if (m.includes('senha')) return 'senha'
  if (m.includes('usuário') || m.includes('cadastrado')) return 'usuario'
  return 'usuario'
}

function IconeOlhoAberto() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconeOlhoFechado() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export default function Login({ onLogin }) {
  const navigate = useNavigate()
  const location = useLocation()
  const refUsuario = useRef(null)
  const refSenha = useRef(null)

  const [tab, setTab] = useState(() => {
    try {
      const s = sessionStorage.getItem(TAB_KEY)
      if (s === 'registro' || s === 'login') return s
    } catch {
      /* ignore */
    }
    return 'login'
  })

  const setTabPersist = (next) => {
    setTab(next)
    try {
      sessionStorage.setItem(TAB_KEY, next)
    } catch {
      /* ignore */
    }
  }

  const [nomeUsuario, setNomeUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [mestre, setMestre] = useState(false)
  const [lembrar, setLembrar] = useState(() => {
    try {
      return localStorage.getItem(LEMBRAR_PREF_KEY) === '1'
    } catch {
      return false
    }
  })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nome = nomeUsuario.trim()
    if (nome !== nomeUsuario) setNomeUsuario(nome)
    setErro('')
    setLoading(true)
    try {
      if (tab === 'registro') {
        await registro(nome, senha, mestre)
      }
      const user = await login(nome, senha, lembrar)
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
      const destino = resolvePostLoginPath(location)
      try {
        if (!perfil) sessionStorage.setItem(SEM_PERFIL_KEY, '1')
        else sessionStorage.removeItem(SEM_PERFIL_KEY)
      } catch {
        /* ignore */
      }
      const pathname = destino.split('?')[0] || '/'
      const state =
        !perfil && (pathname === '/' || pathname === '')
          ? { semPerfil: true }
          : undefined
      navigate(destino, { state, replace: true })
    } catch (err) {
      const msg = err.message || 'Erro ao processar'
      setErro(msg)
      const campo = inferirCampoErro(msg)
      setTimeout(() => {
        (campo === 'senha' ? refSenha : refUsuario).current?.focus()
      }, 0)
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
            onClick={() => { setTabPersist('login'); setErro(''); }}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`btn ${tab === 'registro' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => { setTabPersist('registro'); setErro(''); }}
          >
            Registrar
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-usuario">Nome de usuário</label>
            <input
              ref={refUsuario}
              id="login-usuario"
              type="text"
              value={nomeUsuario}
              onChange={(e) => { setNomeUsuario(e.target.value); if (erro) setErro(''); }}
              required
              minLength={2}
              maxLength={50}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <div className="form-group">
            <label htmlFor="login-senha">Senha</label>
            <div className="password-input-wrap">
              <input
                ref={refSenha}
                id="login-senha"
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => { setSenha(e.target.value); if (erro) setErro(''); }}
                required
                minLength={6}
                autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                aria-pressed={mostrarSenha}
              >
                {mostrarSenha ? <IconeOlhoFechado /> : <IconeOlhoAberto />}
              </button>
            </div>
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
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="lembrar"
              checked={lembrar}
              onChange={(e) => {
                const v = e.target.checked
                setLembrar(v)
                try {
                  localStorage.setItem(LEMBRAR_PREF_KEY, v ? '1' : '0')
                } catch {
                  /* ignore */
                }
              }}
            />
            <label htmlFor="lembrar" style={{ marginBottom: 0 }}>Lembrar de mim neste dispositivo</label>
          </div>
          {erro && (
            <p role="alert" style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {erro}
            </p>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Aguarde...' : tab === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
