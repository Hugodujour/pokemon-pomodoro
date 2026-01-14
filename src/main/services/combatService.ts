import { pokedex, zones } from '../data/gameData.js'
import { getLevel } from './gameService'
import { GameService } from './gameService'

/**
 * Table des types Pokemon.
 */
export const typeChart: Record<string, { strengths: string[], weaknesses: string[], immunities: string[] }> = {
  normal: { strengths: [], weaknesses: ['fighting'], immunities: [] },
  fire: { strengths: ['grass', 'ice', 'bug', 'steel'], weaknesses: ['water', 'ground', 'rock'], immunities: [] },
  water: { strengths: ['fire', 'ground', 'rock'], weaknesses: ['electric', 'grass'], immunities: [] },
  grass: { strengths: ['water', 'ground', 'rock'], weaknesses: ['fire', 'ice', 'poison', 'flying', 'bug'], immunities: [] },
  electric: { strengths: ['water', 'flying'], weaknesses: ['ground'], immunities: [] },
  ice: { strengths: ['grass', 'ground', 'flying', 'dragon'], weaknesses: ['fire', 'fighting', 'rock', 'steel'], immunities: [] },
  fighting: { strengths: ['normal', 'ice', 'rock', 'dark', 'steel'], weaknesses: ['flying', 'psychic', 'fairy'], immunities: [] },
  poison: { strengths: ['grass', 'fairy'], weaknesses: ['ground', 'psychic'], immunities: [] },
  ground: { strengths: ['fire', 'electric', 'poison', 'rock', 'steel'], weaknesses: ['water', 'grass', 'ice'], immunities: ['electric'] },
  flying: { strengths: ['grass', 'fighting', 'bug'], weaknesses: ['electric', 'ice', 'rock'], immunities: ['ground'] },
  psychic: { strengths: ['fighting', 'poison'], weaknesses: ['bug', 'ghost', 'dark'], immunities: [] },
  bug: { strengths: ['grass', 'psychic', 'dark'], weaknesses: ['fire', 'flying', 'rock'], immunities: [] },
  rock: { strengths: ['fire', 'ice', 'flying', 'bug'], weaknesses: ['water', 'grass', 'fighting', 'ground', 'steel'], immunities: [] },
  ghost: { strengths: ['psychic', 'ghost'], weaknesses: ['ghost', 'dark'], immunities: ['normal', 'fighting'] },
  dragon: { strengths: ['dragon'], weaknesses: ['ice', 'dragon', 'fairy'], immunities: [] },
  steel: { strengths: ['ice', 'rock', 'fairy'], weaknesses: ['fire', 'fighting', 'ground'], immunities: ['poison'] },
  dark: { strengths: ['psychic', 'ghost'], weaknesses: ['fighting', 'bug', 'fairy'], immunities: ['psychic'] },
  fairy: { strengths: ['fighting', 'dragon', 'dark'], weaknesses: ['poison', 'steel'], immunities: ['dragon'] }
}

/**
 * Calcule l'efficacite d'un type contre un autre.
 */
export function getTypeEffectiveness(attackerTypes: string[], defenderTypes: string[]) {
  let multiplier = 1

  if (!attackerTypes || !defenderTypes) return 1

  attackerTypes.forEach(atkType => {
    defenderTypes.forEach(defType => {
      const atkData = typeChart[atkType]
      if (!atkData) return

      if (atkData.strengths.includes(defType)) {
        multiplier *= 2
      } else if (atkData.weaknesses.includes(defType)) {
        multiplier *= 0.5
      } else if (atkData.immunities?.includes(defType)) {
        multiplier *= 0
      }
    })
  })

  return multiplier
}

/**
 * Calcule les degats d'une attaque.
 */
export function calculateDamage(attacker: any, defender: any) {
  const levelFactor = attacker.level / 10
  const baseDmg = (attacker.basePower || 40) * 0.5 * levelFactor
  const random = (Math.floor(Math.random() * 16) + 85) / 100
  const effectiveness = getTypeEffectiveness(attacker.types, defender.types)
  const stab = 1.5

  const damage = Math.floor(baseDmg * stab * effectiveness * random)

  return {
    damage: Math.max(1, damage),
    effectiveness,
    isCritical: false
  }
}

/**
 * Service de gestion des combats.
 */
export class CombatService {
  private game: GameService
  private activeCombats: Map<string, any>

  constructor(gameService: GameService) {
    this.game = gameService
    this.activeCombats = new Map()
  }

