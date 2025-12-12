export const typeChart = {
  normal: {
    strengths: [],
    weaknesses: ['fighting']
  },
  fire: {
    strengths: ['grass', 'ice', 'bug', 'steel'],
    weaknesses: ['water', 'ground', 'rock'],
    immunities: []
  },
  water: {
    strengths: ['fire', 'ground', 'rock'],
    weaknesses: ['electric', 'grass'],
    immunities: []
  },
  grass: {
    strengths: ['water', 'ground', 'rock'],
    weaknesses: ['fire', 'ice', 'poison', 'flying', 'bug'],
    immunities: []
  },
  electric: {
    strengths: ['water', 'flying'],
    weaknesses: ['ground'],
    immunities: []
  },
  ice: {
    strengths: ['grass', 'ground', 'flying', 'dragon'],
    weaknesses: ['fire', 'fighting', 'rock', 'steel'],
    immunities: []
  },
  fighting: {
    strengths: ['normal', 'ice', 'rock', 'dark', 'steel'],
    weaknesses: ['flying', 'psychic', 'fairy'],
    immunities: []
  },
  poison: {
    strengths: ['grass', 'fairy'],
    weaknesses: ['ground', 'psychic'],
    immunities: []
  },
  ground: {
    strengths: ['fire', 'electric', 'poison', 'rock', 'steel'],
    weaknesses: ['water', 'grass', 'ice'],
    immunities: ['electric']
  },
  flying: {
    strengths: ['grass', 'fighting', 'bug'],
    weaknesses: ['electric', 'ice', 'rock'],
    immunities: ['ground']
  },
  psychic: {
    strengths: ['fighting', 'poison'],
    weaknesses: ['bug', 'ghost', 'dark'],
    immunities: []
  },
  bug: {
    strengths: ['grass', 'psychic', 'dark'],
    weaknesses: ['fire', 'flying', 'rock'],
    immunities: []
  },
  rock: {
    strengths: ['fire', 'ice', 'flying', 'bug'],
    weaknesses: ['water', 'grass', 'fighting', 'ground', 'steel'],
    immunities: []
  },
  ghost: {
    strengths: ['psychic', 'ghost'],
    weaknesses: ['ghost', 'dark'],
    immunities: ['normal', 'fighting']
  },
  dragon: {
    strengths: ['dragon'],
    weaknesses: ['ice', 'dragon', 'fairy'],
    immunities: []
  },
  steel: {
    strengths: ['ice', 'rock', 'fairy'],
    weaknesses: ['fire', 'fighting', 'ground'],
    immunities: ['poison']
  },
  dark: {
    strengths: ['psychic', 'ghost'],
    weaknesses: ['fighting', 'bug', 'fairy'],
    immunities: ['psychic']
  },
  fairy: {
    strengths: ['fighting', 'dragon', 'dark'],
    weaknesses: ['poison', 'steel'],
    immunities: ['dragon']
  }
}

export const getTypeEffectiveness = (attackerTypes, defenderTypes) => {
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

export const calculateDamage = (attacker, defender) => {
  // Attacker and Defender are objects with { level, types, basePower }
  
  // Base Damage Formula
  // Damage = (((2 * Level / 5 + 2) * BasePower * A / D) / 50 + 2) * Modifier
  // Simplified for this game:
  // Damage = (BasePower * 0.5 * (Level / 10)) + 5
  
  const levelFactor = attacker.level / 10
  const baseDmg = (attacker.basePower || 40) * 0.5 * levelFactor
  
  // Random variance (0.85 to 1.0)
  const random = (Math.floor(Math.random() * 16) + 85) / 100
  
  // Type Effectiveness
  const effectiveness = getTypeEffectiveness(attacker.types, defender.types)
  
  // STAB (Same Type Attack Bonus) - defaulting to 1.5 if we assume moves have types matching pokemon 
  // But here we don't have moves, so we just assume the pokemon attacks with its type.
  const stab = 1.5 
  
  // Final Calculation
  let damage = Math.floor((baseDmg * stab * effectiveness * random))
  
  // Ensure at least 1 damage
  return {
    damage: Math.max(1, damage),
    effectiveness,
    isCritical: false // Could add critical hit later
  }
}
