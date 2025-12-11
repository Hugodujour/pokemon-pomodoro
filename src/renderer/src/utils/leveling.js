export function getLevel(xp) {
  let level = 1
  let remainingXp = xp

  while (remainingXp >= level * 1) {
    remainingXp -= level * 1
    level++
  }

  return { level, current: remainingXp, required: level * 1}
}
