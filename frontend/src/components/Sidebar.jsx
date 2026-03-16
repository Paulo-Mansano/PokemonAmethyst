import { NavLink } from 'react-router-dom'
import { logout } from '../api'

const SIDEBAR_WIDTH_EXPANDED = 240
const SIDEBAR_WIDTH_COLLAPSED = 56

const navItems = [
  { to: '/', end: true, label: 'Ficha', title: 'Ficha do personagem', icon: IconUser },
  { to: '/pokemons', end: false, label: 'Pokémon', title: 'Pokémon', icon: IconPokemon },
  { to: '/mochila', end: false, label: 'Mochila', title: 'Mochila', icon: IconBag },
]

const navItemsMestre = [
  { to: '/itens', end: false, label: 'Itens', title: 'Catálogo de itens', icon: IconBox },
  { to: '/habilidades', end: false, label: 'Habilidades', title: 'Catálogo de habilidades', icon: IconSpark },
  { to: '/movimentos', end: false, label: 'Ataques/Movimentos', title: 'Catálogo de ataques e movimentos', icon: IconMove },
  { to: '/personalidades', end: false, label: 'Personalidade', title: 'Catálogo de personalidades', icon: IconSmile },
]

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconPokemon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  )
}

function IconBag() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function IconBox() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="m3.27 6.96 9 5.04M12 12v9.5M21 16l-9-5.04M12 12 3.27 6.96M12 12l9-5.04" />
    </svg>
  )
}

function IconSpark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  )
}

function IconMove() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17 15 12 10 7" />
      <path d="M15 12H3" />
    </svg>
  )
}

function IconSmile() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export default function Sidebar({ user, onLogout, expanded, onToggle }) {
  const handleLogout = async () => {
    await logout()
    onLogout()
  }

  const items = [...navItems, ...(user?.mestre ? navItemsMestre : [])]

  return (
    <aside className={`app-sidebar ${expanded ? 'app-sidebar--expanded' : 'app-sidebar--collapsed'}`}>
      <div className="app-sidebar-inner">
        <div className="app-sidebar-header">
          <button
            type="button"
            className="app-sidebar-toggle"
            onClick={onToggle}
            title={expanded ? 'Recolher menu' : 'Expandir menu'}
            aria-label={expanded ? 'Recolher menu' : 'Expandir menu'}
          >
            {expanded ? <IconChevronLeft /> : <IconChevronRight />}
          </button>
          {expanded && <span className="app-sidebar-title">Menu</span>}
        </div>

        <nav className="app-sidebar-nav" aria-label="Navegação principal">
          {items.map(({ to, end, label, title, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={!expanded ? title : undefined}
              className={({ isActive }) => `app-sidebar-link ${isActive ? 'app-sidebar-link--active' : ''}`}
            >
              <span className="app-sidebar-link-icon" aria-hidden>
                <Icon />
              </span>
              {expanded && <span className="app-sidebar-link-label">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="app-sidebar-footer">
          {expanded && (
            <div className="app-sidebar-user">
              <span className="app-sidebar-user-name" title={user?.nomeUsuario}>Treinador: {user?.nomeUsuario}</span>
              {user?.mestre && <span className="app-sidebar-user-badge">Mestre</span>}
            </div>
          )}
          <button
            type="button"
            className="app-sidebar-logout btn btn-secondary"
            onClick={handleLogout}
            title="Sair"
          >
            <span className="app-sidebar-link-icon" aria-hidden>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            {expanded && <span className="app-sidebar-link-label">Sair</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}

export { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED }
