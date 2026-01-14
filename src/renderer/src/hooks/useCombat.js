import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { pokedex } from '../data/pokedex'
import { getLevel, checkEvolution, getXpForLevel } from '../utils/leveling'
import { zones } from '../data/zones'
import { calculateDamage } from '../utils/combatLogic'

export const useCombat = ({
  ownedPokemon,
  updatePokemon,
  setOwnedPokemon,
  setTeamIds,
  teamIds,
  setCandies,
  activeId,
  busyPokemonId,
  setBusyPokemonId,
  selectedZone
}) => {
  const [combatState, setCombatState] = useState({
    active: false,
    opponent: null, 
    playerHp: 0,
    maxPlayerHp: 0,
    log: [],
    isFinished: false,
    result: null 
  })

  // Start Combat
  const startCombat = useCallback(() => {
    // Determine who is fighting. Usually activeId, but if busyId is set (coming from adventure), use that.
    const fighterId = busyPokemonId || activeId
    const active = ownedPokemon.find((p) => p.uuid === fighterId)
    if (!active) return

    // Generate Wild Pokemon based on Zone
    let possibleSpecies = pokedex.map((p) => p.id)
    
    if (selectedZone) {
      const zoneData = zones.find(z => z.id === selectedZone)
      if (zoneData && zoneData.pokemon.length > 0) {
        possibleSpecies = zoneData.pokemon
      }
    }

    const randomSpeciesId = possibleSpecies[Math.floor(Math.random() * possibleSpecies.length)]
    const speciesData = pokedex.find((p) => p.id === randomSpeciesId)

    // Level scaling: +/- 2 levels of player
    const levelOffset = Math.floor(Math.random() * 5) - 2 // -2 to +2
    const opponentLevel = Math.max(1, active.level + levelOffset)

    // Stats
    const maxOpponentHp = opponentLevel * 10 + 40
    const maxPlayerHp = active.level * 10 + 40
    
    const activeData = pokedex.find(p => p.id === active.speciesId)

    // Determine Initiative
    const playerSpeed = (activeData?.baseSpeed || 50) + active.level
    const opponentSpeed = (speciesData?.baseSpeed || 50) + opponentLevel
    const initialTurn = playerSpeed >= opponentSpeed ? 'player' : 'opponent'

    setCombatState({
      active: true,
      opponent: {
        speciesId: randomSpeciesId,
        label: speciesData.label,
        level: opponentLevel,
        hp: maxOpponentHp,
        maxHp: maxOpponentHp,
        catchRate: speciesData.catchRate || 30,
        types: speciesData.types || ['normal'],
        basePower: speciesData.basePower || 40,
        baseSpeed: speciesData.baseSpeed || 50
      },
      playerHp: maxPlayerHp,
      maxPlayerHp: maxPlayerHp,
       // Initial log
      log: [`Un ${speciesData.label} sauvage apparaît !`, `Le combat commence ! (${initialTurn === 'player' ? activeData.label : speciesData.label} est plus rapide)`],
      isFinished: false,
      result: null,
      turn: initialTurn
    })
  }, [activeId, busyPokemonId, ownedPokemon, selectedZone])

  // Handle Attack Round (One Turn at a time)
  const handleAttack = () => {
    const { active: isCombatActive, opponent, playerHp, log, turn } = combatState
    if (!isCombatActive || !opponent) return

    const fighterId = busyPokemonId || activeId
    const active = ownedPokemon.find((p) => p.uuid === fighterId)
    if (!active) return

    // Prepare Fighter Data
    const activeData = pokedex.find(p => p.id === active.speciesId)
    const playerFighter = {
      label: activeData?.label || 'Joueur',
      level: active.level,
      types: activeData?.types || ['normal'],
      basePower: activeData?.basePower || 40
    }

    const opponentFighter = {
      label: opponent.label,
      level: opponent.level,
      types: opponent.types,
      basePower: opponent.basePower
    }

    if (turn === 'player') {
         // --- Player Turn ---
        const result = calculateDamage(playerFighter, opponentFighter)
        const newOpponentHp = Math.max(0, opponent.hp - result.damage)

        let effectMsg = ''
        if (result.effectiveness > 1) effectMsg = ' (Super efficace !)'
        if (result.effectiveness < 1 && result.effectiveness > 0) effectMsg = ' (Pas très efficace...)'
        if (result.effectiveness === 0) effectMsg = ' (Ça n\'affecte pas...)'

        const turnLog = `${playerFighter.label} attaque ! ... inflige ${result.damage} dégâts !${effectMsg}`
        
        if (newOpponentHp <= 0) {
          // Win - Determine Capture Outcome NOW
          const roll = Math.random() * 100
          const isCaught = roll < (opponent.catchRate || 30)

          setCombatState((prev) => ({
            ...prev,
            opponent: { ...prev.opponent, hp: 0 },
            log: [...log, turnLog, `L'ennemi ${opponent.label} est K.O. !`, `Vous avez gagné !`],
            isFinished: true,
            result: 'win',
            captured: isCaught // Store result for animation
          }))
        } else {
          // Pass turn
          setCombatState((prev) => ({
            ...prev,
            opponent: { ...prev.opponent, hp: newOpponentHp },
            log: [...log, turnLog],
            turn: 'opponent'
          }))
        }

    } else {
        // --- Opponent Turn ---
        const result = calculateDamage(opponentFighter, playerFighter)
        const newPlayerHp = Math.max(0, playerHp - result.damage)

        let effectMsg = ''
        if (result.effectiveness > 1) effectMsg = ' (Super efficace !)'
        if (result.effectiveness < 1 && result.effectiveness > 0) effectMsg = ' (Pas très efficace...)'
        
        const turnLog = `L'ennemi ${opponentFighter.label} attaque ! ... inflige ${result.damage} dégâts !${effectMsg}`

        if (newPlayerHp <= 0) {
          // Loss
          setCombatState((prev) => ({
            ...prev,
            playerHp: 0,
            log: [...log, turnLog, `Votre Pokémon est K.O...`, `Vous prenez la fuite...`],
            isFinished: true,
            result: 'loss',
            captured: false
          }))
        } else {
          // Pass turn
          setCombatState((prev) => ({
            ...prev,
            playerHp: newPlayerHp,
            log: [...log, turnLog],
            turn: 'player'
          }))
        }
    }
  }

  // Handle Flee
  const handleFlee = () => {
    setCombatState((prev) => ({
      ...prev,
      log: [...prev.log, `Vous avez pris la fuite !`],
      isFinished: true,
      result: 'flee',
      captured: false
    }))
  }

  // Close Combat & Give Rewards
  const closeCombat = () => {
    const { result, opponent, captured } = combatState
    const fighterId = busyPokemonId || activeId

    if (result === 'win') {
      // Rewards
      const XP_GAIN = 50 + opponent.level * 5
      const CANDY_GAIN = 5

      const active = ownedPokemon.find((p) => p.uuid === fighterId)
      if (active) {
        const newXp = active.xp + XP_GAIN
        const { level } = getLevel(newXp)
        const nextSpecies = checkEvolution(active.speciesId, newXp, pokedex)

        let updates = { xp: newXp, level }
        if (nextSpecies) updates.speciesId = nextSpecies

        updatePokemon(active.uuid, updates)
      }
      setCandies((c) => c + CANDY_GAIN)

      // Catch Logic - Use pre-determined result
      if (captured) {
        // CAUGHT!
        const newPokemon = {
          uuid: uuidv4(),
          speciesId: opponent.speciesId,
          xp: getXpForLevel(opponent.level),
          level: opponent.level,
          dateCaught: new Date().toISOString()
        }

        setOwnedPokemon((prev) => [...prev, newPokemon])

        // Add to team if space
        if (teamIds.length < 3) {
          setTeamIds((prev) => [...prev, newPokemon.uuid])
        }
      }
    }

    // Unlock pokemon
    setBusyPokemonId(null)

    setCombatState({
      active: false,
      opponent: null,
      playerHp: 0,
      maxPlayerHp: 0,
      log: [],
      isFinished: false,
      result: null,
      captured: false
    })
  }

  return {
    combatState,
    startCombat,
    handleAttack,
    handleFlee,
    closeCombat
  }
}
