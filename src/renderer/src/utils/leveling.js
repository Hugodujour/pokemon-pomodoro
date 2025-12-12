export function getLevel(xp) {
  let level = 1
  let remainingXp = xp

  while (remainingXp >= level * 1) {
    remainingXp -= level * 1
    level++
  }

  return { level, current: remainingXp, required: level * 1 }
}

export function getXpForLevel(targetLevel) {
  if (targetLevel <= 1) return 0
  // Sum of integers from 1 to targetLevel-1
  return (targetLevel * (targetLevel - 1)) / 2
}

export const checkEvolution = (speciesId, xp, pokedex) => {
  const p = pokedex.find((p) => p.id === speciesId)
  if (!p || !p.evolutions) return null

  const { level } = getLevel(xp)
  const levelEvo = p.evolutions.find((e) => e.type === 'level' && level >= e.level)
  return levelEvo ? levelEvo.to : null
}
