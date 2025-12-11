export function getLevel(xp) {
  let level = 1
  let remainingXp = xp

  while (remainingXp >= level * 100) {
    remainingXp -= level * 100
    level++
  }

  return { level, current: remainingXp, required: level * 100 }
}
