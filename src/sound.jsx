import { createContext, useCallback, useContext, useRef, useState } from 'react'
import clickUrl from './assets/sfx/click.wav'
import blipUrl from './assets/sfx/blip.wav'
import dingUrl from './assets/sfx/ding.wav'
import startUrl from './assets/sfx/start.wav'

const FILES = { click: clickUrl, blip: blipUrl, ding: dingUrl, start: startUrl }
const STORAGE_KEY = 'hq-muted'

const SoundContext = createContext({ muted: false, play: () => {}, toggleMuted: () => {}, playMusic: () => {} })

export function SoundProvider({ children }) {
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
  })
  const mutedRef = useRef(muted)
  const cache = useRef({})
  const musicRef = useRef(null)

  const play = useCallback((name) => {
    if (mutedRef.current) return
    const base = (cache.current[name] ??= new Audio(FILES[name]))
    // cloneNode lets rapid clicks overlap instead of cutting each other off
    base.cloneNode().play().catch(() => {}) // rejected before first user gesture — fine
  }, [])

  // Looping background music. Passing null stops it. Remembers the last track
  // so unmuting resumes it.
  const trackRef = useRef(null)
  const playMusic = useCallback((url) => {
    trackRef.current = url
    const m = musicRef.current
    if (m?.dataset.url === url) return
    m?.pause()
    musicRef.current = null
    if (url && !mutedRef.current) {
      const audio = new Audio(url)
      audio.dataset.url = url
      audio.loop = true
      audio.volume = 0.4
      audio.play().catch(() => {})
      musicRef.current = audio
    }
  }, [])

  const toggleMuted = useCallback(() => {
    setMuted((prev) => {
      const next = !prev
      mutedRef.current = next
      if (next) { musicRef.current?.pause(); musicRef.current = null }
      try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0') } catch { /* private mode */ }
      if (!next && trackRef.current) playMusic(trackRef.current)
      return next
    })
  }, [playMusic])

  return (
    <SoundContext.Provider value={{ muted, play, toggleMuted, playMusic }}>
      {children}
    </SoundContext.Provider>
  )
}

export const useSound = () => useContext(SoundContext)
