export function createCandyTimer(initialTime = 0, intervalSec = 300) {
  let elapsed = initialTime // secondes écoulées depuis dernier bonbon
  const tick = (seconds = 1) => {
    elapsed += seconds
    if (elapsed >= intervalSec) {
      elapsed -= intervalSec // reset partiel
      return true // il faut donner un bonbon
    }
    return false
  }

  const getTime = () => elapsed

  const reset = () => {
    elapsed = 0
  }

  return { tick, getTime, reset }
}
