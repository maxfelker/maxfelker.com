import { createContext, useCallback, useContext, useState } from 'react'

// Sierra-style score: fixed maximum, points awarded once per event id, like
// "[score 220 of 500]" in Quest for Glory. Persisted so exploring accumulates
// across visits.
export const MAX_SCORE = 500
const STORAGE_KEY = 'hq-score'

const ScoreContext = createContext({ score: 0, award: () => {} })

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {} }
  catch { return {} }
}

export function ScoreProvider({ children }) {
  const [awarded, setAwarded] = useState(load)

  const award = useCallback((id, points) => {
    setAwarded((prev) => {
      if (prev[id]) return prev // each event scores only once, ever
      const next = { ...prev, [id]: points }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* private mode */ }
      return next
    })
  }, [])

  const score = Object.values(awarded).reduce((a, b) => a + b, 0)

  return (
    <ScoreContext.Provider value={{ score, award }}>
      {children}
    </ScoreContext.Provider>
  )
}

export const useScore = () => useContext(ScoreContext)
