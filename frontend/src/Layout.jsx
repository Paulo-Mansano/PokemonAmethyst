import { Outlet, NavLink } from 'react-router-dom'
import { logout } from './api'

export default function Layout({ user, onLogout }) {
  const handleLogout = async () => {
    await logout()
    onLogout()
  }

  return (
    <div>
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <NavLink to="/" end style={({ isActive }) => ({ color: isActive ? 'var(--accent)' : 'var(--text)', fontWeight: isActive ? 700 : 400 })}>
            Ficha
          </NavLink>
          <NavLink to="/pokemons" style={({ isActive }) => ({ color: isActive ? 'var(--accent)' : 'var(--text)', fontWeight: isActive ? 700 : 400 })}>
            Pokémon
          </NavLink>
          <NavLink to="/mochila" style={({ isActive }) => ({ color: isActive ? 'var(--accent)' : 'var(--text)', fontWeight: isActive ? 700 : 400 })}>
            Mochila
          </NavLink>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Treinador: {user?.nomeUsuario}</span>
          {user?.mestre && <span style={{ background: 'var(--accent)', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.8rem' }}>Mestre</span>}
          <button type="button" className="btn btn-secondary" onClick={handleLogout}>Sair</button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
