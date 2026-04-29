import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Layout from './Layout'
import Login from './pages/Login'
import Perfil from './pages/Perfil'
import PokemonList from './pages/PokemonList'
import Mochila from './pages/Mochila'
import ItensCatalogo from './pages/ItensCatalogo'
import HabilidadesCatalogo from './pages/HabilidadesCatalogo'
import MovimentosCatalogo from './pages/MovimentosCatalogo'
import PersonalidadesCatalogo from './pages/PersonalidadesCatalogo'
import ContasMestre from './pages/ContasMestre'
import Geracao from './pages/Geracao'
import Captura from './pages/Captura'
import MestreSpecies from './pages/MestreSpecies'
import { getUsuario } from './api'
import { clearAuthCache } from './query/queryClient'

function RedirectToLogin() {
  const location = useLocation()
  return <Navigate to="/login" state={{ from: location }} replace />
}

function FallbackRoute({ user }) {
  const location = useLocation()
  if (user) return <Navigate to="/" replace />
  return <Navigate to="/login" state={{ from: location }} replace />
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ctrl = new AbortController()
    const tid = setTimeout(() => ctrl.abort(), 15000)
    getUsuario({ signal: ctrl.signal })
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => {
        clearTimeout(tid)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    const onAuthExpired = () => {
      void clearAuthCache().finally(() => setUser(null))
    }
    window.addEventListener('pokemonamethyst:auth-expired', onAuthExpired)
    return () => window.removeEventListener('pokemonamethyst:auth-expired', onAuthExpired)
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
      <Route path="/" element={user ? <Layout user={user} onLogout={() => setUser(null)} /> : <RedirectToLogin />}>
        <Route index element={<Perfil />} />
        <Route path="pokemons" element={<PokemonList />} />
        <Route path="mochila" element={<Mochila />} />
        <Route path="itens" element={<ItensCatalogo />} />
        <Route path="habilidades" element={<HabilidadesCatalogo />} />
        <Route path="movimentos" element={<MovimentosCatalogo />} />
        <Route path="mestres" element={user?.mestre ? <ContasMestre /> : <Navigate to="/" replace />} />
        <Route path="personalidades" element={<PersonalidadesCatalogo />} />
        <Route path="species" element={<MestreSpecies />} />
        <Route path="geracao" element={user?.mestre ? <Geracao /> : <Navigate to="/" replace />} />
        <Route path="captura" element={user?.mestre ? <Captura /> : <Navigate to="/" replace />} />
      </Route>
      <Route path="*" element={<FallbackRoute user={user} />} />
    </Routes>
  )
}
