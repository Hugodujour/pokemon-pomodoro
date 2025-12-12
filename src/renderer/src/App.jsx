import { useState, useEffect, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Timer from './components/Timer'
import PokemonDisplay from './components/PokemonDisplay'
import Team from './components/Team'
import StorageSystem from './components/StorageSystem'
import { pokedex } from './data/pokedex'
import { createCandyTimer } from './utils/candyTimer'
import { getLevel } from './utils/leveling'
import candyIcon from './assets/icon/rare_candy.png'

// Helper pure function
const checkEvolution = (speciesId, xp) => {
  const p = pokedex.find((p) => p.id === speciesId)
  if (!p || !p.evolutions) return null

  const { level } = getLevel(xp)
  const levelEvo = p.evolutions.find((e) => e.type === 'level' && level >= e.level)
  return levelEvo ? levelEvo.to : null
}

function App() {
  // --- STATE ---

  // ownedPokemon: Array of { uuid, speciesId, xp, level, dateCaught }
  const [ownedPokemon, setOwnedPokemon] = useState(() => {
    const stored = localStorage.getItem('ownedPokemon')
    if (stored) return JSON.parse(stored)

    // MIGRATION LOGIC (v0 -> v1)
    const oldUnlocked = localStorage.getItem('unlockedPokemon')
    if (oldUnlocked) {
      const ids = JSON.parse(oldUnlocked)
      const oldXpData = JSON.parse(localStorage.getItem('xpData') || '{}')
      
      const newOwned = ids.map(speciesId => {
        const xp = oldXpData[speciesId] || 0
        const { level } = getLevel(xp)
        return {
          uuid: uuidv4(),
          speciesId,
          xp,
          level,
          dateCaught: new Date().toISOString()
        }
      })
      return newOwned
    }

    // Default start
    const starters = ['pikachu', 'bulbizarre', 'salameche', 'carapuce']
    return starters.map(speciesId => ({
      uuid: uuidv4(),
      speciesId,
      xp: 0,
      level: 1,
      dateCaught: new Date().toISOString()
    }))
  })

  // teamIds: Array of UUIDs (Max 6)
  const [teamIds, setTeamIds] = useState(() => {
    const stored = localStorage.getItem('teamIds')
    if (stored) return JSON.parse(stored)
    
    // Default: use all initial owned (up to 6)
    // We can't access 'ownedPokemon' state here easily if initialized same render, but 
    // we can replicate logic or rely on first render effect to fix consistency if needed.
    return [] // Will fill in useEffect
  })

  // activeId: UUID
  const [activeId, setActiveId] = useState(() => {
    return localStorage.getItem('activeId') || null
  })

  const [candies, setCandies] = useState(() => {
    const stored = localStorage.getItem('candies')
    return stored ? Number(stored) : 0
  })

  const [inventory, setInventory] = useState(() => {
    const stored = localStorage.getItem('inventory')
    return stored ? JSON.parse(stored) : {}
  })

  const [showStorage, setShowStorage] = useState(false)

  const candyTimer = useRef(createCandyTimer())

  // --- EFFECTS ---

  useEffect(() => {
    localStorage.setItem('ownedPokemon', JSON.stringify(ownedPokemon))
  }, [ownedPokemon])

  useEffect(() => {
    localStorage.setItem('teamIds', JSON.stringify(teamIds))
  }, [teamIds])

  useEffect(() => {
    localStorage.setItem('activeId', activeId)
  }, [activeId])

  useEffect(() => {
    localStorage.setItem('candies', candies)
  }, [candies])

  useEffect(() => {
    localStorage.setItem('inventory', JSON.stringify(inventory))
  }, [inventory])

  // Sync Team/Active if empty (Initial Load or Migration fix)
  useEffect(() => {
    if (ownedPokemon.length > 0) {
      // If team is empty, fill it up to 6
      if (teamIds.length === 0) {
        const newTeam = ownedPokemon.slice(0, 6).map(p => p.uuid)
        setTeamIds(newTeam)
        if (!activeId) setActiveId(newTeam[0])
      } 
      // If activeId is missing or invalid, set to first team member
      else if (!activeId || !ownedPokemon.find(p => p.uuid === activeId)) {
        if (teamIds.length > 0) {
          setActiveId(teamIds[0])
        } else {
             // Fallback if team is empty (shouldn't happen with above logic but safe guard)
             setActiveId(ownedPokemon[0].uuid)
        }
      }
    }
  }, [ownedPokemon, teamIds, activeId])


  // --- LOGIC ---

  const getActiveInstance = () => ownedPokemon.find(p => p.uuid === activeId)

  // Update a specific pokemon instance
  const updatePokemon = (uuid, updates) => {
    setOwnedPokemon(prev => prev.map(p => {
      if (p.uuid === uuid) {
        return { ...p, ...updates }
      }
      return p
    }))
  }

  const performEvolution = useCallback(
    (uuid, newSpeciesId, currentXp) => {
       updatePokemon(uuid, { speciesId: newSpeciesId })
       // XP handling is within update logic usually, but here we just mutate species.
    },
    []
  )

  const handleTick = useCallback((seconds = 1) => {
    if (candyTimer.current.tick(seconds)) {
      setCandies((c) => c + 1)
    }
  }, [])

  const handlePomodoroFinish = useCallback(() => {
    const active = ownedPokemon.find(p => p.uuid === activeId) // use direct ref or depend on activeId
    if (!active) return

    const XP_GAIN = 50
    const newXp = active.xp + XP_GAIN
    const { level } = getLevel(newXp)
    
    // Check Evolution
    const nextSpecies = checkEvolution(active.speciesId, newXp)
    
    let updates = { xp: newXp, level }
    if (nextSpecies) {
      updates.speciesId = nextSpecies
    }

    // Need to call updatePokemon. 
    // Since this is inside callback, we need stable ref or functional update.
    // simpler:
    setOwnedPokemon(prev => prev.map(p => {
        if (p.uuid === active.uuid) {
            return { ...p, ...updates }
        }
        return p
    }))
    
    setCandies((c) => c + 5)
  }, [activeId, ownedPokemon]) // Depend on ownedPokemon to find active

  const giveCandy = useCallback(() => {
    if (candies <= 0) return
    const active = ownedPokemon.find(p => p.uuid === activeId)
    if (!active) return

    const XP_AMOUNT = 40
    const newXp = active.xp + XP_AMOUNT
    const { level } = getLevel(newXp)

    setCandies((c) => c - 1)

    const nextSpecies = checkEvolution(active.speciesId, newXp)
    let updates = { xp: newXp, level }
    if (nextSpecies) {
      updates.speciesId = nextSpecies
    }
    
     setOwnedPokemon(prev => prev.map(p => {
        if (p.uuid === active.uuid) {
            return { ...p, ...updates }
        }
        return p
    }))
  }, [candies, activeId, ownedPokemon])

  const handleBuyStone = () => {
    if (candies >= 50) {
      setCandies((c) => c - 50)
      setInventory((inv) => ({ ...inv, 'pierre-foudre': (inv['pierre-foudre'] || 0) + 1 }))
    }
  }

  const handleEvolveWithStone = () => {
    const active = getActiveInstance()
    if (!active) return

    const pData = pokedex.find((p) => p.id === active.speciesId)
    if (!pData || !pData.evolutions) return

    const itemEvo = pData.evolutions.find((e) => e.type === 'item' && inventory[e.item] > 0)
    if (itemEvo) {
      setInventory((inv) => ({ ...inv, [itemEvo.item]: inv[itemEvo.item] - 1 }))
      updatePokemon(active.uuid, { speciesId: itemEvo.to })
    }
  }

  // --- TEAM MANAGEMENT ---

  const handleWithdraw = (uuid) => {
    if (teamIds.length < 6) {
      setTeamIds(prev => [...prev, uuid])
    }
  }

  const handleRemoveFromTeam = (uuid) => {
    if (teamIds.length > 1) {
      setTeamIds(prev => prev.filter(id => id !== uuid))
      // If we removed the active one, switch active
      if (activeId === uuid) {
         // This effect will be handled by the useEffect validation, or we can do it here.
         setActiveId(null) 
      }
    }
  }

  // Data helpers for rendering
  const teamList = teamIds.map(id => {
    const instance = ownedPokemon.find(p => p.uuid === id)
    if (!instance) return null
    const data = pokedex.find(p => p.id === instance.speciesId)
    return { ...instance, label: data ? data.label : '???' }
  }).filter(Boolean)

  const storageList = ownedPokemon
    .filter(p => !teamIds.includes(p.uuid))
    .map(instance => {
       const data = pokedex.find(p => p.id === instance.speciesId)
       return { ...instance, label: data ? data.label : '???' }
    })

  const activeInstance = getActiveInstance()
  
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h2>Équipe</h2>
      </div>
      <Team 
        team={teamList} 
        activeId={activeId} 
        onSelect={setActiveId} 
        onRemove={handleRemoveFromTeam}
      />
      
      <div style={{textAlign: 'center', marginBottom: '10px'}}>
        <button onClick={() => setShowStorage(prev => !prev)}>
           {showStorage ? 'Fermer PC' : 'Ouvrir PC'}
        </button>
      </div>

      <StorageSystem 
        storedPokemon={storageList} 
        onWithdraw={handleWithdraw} 
        visible={showStorage} 
      />

      {activeInstance && (
        <div style={{marginTop: '2rem'}}>
          <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
             <h3>Pokémon Actif</h3>
          </div>
          <PokemonDisplay 
            name={activeInstance.speciesId.toUpperCase()} 
            xp={activeInstance.xp} 
          />
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
                .find((p) => p.id === activeInstance.speciesId)
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
        </div>
      )}

      <Timer onFinish={handlePomodoroFinish} onTick={handleTick} />
    </div>
  )
}

export default App
