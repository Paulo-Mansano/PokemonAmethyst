import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { criarContaMestre, excluirUsuario, getMestreUsuarios, getUsuario } from '../api'
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

function IconeAviso() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function ModalConfirmacao({ usuario, onCancelar, onConfirmar, excluindo }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancelar() }}
    >
      <div
        className="card"
        style={{
          maxWidth: 480, width: '100%',
          border: '1.5px solid rgba(var(--danger-rgb, 220,38,38), 0.5)',
          background: 'rgba(20,10,10,0.92)',
          backdropFilter: 'blur(16px)',
          padding: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', color: 'var(--danger)' }}>
          <IconeAviso />
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--danger)' }}>
            ATENÇÃO — Ação irreversível
          </h2>
        </div>

        <p style={{ marginTop: 0, marginBottom: '0.5rem' }}>
          Você está prestes a excluir a conta:
        </p>
        <p style={{
          fontWeight: 700, fontSize: '1.1rem',
          color: 'var(--accent)', marginTop: 0, marginBottom: '1.25rem',
          background: 'rgba(255,255,255,0.05)', borderRadius: 8,
          padding: '0.5rem 0.75rem',
        }}>
          @{usuario.nomeUsuario}
          {usuario.mestre && (
            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              (Mestre)
            </span>
          )}
        </p>

        <p style={{ marginTop: 0, marginBottom: '0.5rem', color: 'var(--text)' }}>
          <strong>TUDO</strong> relacionado a esta conta será deletado permanentemente:
        </p>
        <ul style={{ marginTop: 0, marginBottom: '1.5rem', paddingLeft: '1.25rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
          <li>Pokémon e progressão</li>
          <li>Itens na mochila</li>
          <li>Ficha do personagem</li>
        </ul>

        <p style={{ marginTop: 0, marginBottom: '1.5rem', color: 'var(--danger)', fontWeight: 600 }}>
          Esta ação NÃO pode ser desfeita.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn"
            onClick={onCancelar}
            disabled={excluindo}
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid var(--border)' }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn"
            onClick={onConfirmar}
            disabled={excluindo}
            style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}
          >
            {excluindo ? 'Excluindo...' : 'Excluir conta'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ContasMestre() {
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [salvando, setSalvando] = useState(false)

  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState(null)
  const [excluindo, setExcluindo] = useState(false)
  const [erroExclusao, setErroExclusao] = useState('')

  const queryClient = useQueryClient()

  const usuarioQuery = useQuery({
    queryKey: queryKeys.auth.usuario,
    queryFn: getUsuario,
    staleTime: 10 * 60 * 1000,
  })

  const usuariosQuery = useQuery({
    queryKey: queryKeys.mestreUsuarios,
    queryFn: getMestreUsuarios,
    enabled: !!usuarioQuery.data?.mestre,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nome = nomeUsuario.trim()
    setErro('')
    setSucesso('')

    if (!nome) { setErro('Nome de usuário é obrigatório.'); return }
    if (!senha || senha.length < 6) { setErro('Senha deve ter pelo menos 6 caracteres.'); return }

    setSalvando(true)
    try {
      const novo = await criarContaMestre(nome, senha)
      setSucesso(`Conta mestre criada com sucesso: ${novo?.nomeUsuario || nome}`)
      setNomeUsuario('')
      setSenha('')
      setMostrarSenha(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.mestreUsuarios })
    } catch (e) {
      setErro(e.message || 'Erro ao criar conta mestre')
    } finally {
      setSalvando(false)
    }
  }

  const confirmarExclusao = async () => {
    if (!usuarioParaExcluir) return
    setExcluindo(true)
    setErroExclusao('')
    try {
      await excluirUsuario(usuarioParaExcluir.id)
      queryClient.invalidateQueries({ queryKey: queryKeys.mestreUsuarios })
      setUsuarioParaExcluir(null)
    } catch (e) {
      setErroExclusao(e.message || 'Erro ao excluir conta')
    } finally {
      setExcluindo(false)
    }
  }

  if (usuarioQuery.isLoading) return <div className="container">Carregando...</div>

  if (!usuarioQuery.data?.mestre) {
    return (
      <div className="container">
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ marginTop: 0 }}>Acesso restrito</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Apenas usuários marcados como <strong>Mestre</strong> podem acessar esta área.
          </p>
        </div>
      </div>
    )
  }

  const euId = usuarioQuery.data?.id

  return (
    <div className="container" style={{ maxWidth: 600 }}>
      <h1 style={{ marginBottom: '1.5rem' }}>Administração de Contas</h1>

      {/* Criar Conta Mestre */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginTop: 0, fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Criar Conta Mestre
        </h2>
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

      {/* Lista de Usuários */}
      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          Usuários Cadastrados
        </h2>

        {erroExclusao && (
          <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{erroExclusao}</p>
        )}

        {usuariosQuery.isLoading && <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>}
        {usuariosQuery.isError && <p style={{ color: 'var(--danger)' }}>Erro ao carregar usuários.</p>}

        {usuariosQuery.data && usuariosQuery.data.length === 0 && (
          <p style={{ color: 'var(--text-muted)' }}>Nenhum usuário cadastrado.</p>
        )}

        {usuariosQuery.data && usuariosQuery.data.map((u) => (
          <div
            key={u.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.6rem 0.75rem',
              borderRadius: 8,
              marginBottom: '0.5rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontWeight: 600 }}>@{u.nomeUsuario}</span>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.06em',
                padding: '1px 7px', borderRadius: 999,
                background: u.mestre ? 'rgba(139,92,246,0.18)' : 'rgba(59,130,246,0.18)',
                color: u.mestre ? '#a78bfa' : '#60a5fa',
                border: `1px solid ${u.mestre ? 'rgba(139,92,246,0.4)' : 'rgba(59,130,246,0.4)'}`,
              }}>
                {u.mestre ? 'MESTRE' : 'JOGADOR'}
              </span>
              {u.id === euId && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(você)</span>
              )}
            </div>
            <button
              type="button"
              className="btn"
              disabled={u.id === euId}
              onClick={() => { setErroExclusao(''); setUsuarioParaExcluir(u) }}
              style={{
                fontSize: '0.8rem', padding: '4px 12px',
                background: u.id === euId ? 'transparent' : 'rgba(220,38,38,0.12)',
                color: u.id === euId ? 'var(--text-muted)' : 'var(--danger)',
                border: `1px solid ${u.id === euId ? 'var(--border)' : 'rgba(220,38,38,0.35)'}`,
                cursor: u.id === euId ? 'not-allowed' : 'pointer',
              }}
            >
              Excluir
            </button>
          </div>
        ))}
      </div>

      {usuarioParaExcluir && (
        <ModalConfirmacao
          usuario={usuarioParaExcluir}
          onCancelar={() => setUsuarioParaExcluir(null)}
          onConfirmar={confirmarExclusao}
          excluindo={excluindo}
        />
      )}
    </div>
  )
}
