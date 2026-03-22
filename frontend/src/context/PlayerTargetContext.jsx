import { createContext, useContext, useEffect, useState } from 'react'
import { getMestreJogadores } from '../api'

const PlayerTargetContext = createContext(null)

export function PlayerTargetProvider({ user, children }) {
  const [jogadores, setJogadores] = useState([])
  const [loadingJogadores, setLoadingJogadores] = useState(!!user?.mestre)
  const [selectedPlayerId, setSelectedPlayerId] = useState(null)

  const isMestre = !!user?.mestre

  useEffect(() => {
    if (!isMestre) {
      setJogadores([])
      setSelectedPlayerId(null)
      setLoadingJogadores(false)
      return
    }
    let cancelled = false
    setLoadingJogadores(true)
    getMestreJogadores()
      .then((list) => {
        if (cancelled) return
        setJogadores(Array.isArray(list) ? list : [])
        setSelectedPlayerId((prev) => {
          if (prev && list.some((j) => j.id === prev)) return prev
          return list.length ? list[0].id : null
        })
      })
      .catch(() => {
        if (!cancelled) setJogadores([])
      })
      .finally(() => {
        if (!cancelled) setLoadingJogadores(false)
      })
    return () => {
      cancelled = true
    }
  }, [isMestre, user?.id])

  const playerId = isMestre ? selectedPlayerId : undefined

  const readyForPlayerApi =
    !isMestre || (!loadingJogadores && (playerId != null || jogadores.length === 0))

  const value = {
    playerId,
    setPlayerId: setSelectedPlayerId,
    jogadores,
    loadingJogadores,
    isMestre,
    readyForPlayerApi,
  }

  return <PlayerTargetContext.Provider value={value}>{children}</PlayerTargetContext.Provider>
}

export function usePlayerTarget() {
  const ctx = useContext(PlayerTargetContext)
  if (!ctx) {
    throw new Error('usePlayerTarget deve ser usado dentro de PlayerTargetProvider')
  }
  return ctx
}
