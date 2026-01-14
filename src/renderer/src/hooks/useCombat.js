import { useState, useCallback } from 'react'

/**
 * Hook de combat utilisant IPC pour toute la logique.
 * L'état du combat est géré localement mais toutes les opérations
 * passent par le Main process via window.gameAPI.
 */
export const useCombat = ({ activeId, busyPokemonId, selectedZone, refreshState }) => {
  const [combatState, setCombatState] = useState({
    active: false,
    opponent: null,
    player: null,
    playerHp: 0,
    maxPlayerHp: 0,
    log: [],
    isFinished: false,
    result: null,
    captured: false,
    turn: 'player'
  })

  // Démarre un combat via IPC
  const startCombat = useCallback(async () => {
    const fighterId = busyPokemonId || activeId
    if (!fighterId) return

    try {
      const state = await window.gameAPI.startCombat(fighterId, selectedZone)
      if (state) {
        setCombatState({
          active: true,
          opponent: state.opponent,
          player: state.player,
          playerHp: state.playerHp,
          maxPlayerHp: state.maxPlayerHp,
          log: state.log,
          isFinished: false,
          result: null,
          captured: false,
          turn: state.turn,
          playerId: state.playerId
        })
      }
    } catch (err) {
      console.error('[useCombat] Erreur startCombat:', err)
    }
  }, [activeId, busyPokemonId, selectedZone])

  // Exécute un tour d'attaque via IPC
  const handleAttack = useCallback(async () => {
    if (combatState.isFinished || !combatState.active) return

    try {
      const newState = await window.gameAPI.attack(combatState)
      setCombatState(prev => ({
        ...prev,
        ...newState
      }))
    } catch (err) {
      console.error('[useCombat] Erreur attack:', err)
    }
  }, [combatState])

  // Fuite du combat via IPC
  const handleFlee = useCallback(async () => {
    if (combatState.isFinished) return

    try {
      const newState = await window.gameAPI.flee(combatState)
      setCombatState(prev => ({
        ...prev,
        ...newState
      }))
    } catch (err) {
      console.error('[useCombat] Erreur flee:', err)
    }
  }, [combatState])

  // Ferme le combat et distribue les récompenses
  const closeCombat = useCallback(async () => {
    try {
      // Finaliser le combat (distribuer XP, bonbons, capture)
      await window.gameAPI.finishCombat(combatState)
      
      // Rafraîchir l'état du jeu
      if (refreshState) {
        await refreshState()
      }
    } catch (err) {
      console.error('[useCombat] Erreur closeCombat:', err)
    }

    // Reset l'état local
    setCombatState({
      active: false,
      opponent: null,
      player: null,
      playerHp: 0,
      maxPlayerHp: 0,
      log: [],
      isFinished: false,
      result: null,
      captured: false,
      turn: 'player'
    })
  }, [combatState, refreshState])

  return {
    combatState,
    startCombat,
    handleAttack,
    handleFlee,
    closeCombat
  }
}
