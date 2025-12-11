import { useState, useEffect, useRef, useCallback } from 'react'
import Timer from './components/Timer'
import PokemonDisplay from './components/PokemonDisplay'
import Inventory from './components/Inventory'
import { pokedex } from './data/pokedex'
import { createCandyTimer } from './utils/candyTimer'

function App() {
  const [activePokemon, setActivePokemon] = useState('pikachu')
  const [xpData, setXpData] = useState({}) // xp par pokemon
  const [candies, setCandies] = useState(0)
  const candyTimer = useRef(createCandyTimer())

  useEffect(() => {
    const stored = localStorage.getItem('candies')
    if (stored) setCandies(Number(stored))
  }, [])

  useEffect(() => {
    localStorage.setItem('candies', candies)
  }, [candies])

  // Charger depuis localStorage
  useEffect(() => {
    const stored = localStorage.getItem('xpData')
    if (stored) {
      setXpData(JSON.parse(stored))
    } else {
      // init xp = 0 pour tous
      const initial = {}
      pokedex.forEach((p) => (initial[p.id] = 0))
      setXpData(initial)
    }

    const storedActive = localStorage.getItem('activePokemon')
    if (storedActive) setActivePokemon(storedActive)
  }, [])

  // Sauvegarde quand xp change
  useEffect(() => {
    localStorage.setItem('xpData', JSON.stringify(xpData))
  }, [xpData])

  // Sauvegarde du pokemon sélectionné
  useEffect(() => {
    localStorage.setItem('activePokemon', activePokemon)
  }, [activePokemon])

  const handleTick = useCallback((seconds = 1) => {
    if (candyTimer.current.tick(seconds)) {
      setCandies((c) => c + 1)
    }
  }, [])

  const handlePomodoroFinish = useCallback(() => {
    setXpData((old) => ({
      ...old,
      [activePokemon]: (old[activePokemon] || 0) + 50
    }))

    // Super bonbons
    setCandies((c) => c + 5)
  }, [activePokemon])

  const giveCandy = useCallback(() => {
    if (candies <= 0) return

    const XP_AMOUNT = 40

    setCandies((c) => c - 1)

    setXpData((old) => ({
      ...old,
      [activePokemon]: (old[activePokemon] || 0) + XP_AMOUNT
    }))
  }, [candies, activePokemon])

  const addCandy = useCallback((amount = 1) => {
    setCandies((c) => c + amount)
  }, [])

  return (
    <div>
      <Inventory
        pokedex={pokedex}
        active={activePokemon}
        onSelect={setActivePokemon}
        xpData={xpData}
      />

      <PokemonDisplay name={activePokemon.toUpperCase()} xp={xpData[activePokemon] || 0} />
      <div style={{ textAlign: 'center', margin: '1rem' }}>
        <div>Super bonbons : {candies}</div>
        <button onClick={giveCandy} disabled={candies === 0}>
          Donner un bonbon
        </button>
      </div>

      <Timer onFinish={handlePomodoroFinish} addCandy={addCandy} onTick={handleTick} />
    </div>
  )
}

export default App
