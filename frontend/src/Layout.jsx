import { useMemo, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar, { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from './components/Sidebar'
import { PlayerTargetProvider, usePlayerTarget } from './context/PlayerTargetContext'

function MasterPlayerBar() {
  const { isMestre, jogadores, playerId, setPlayerId, loadingJogadores } = usePlayerTarget()
  const [buscaJogador, setBuscaJogador] = useState('')
  const jogadoresFiltrados = useMemo(() => {
    const termo = buscaJogador.trim().toLowerCase()
    if (!termo) return jogadores
    return jogadores.filter((j) => {
      const nome = j.nomePersonagem?.trim() ? j.nomePersonagem : `Perfil ${j.id.slice(0, 8)}`
      const nomeUsuario = String(j.nomeUsuario || '')
      return nome.toLowerCase().includes(termo) || nomeUsuario.toLowerCase().includes(termo)
    })
  }, [jogadores, buscaJogador])
  const playerSelecionadoNoFiltro = jogadoresFiltrados.some((j) => j.id === playerId)

  if (!isMestre) return null
  return (
    <div className="master-player-bar" role="region" aria-label="Seleção de jogador">
      <label htmlFor="master-player-select" className="master-player-bar__label">
        Jogador ativo
      </label>
      {loadingJogadores ? (
        <span className="master-player-bar__hint">Carregando jogadores…</span>
      ) : jogadores.length === 0 ? (
        <span className="master-player-bar__hint">Nenhum jogador cadastrado no sistema.</span>
      ) : jogadoresFiltrados.length === 0 ? (
        <>
          <input
            type="text"
            className="master-player-bar__search"
            value={buscaJogador}
            onChange={(e) => setBuscaJogador(e.target.value)}
            placeholder="Pesquisar jogador..."
          />
          <span className="master-player-bar__hint">Nenhum jogador encontrado para essa busca.</span>
        </>
      ) : (
        <>
          <input
            type="text"
            className="master-player-bar__search"
            value={buscaJogador}
            onChange={(e) => setBuscaJogador(e.target.value)}
            placeholder="Pesquisar jogador..."
          />
          <select
            id="master-player-select"
            className="master-player-bar__select"
            value={playerSelecionadoNoFiltro ? (playerId ?? '') : ''}
            onChange={(e) => setPlayerId(e.target.value || null)}
          >
            {!playerSelecionadoNoFiltro && <option value="">Selecione um jogador filtrado...</option>}
            {jogadoresFiltrados.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nomePersonagem?.trim() ? j.nomePersonagem : `Perfil ${j.id.slice(0, 8)}…`}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  )
}

function LayoutShell({ user, onLogout }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(true)

  return (
    <div
      className="app-layout"
      style={{ '--sidebar-width': sidebarExpanded ? `${SIDEBAR_WIDTH_EXPANDED}px` : `${SIDEBAR_WIDTH_COLLAPSED}px` }}
    >
      <Sidebar
        user={user}
        onLogout={onLogout}
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded((e) => !e)}
      />
      <main className="app-main">
        <MasterPlayerBar />
        <Outlet />
      </main>
    </div>
  )
}

export default function Layout({ user, onLogout }) {
  return (
    <PlayerTargetProvider user={user}>
      <LayoutShell user={user} onLogout={onLogout} />
    </PlayerTargetProvider>
  )
}

export { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED }
