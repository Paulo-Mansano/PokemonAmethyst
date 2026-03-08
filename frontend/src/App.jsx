import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout'
import Login from './pages/Login'
import Perfil from './pages/Perfil'
import PokemonList from './pages/PokemonList'
import Mochila from './pages/Mochila'
import { getUsuario } from './api'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUsuario()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        Carregando...
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={setUser} />} />
      <Route path="/" element={user ? <Layout user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" replace />}>
        <Route index element={<Perfil user={user} />} />
        <Route path="pokemons" element={<PokemonList />} />
        <Route path="mochila" element={<Mochila />} />
      </Route>
      <Route path="*" element={<Navigate to={user ? '/' : '/login'} replace />} />
    </Routes>
  )
}
