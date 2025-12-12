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

    // HP Calculation
    // For now keeping simple HP formula to match existing balance, or should we update HP too?
    // Let's keep HP similar but slightly boosted since damage might be higher with BP.
    const maxOpponentHp = opponentLevel * 10 + 40
    const maxPlayerHp = active.level * 10 + 40

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
        basePower: speciesData.basePower || 40
      },
      playerHp: maxPlayerHp,
      maxPlayerHp: maxPlayerHp,
      log: [`Un ${speciesData.label} sauvage apparaît !`],
      isFinished: false,
      result: null
    })
  }, [activeId, busyPokemonId, ownedPokemon, selectedZone])

  // Handle Attack Round
  const handleAttack = () => {
    const fighterId = busyPokemonId || activeId
    const active = ownedPokemon.find((p) => p.uuid === fighterId)
    const { opponent, playerHp, log } = combatState

    if (!active || !opponent) return

    // Prepare Fighter Data
    const activeData = pokedex.find(p => p.id === active.speciesId)
    const playerFighter = {
      level: active.level,
      types: activeData?.types || ['normal'],
      basePower: activeData?.basePower || 40
    }

    const opponentFighter = {
      level: opponent.level,
      types: opponent.types,
      basePower: opponent.basePower
    }

    // --- Player Turn ---
    const playerResult = calculateDamage(playerFighter, opponentFighter)
    const newOpponentHp = Math.max(0, opponent.hp - playerResult.damage)

    let roundLog = []
    
    let effectMsg = ''
    if (playerResult.effectiveness > 1) effectMsg = ' (Super efficace !)'
    if (playerResult.effectiveness < 1 && playerResult.effectiveness > 0) effectMsg = ' (Pas très efficace...)'
    if (playerResult.effectiveness === 0) effectMsg = ' (Ça n\'affecte pas...)'

    roundLog.push(`${activeData?.label} inflige ${playerResult.damage} dégâts !${effectMsg}`)

    if (newOpponentHp <= 0) {
      setCombatState((prev) => ({
        ...prev,
        opponent: { ...prev.opponent, hp: 0 },
        log: [...log, ...roundLog, `${opponent.label} est K.O. !`, `Vous avez gagné !`],
        isFinished: true,
        result: 'win'
      }))
      return
    }

    // --- Opponent Turn ---
    const opponentResult = calculateDamage(opponentFighter, playerFighter)
    const newPlayerHp = Math.max(0, playerHp - opponentResult.damage)

    let oppEffectMsg = ''
    if (opponentResult.effectiveness > 1) oppEffectMsg = ' (Super efficace !)'
    if (opponentResult.effectiveness < 1 && opponentResult.effectiveness > 0) oppEffectMsg = ' (Pas très efficace...)'
    
    roundLog.push(`${opponent.label} attaque et inflige ${opponentResult.damage} dégâts !${oppEffectMsg}`)

    if (newPlayerHp <= 0) {
      setCombatState((prev) => ({
        ...prev,
        opponent: { ...prev.opponent, hp: newOpponentHp },
        playerHp: 0,
        log: [...log, ...roundLog, `Votre Pokémon est K.O...`, `Vous prenez la fuite...`],
        isFinished: true,
        result: 'loss'
      }))
    } else {
      setCombatState((prev) => ({
        ...prev,
        opponent: { ...prev.opponent, hp: newOpponentHp },
        playerHp: newPlayerHp,
        log: [...log, ...roundLog]
      }))
    }
  }

  // Handle Flee
  const handleFlee = () => {
    setCombatState((prev) => ({
      ...prev,
      log: [...prev.log, `Vous avez pris la fuite !`],
      isFinished: true,
      result: 'flee'
    }))
  }

  // Close Combat & Give Rewards
  const closeCombat = () => {
    const { result, opponent } = combatState
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

      // Catch Logic
      const roll = Math.random() * 100
      if (roll < (opponent.catchRate || 30)) {
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
      result: null
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
