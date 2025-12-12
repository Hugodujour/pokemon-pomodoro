import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import './CombatScreen.css'

export default function CombatScreen({ 
  playerPokemon, 
  opponentPokemon, 
  log, 
  onAttack, 
  onFlee, 
  playerHp, 
  maxPlayerHp, 
  opponentHp, 
  maxOpponentHp,
  isFinished,
  onClose,
  result
}) {
  const logEndRef = useRef(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  // Auto-combat effect
  useEffect(() => {
    if (!isFinished) {
      const timer = setInterval(() => {
        onAttack()
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isFinished, onAttack])

  // Helper to get image URL
  const getPokemonImage = (speciesId) => {
    return new URL(`../../assets/pokemon/${speciesId}.gif`, import.meta.url).href
  }

  const playerHpPercent = (playerHp / maxPlayerHp) * 100
  const opponentHpPercent = (opponentHp / maxOpponentHp) * 100

  return (
    <div className="combat-overlay">
      <div className="combat-container minimalist">
        
        {/* OPPONENT AREA (Top Right) */}
        <div className="fighter opponent">
          <div className="fighter-info">
            <div className="fighter-name">{opponentPokemon.label} <span className="fighter-level">Lv.{opponentPokemon.level}</span></div>
            <div className="fighter-hp-bar">
              <div 
                className="fighter-hp-fill" 
                style={{ width: `${Math.max(0, opponentHpPercent)}%` }}
              />
            </div>
          </div>
          <div className="fighter-sprite">
             <img src={getPokemonImage(opponentPokemon.speciesId)} alt={opponentPokemon.label} />
          </div>
        </div>

        {/* PLAYER AREA (Bottom Left) */}
        <div className="fighter player">
          <div className="fighter-sprite">
            {/* Assuming playerPokemon has speciesId passed or we can pass it. 
                Wait, playerPokemon prop currently only has label/level from App.jsx line 305. 
                We need to pass speciesId from App.jsx or derive it. 
                Let's check App.jsx again. 
                App.jsx passes: playerPokemon={{ label: ..., level: ... }} 
                I need to modify App.jsx to pass speciesId as well.
                For now I will use a placeholder or assume the prop will be updated.
            */}
             <img src={getPokemonImage(playerPokemon.speciesId)} alt={playerPokemon.label} />
          </div>
          <div className="fighter-info">
            <div className="fighter-name">{playerPokemon.label} <span className="fighter-level">Lv.{playerPokemon.level}</span></div>
            <div className="fighter-hp-bar">
              <div 
                className="fighter-hp-fill" 
                style={{ width: `${Math.max(0, playerHpPercent)}%` }}
              />
            </div>
            <div className="fighter-hp-text">{playerHp}/{maxPlayerHp}</div>
          </div>
        </div>

        <div className="combat-log-minimal">
          {log.slice(-2).map((entry, i) => ( // Only show last 2 lines
            <div key={i} className="log-entry">{entry}</div>
          ))}
        </div>

        <div className="combat-controls">
          {!isFinished ? (
            <div className="auto-combat-status">
              ...
            </div>
          ) : (
            <button className="btn-combat btn-finish" onClick={onClose}>
              {result === 'win' ? '✨ Victoire' : 'Fuir'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

CombatScreen.propTypes = {
  playerPokemon: PropTypes.shape({
    label: PropTypes.string,
    level: PropTypes.number,
    speciesId: PropTypes.string // Added this
  }).isRequired,
  // ... rest same
  opponentPokemon: PropTypes.shape({
    label: PropTypes.string,
    level: PropTypes.number,
    speciesId: PropTypes.string
  }).isRequired,
  log: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAttack: PropTypes.func.isRequired,
  onFlee: PropTypes.func.isRequired,
  playerHp: PropTypes.number.isRequired,
  maxPlayerHp: PropTypes.number.isRequired,
  opponentHp: PropTypes.number.isRequired,
  maxOpponentHp: PropTypes.number.isRequired,
  isFinished: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  result: PropTypes.string
}