  /**
   * Genere un adversaire sauvage.
   */
  generateOpponent(zoneId: string, playerLevel: number) {
    const zone = zones.find(z => z.id === zoneId)
    let possibleSpecies = pokedex.map(p => p.id)

    if (zone && zone.pokemon && zone.pokemon.length > 0) {
      possibleSpecies = zone.pokemon
    }

    const randomSpeciesId = possibleSpecies[Math.floor(Math.random() * possibleSpecies.length)]
    const speciesData = pokedex.find(p => p.id === randomSpeciesId)
    if (!speciesData) throw new Error(`Species ${randomSpeciesId} not found`)

    let opponentLevel
    if (zone && zone.fixedLevel !== undefined) {
      opponentLevel = zone.fixedLevel
    } else {
      const levelOffset = Math.floor(Math.random() * 5) - 2
      opponentLevel = Math.max(1, playerLevel + levelOffset)
    }
    
    const maxHp = opponentLevel * 10 + 40

    return {
      speciesId: randomSpeciesId,
      label: speciesData.label,
      level: opponentLevel,
      hp: maxHp,
      maxHp,
      catchRate: speciesData.catchRate || 30,
      types: speciesData.types || ['normal'],
      basePower: speciesData.basePower || 40,
      baseSpeed: speciesData.baseSpeed || 50
    }
  }

  /**
   * Demarre un combat.
   */
  startCombat(activeId: string, zoneId: string) {
    const player = this.game.getPokemon(activeId)
    if (!player) return null

    const playerData = pokedex.find(p => p.id === player.speciesId)
    const opponent = this.generateOpponent(zoneId, player.level)

    const maxPlayerHp = player.level * 10 + 40
    const playerSpeed = (playerData?.baseSpeed || 50) + player.level
    const opponentSpeed = opponent.baseSpeed + opponent.level
    const initialTurn = playerSpeed >= opponentSpeed ? 'player' : 'opponent'

    const combatState = {
      playerId: activeId,
      player: {
        uuid: player.uuid,
        speciesId: player.speciesId,
        label: playerData?.label || 'Joueur',
        level: player.level,
        types: playerData?.types || ['normal'],
        basePower: playerData?.basePower || 40,
        baseSpeed: playerData?.baseSpeed || 50
      },
      playerHp: maxPlayerHp,
      maxPlayerHp,
      opponent,
      turn: initialTurn,
      log: [
        `Un ${opponent.label} sauvage apparait !`,
        `Le combat commence ! (${initialTurn === 'player' ? (playerData?.label || 'Joueur') : opponent.label} est plus rapide)`
      ],
      isFinished: false,
      result: null,
      captured: false
    }

    return combatState
  }

  /**
   * Execute un tour de combat.
   */
  executeTurn(combatState: any) {
    if (combatState.isFinished) return combatState

    const { turn, player, opponent, playerHp, log } = combatState
    let newState = { ...combatState, log: [...log] }

    if (turn === 'player') {
      const result = calculateDamage(player, opponent)
      const newOpponentHp = Math.max(0, opponent.hp - result.damage)

      let effectMsg = ''
      if (result.effectiveness > 1) effectMsg = ' (Super efficace !)'
      if (result.effectiveness < 1 && result.effectiveness > 0) effectMsg = ' (Pas tres efficace...)'
      if (result.effectiveness === 0) effectMsg = " (Ca n'affecte pas...)"

      newState.log.push(`${player.label} attaque ! ... inflige ${result.damage} degats !${effectMsg}`)
      newState.opponent = { ...opponent, hp: newOpponentHp }

      if (newOpponentHp <= 0) {
        const roll = Math.random() * 100
        const isCaught = roll < (opponent.catchRate || 30)

        newState.log.push(`L'ennemi ${opponent.label} est K.O. !`, `Vous avez gagne !`)
        newState.isFinished = true
        newState.result = 'win'
        newState.captured = isCaught
      } else {
        newState.turn = 'opponent'
      }
    } else {
      const result = calculateDamage(opponent, player)
      const newPlayerHp = Math.max(0, playerHp - result.damage)

      let effectMsg = ''
      if (result.effectiveness > 1) effectMsg = ' (Super efficace !)'
      if (result.effectiveness < 1 && result.effectiveness > 0) effectMsg = ' (Pas tres efficace...)'

      newState.log.push(`L'ennemi ${opponent.label} attaque ! ... inflige ${result.damage} degats !${effectMsg}`)
      newState.playerHp = newPlayerHp

      if (newPlayerHp <= 0) {
        newState.log.push(`Votre Pokemon est K.O...`, `Vous prenez la fuite...`)
        newState.isFinished = true
        newState.result = 'loss'
        newState.captured = false
      } else {
        newState.turn = 'player'
      }
    }

    return newState
  }

  /**
   * Fuite du combat.
   */
  flee(combatState: any) {
    return {
      ...combatState,
      log: [...combatState.log, `Vous avez pris la fuite !`],
      isFinished: true,
      result: 'flee',
      captured: false
    }
  }

  /**
   * Finalise le combat et distribue les recompenses.
   */
  finishCombat(combatState: any) {
    if (combatState.result === 'win') {
      const { playerId, opponent, captured } = combatState

      const XP_GAIN = 50 + opponent.level * 5
      const CANDY_GAIN = 5

      this.game.giveXp(playerId, XP_GAIN)
      this.game.addCandies(CANDY_GAIN)

      if (captured) {
        this.game.addPokemon(opponent.speciesId, opponent.level)
      }

      return {
        xpGained: XP_GAIN,
        candiesGained: CANDY_GAIN,
        captured,
        capturedSpecies: captured ? opponent.speciesId : null
      }
    }

    return { xpGained: 0, candiesGained: 0, captured: false }
  }
}
