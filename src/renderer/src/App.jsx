import { useState, useEffect, useRef, useCallback } from 'react'
import Timer from './components/Timer'
import PokemonDisplay from './components/PokemonDisplay'
import Inventory from './components/Inventory'
import { pokedex } from './data/pokedex'
import { createCandyTimer } from './utils/candyTimer'
import { getLevel } from './utils/leveling'
import candyIcon from './assets/icon/rare_candy.png'

function App() {
  const [activePokemon, setActivePokemon] = useState('pikachu')
  const [xpData, setXpData] = useState({}) // xp par pokemon
  const [candies, setCandies] = useState(0)
  const [inventory, setInventory] = useState({})
  const [unlockedPokemon, setUnlockedPokemon] = useState([
    'pikachu',
    'bulbizarre',
    'salameche',
    'carapuce'
  ])
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

  useEffect(() => {
    const storedInv = localStorage.getItem('inventory')
    if (storedInv) setInventory(JSON.parse(storedInv))
  }, [])

  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory))
  }, [inventory])

  useEffect(() => {
    const storedUnlocked = localStorage.getItem('unlockedPokemon')
    if (storedUnlocked) setUnlockedPokemon(JSON.parse(storedUnlocked))
  }, [])

  useEffect(() => {
    localStorage.setItem('unlockedPokemon', JSON.stringify(unlockedPokemon))
  }, [unlockedPokemon])

  const checkEvolution = (pokemonId, xp) => {
    const p = pokedex.find((p) => p.id === pokemonId)
    if (!p || !p.evolutions) return null

    const { level } = getLevel(xp)
    const levelEvo = p.evolutions.find((e) => e.type === 'level' && level >= e.level)
    return levelEvo ? levelEvo.to : null
  }

  const performEvolution = (newId, xp) => {
    // Replace old activePokemon with newId in unlocked list
    setUnlockedPokemon((prev) => {
      const newList = prev.filter((id) => id !== activePokemon)
      return [...newList, newId]
    })

    setActivePokemon(newId)
    setXpData((old) => ({
      ...old,
      [newId]: xp
    }))
    // Optional: Notification or sound
  }

  const handleTick = useCallback((seconds = 1) => {
    if (candyTimer.current.tick(seconds)) {
      setCandies((c) => c + 1)
    }
  }, [])

  const handlePomodoroFinish = useCallback(() => {
    const currentXp = xpData[activePokemon] || 0
    const newXp = currentXp + 50

    const nextId = checkEvolution(activePokemon, newXp)
    if (nextId) {
      performEvolution(nextId, newXp)
    } else {
      setXpData((old) => ({
        ...old,
        [activePokemon]: newXp
      }))
    }

    setCandies((c) => c + 5)
  }, [activePokemon, xpData])

  const giveCandy = useCallback(() => {
    if (candies <= 0) return

    const XP_AMOUNT = 40
    const currentXp = xpData[activePokemon] || 0
    const newXp = currentXp + XP_AMOUNT

    setCandies((c) => c - 1)

    const nextId = checkEvolution(activePokemon, newXp)
    if (nextId) {
      performEvolution(nextId, newXp)
    } else {
      setXpData((old) => ({
        ...old,
        [activePokemon]: newXp
      }))
    }
  }, [candies, activePokemon, xpData])

  const handleBuyStone = () => {
    if (candies >= 50) {
      setCandies((c) => c - 50)
      setInventory((inv) => ({ ...inv, 'pierre-foudre': (inv['pierre-foudre'] || 0) + 1 }))
    }
  }

  const handleEvolveWithStone = () => {
    const p = pokedex.find((p) => p.id === activePokemon)
    if (!p || !p.evolutions) return

    const itemEvo = p.evolutions.find((e) => e.type === 'item' && inventory[e.item] > 0)
    if (itemEvo) {
      setInventory((inv) => ({ ...inv, [itemEvo.item]: inv[itemEvo.item] - 1 }))
      performEvolution(itemEvo.to, xpData[activePokemon] || 0)
    }
  }

  const addCandy = useCallback((amount = 100) => {
    setCandies((c) => c + amount)
  }, [])

  return (
    <div>
      <Inventory
        pokedex={pokedex.filter((p) => unlockedPokemon.includes(p.id))}
        active={activePokemon}
        onSelect={setActivePokemon}
        xpData={xpData}
      />

      <PokemonDisplay name={activePokemon.toUpperCase()} xp={xpData[activePokemon] || 0} />
      <div style={{ textAlign: 'center', margin: '1rem' }}>
        <div>
          <img src={candyIcon} alt="candy" /> {candies}
        </div>
        <button onClick={giveCandy} disabled={candies === 0}>
          Donner un bonbon
        </button>

        <div style={{ marginTop: '1rem', borderTop: '1px solid #444', paddingTop: '1rem' }}>
          <h4>Boutique & Evolution</h4>
          <button onClick={handleBuyStone} disabled={candies < 50}>
           Acheter Pierre Foudre (50 🍬)
          </button>
          <div style={{ fontSize: '0.8rem', margin: '5px' }}>
             Pierres Foudre: {inventory['pierre-foudre'] || 0}
          </div>

          {pokedex
            .find((p) => p.id === activePokemon)
            ?.evolutions?.some((e) => e.type === 'item' && inventory[e.item] > 0) && (
            <button
              onClick={handleEvolveWithStone}
              style={{
                marginTop: '0.5rem',
                backgroundColor: 'gold',
                color: 'black',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Faire évoluer !
            </button>
          )}
        </div>
      </div>

      <Timer onFinish={handlePomodoroFinish} addCandy={addCandy} onTick={handleTick} />
    </div>
  )
}

export default App
