import { useState, useEffect, useRef, useCallback } from 'react'
import Timer from './components/Timer'
import PokemonDisplay from './components/PokemonDisplay'
import Inventory from './components/Inventory'
import { pokedex } from './data/pokedex'
import { createCandyTimer } from './utils/candyTimer'
import { getLevel } from './utils/leveling'
import candyIcon from './assets/icon/rare_candy.png'

// Helper pure function
const checkEvolution = (pokemonId, xp) => {
  const p = pokedex.find((p) => p.id === pokemonId)
  if (!p || !p.evolutions) return null

  const { level } = getLevel(xp)
  const levelEvo = p.evolutions.find((e) => e.type === 'level' && level >= e.level)
  return levelEvo ? levelEvo.to : null
}

function App() {
  const [activePokemon, setActivePokemon] = useState(() => {
    return localStorage.getItem('activePokemon') || 'pikachu'
  })

  const [xpData, setXpData] = useState(() => {
    const stored = localStorage.getItem('xpData')
    if (stored) return JSON.parse(stored)
    const initial = {}
    pokedex.forEach((p) => (initial[p.id] = 0))
    return initial
  })

  const [candies, setCandies] = useState(() => {
    const stored = localStorage.getItem('candies')
    return stored ? Number(stored) : 0
  })

  const [inventory, setInventory] = useState(() => {
    const stored = localStorage.getItem('inventory')
    return stored ? JSON.parse(stored) : {}
  })

  const [unlockedPokemon, setUnlockedPokemon] = useState(() => {
    const stored = localStorage.getItem('unlockedPokemon')
    return stored ? JSON.parse(stored) : ['pikachu', 'bulbizarre', 'salameche', 'carapuce']
  })

  const candyTimer = useRef(createCandyTimer())

  useEffect(() => {
    localStorage.setItem('candies', candies)
  }, [candies])

  useEffect(() => {
    localStorage.setItem('xpData', JSON.stringify(xpData))
  }, [xpData])

  useEffect(() => {
    localStorage.setItem('activePokemon', activePokemon)
  }, [activePokemon])

  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory))
  }, [inventory])

  useEffect(() => {
    localStorage.setItem('unlockedPokemon', JSON.stringify(unlockedPokemon))
  }, [unlockedPokemon])

  const performEvolution = useCallback(
    (newId, xp) => {
      setUnlockedPokemon((prev) => {
        // Keep old unlocked, add new one if not present?
        // Original logic was: remove current active, add newId.
        // Wait, was it intentional to REMOVE the pre-evolution?
        // Line 88: prev.filter(id => id !== activePokemon).
        // Yes, it "evolves" so the old one is gone.
        const newList = prev.filter((id) => id !== activePokemon) // activePokemon is closure captured? No, need dependency or functional update with context.
        // But activePokemon inside setUnlockedPokemon callback refers to the one in scope.
        // If performEvolution is memoized, activePokemon must be a dep.
        return [...newList, newId]
      })

      setActivePokemon(newId)
      setXpData((old) => ({
        ...old,
        [newId]: xp
      }))
    },
    [activePokemon]
  ) // Added activePokemon dependency

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
  }, [activePokemon, xpData, performEvolution]) // Added performEvolution

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
  }, [candies, activePokemon, xpData, performEvolution]) // Added performEvolution

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

      <Timer onFinish={handlePomodoroFinish} onTick={handleTick} />
    </div>
  )
}

export default App
