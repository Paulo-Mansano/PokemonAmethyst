import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { criarContaMestre, getUsuario } from '../api'
import { queryKeys } from '../query/queryKeys'

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

export default function ContasMestre() {
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [salvando, setSalvando] = useState(false)

  const usuarioQuery = useQuery({
    queryKey: queryKeys.auth.usuario,
    queryFn: getUsuario,
    staleTime: 10 * 60 * 1000,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nome = nomeUsuario.trim()
    setErro('')
    setSucesso('')

    if (!nome) {
      setErro('Nome de usuário é obrigatório.')
      return
    }
    if (!senha || senha.length < 6) {
      setErro('Senha deve ter pelo menos 6 caracteres.')
      return
    }

    setSalvando(true)
    try {
      const novo = await criarContaMestre(nome, senha)
      setSucesso(`Conta mestre criada com sucesso: ${novo?.nomeUsuario || nome}`)
      setNomeUsuario('')
      setSenha('')
      setMostrarSenha(false)
    } catch (e) {
      setErro(e.message || 'Erro ao criar conta mestre')
    } finally {
      setSalvando(false)
    }
  }

  if (usuarioQuery.isLoading) {
    return <div className="container">Carregando...</div>
  }

  if (!usuarioQuery.data?.mestre) {
    return (
      <div className="container">
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ marginTop: 0 }}>Acesso restrito</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Apenas usuários marcados como <strong>Mestre</strong> podem criar outras contas mestre.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <h1 style={{ marginBottom: '1rem' }}>Criar Conta Mestre</h1>
      <div className="card">
        <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
          Esta aba cria contas diretamente com permissão de mestre.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="mestre-usuario">Nome de usuário</label>
            <input
              id="mestre-usuario"
              type="text"
              value={nomeUsuario}
              onChange={(e) => setNomeUsuario(e.target.value)}
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
            <label htmlFor="mestre-senha">Senha</label>
            <div className="password-input-wrap">
              <input
                id="mestre-senha"
                type={mostrarSenha ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
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

          {erro && <p style={{ color: 'var(--danger)', marginBottom: '0.75rem' }}>{erro}</p>}
          {sucesso && <p style={{ color: 'var(--success)', marginBottom: '0.75rem' }}>{sucesso}</p>}

          <button type="submit" className="btn btn-primary" disabled={salvando}>
            {salvando ? 'Criando...' : 'Criar conta mestre'}
          </button>
        </form>
      </div>
    </div>
  )
}
