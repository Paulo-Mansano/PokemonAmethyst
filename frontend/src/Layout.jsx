import { useMemo, useState, useRef, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar, { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from './components/Sidebar'
import { PlayerTargetProvider, usePlayerTarget } from './context/PlayerTargetContext'

function MasterPlayerBar() {
  const { isMestre, jogadores, playerId, setPlayerId, loadingJogadores } = usePlayerTarget()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef(null)
  const wrapperRef = useRef(null)

  const selectedPlayer = useMemo(
    () => jogadores.find((j) => j.id === playerId) ?? null,
    [jogadores, playerId]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return jogadores
    return jogadores.filter((j) => {
      const nome = j.nomePersonagem?.trim() ? j.nomePersonagem : `Perfil ${j.id.slice(0, 8)}`
      return nome.toLowerCase().includes(q) || String(j.nomeUsuario || '').toLowerCase().includes(q)
    })
  }, [jogadores, query])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const selectPlayer = (id) => {
    setPlayerId(id)
    setOpen(false)
    setQuery('')
  }

  const clearPlayer = (e) => {
    e.stopPropagation()
    setPlayerId(null)
    setQuery('')
    inputRef.current?.focus()
  }

  const playerName = (j) =>
    j.nomePersonagem?.trim() ? j.nomePersonagem : `Perfil ${j.id.slice(0, 8)}…`

  const displayValue = open
    ? query
    : selectedPlayer
      ? playerName(selectedPlayer)
      : ''

  if (!isMestre) return null

  return (
    <div className="master-player-bar" role="region" aria-label="Seleção de jogador">
      <label className="master-player-bar__label">Jogador ativo</label>

      {loadingJogadores ? (
        <span className="master-player-bar__hint">Carregando jogadores…</span>
      ) : jogadores.length === 0 ? (
        <span className="master-player-bar__hint">Nenhum jogador cadastrado.</span>
      ) : (
        <div className="master-player-combo" ref={wrapperRef}>
          <div
            className="master-player-combo__field"
            onClick={() => { setOpen(true); inputRef.current?.focus() }}
          >
            <svg
              className="master-player-combo__icon"
              width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>

            <input
              ref={inputRef}
              className="master-player-combo__input"
              value={displayValue}
              onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
              onFocus={() => setOpen(true)}
              placeholder="Selecionar jogador..."
              aria-label="Pesquisar e selecionar jogador"
              aria-expanded={open}
              aria-haspopup="listbox"
            />

            {selectedPlayer && !open && (
              <button
                type="button"
                className="master-player-combo__clear"
                onClick={clearPlayer}
                aria-label="Limpar seleção"
              >
                ×
              </button>
            )}

            <svg
              className={`master-player-combo__chevron${open ? ' is-open' : ''}`}
              width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>

          {open && (
            <ul className="master-player-combo__dropdown" role="listbox">
              {filtered.length === 0 ? (
                <li className="master-player-combo__empty">Nenhum jogador encontrado</li>
              ) : (
                filtered.map((j) => {
                  const isSelected = j.id === playerId
                  return (
                    <li
                      key={j.id}
                      role="option"
                      aria-selected={isSelected}
                      className={`master-player-combo__option${isSelected ? ' is-selected' : ''}`}
                      onClick={() => selectPlayer(j.id)}
                    >
                      <span>{playerName(j)}</span>
                      {isSelected && (
                        <svg
                          width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </li>
                  )
                })
              )}
            </ul>
          )}
        </div>
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
