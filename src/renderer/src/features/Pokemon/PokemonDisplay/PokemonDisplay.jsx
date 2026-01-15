import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import './PokemonDisplay.css'

// Inline level calculation (logic moved to Main process)
function getLevel(xp) {
  let level = 1
  let remainingXp = xp
  while (remainingXp >= level * 1) {
    remainingXp -= level * 1
    level++
  }
  return { level, current: remainingXp, required: level * 1 }
}

export default function PokemonDisplay({ name, xp, isAdventureRunning, timerState, isBusy }) {
  const [displaySpecies, setDisplaySpecies] = useState(name)
  const [animPhase, setAnimPhase] = useState('idle')

  useEffect(() => {
    if (name !== displaySpecies) {
      // Trigger Evolution Animation
      setAnimPhase('out')
      
      const t1 = setTimeout(() => {
        setDisplaySpecies(name)
        setAnimPhase('in')
      }, 1500) // Match CSS duration

      const t2 = setTimeout(() => {
        setAnimPhase('idle')
      }, 3000)

      return () => { clearTimeout(t1); clearTimeout(t2); }
    }
  }, [name, displaySpecies])

  const pokemonImages = import.meta.glob('../../../assets/pokemon/*.{gif,png,jpg,jpeg}', {
    eager: true
  })

  // Use displaySpecies for image lookup
  const pokemonSrc = Object.entries(pokemonImages).find(([path]) =>
    path.toLowerCase().includes(displaySpecies.toLowerCase())
  )?.[1]?.default

  const { level, current, required } = getLevel(xp)

  // Logic for display: XP or Timer
  let percent = 0
  let isTimer = false
  let text = `${current} / ${required} XP`

  if (isAdventureRunning && timerState) {
    const { current: rem, total } = timerState
    percent = (1 - rem / total) * 100
    isTimer = true
    const mins = String(Math.floor(rem / 60)).padStart(2, '0')
    const secs = String(rem % 60).padStart(2, '0')
    text = `${mins}:${secs}`
  } else {
    percent = Math.floor((current / required) * 100)
  }

  // Determine Class
  let imgClass = 'pokemon-image'
  if (animPhase === 'out') imgClass += ' anim-evo-out'
  if (animPhase === 'in') imgClass += ' anim-evo-in'
  if (isBusy) imgClass += ' busy'

  return (
    <div className="pokemon-display-container">
      <div className="pokemon-display-name">
        {displaySpecies} <span className="pokemon-display-lvl">Lvl {level}</span>
      </div>

      <img src={pokemonSrc} alt={displaySpecies} className={imgClass} />

      {/* BARRE D'XP / TIMER */}
      <div className="xp-bar-container">
        <div
          className={`xp-bar-fill ${isTimer ? 'timer' : 'xp'}`}
          style={{ '--progress': percent + '%' }}
        />
      </div>

      <div className="xp-text">
        {text}
      </div>
    </div>
  )
}

PokemonDisplay.propTypes = {
  name: PropTypes.string.isRequired,
  xp: PropTypes.number.isRequired,
  isAdventureRunning: PropTypes.bool,
  timerState: PropTypes.shape({
    current: PropTypes.number,
    total: PropTypes.number
  }),
  isBusy: PropTypes.bool
}
