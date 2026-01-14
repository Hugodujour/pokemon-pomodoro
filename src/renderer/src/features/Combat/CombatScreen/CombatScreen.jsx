import { useEffect, useRef, useState } from 'react'
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
  result,
  captured
}) {
  const logEndRef = useRef(null)
  
  // Animation states
  const [animPlayer, setAnimPlayer] = useState(false)
  const [animOpponent, setAnimOpponent] = useState(false)
  const [prevLogLength, setPrevLogLength] = useState(0)

  useEffect(() => {
    if (log.length > prevLogLength) {
      const newLines = log.slice(prevLogLength)
      
      // Check for keywords in French log messages
      // Player: "XXX attaque ! ... inflige Y dégâts" -> Does NOT start with "L'ennemi"
      // Opponent: "L'ennemi XXX attaque ! ... inflige Y dégâts"
      
      // Scan new lines for attack messages. Use findLast to get the latest action if multiple occurred.
      // (Though typically only one attack happens per update)
      const attackLog = newLines.slice().reverse().find(line => line.includes('inflige'))
      
      if (attackLog) {
        // If it starts with "L'ennemi", it's opponent. Otherwise it's player.
        // Or strictly: Player message format is "${playerFighter.label} attaque ! ..."
        const isOpponent = attackLog.startsWith("L'ennemi")
        
        if (isOpponent) {
             // Opponent attack
             setAnimOpponent(true)
             setTimeout(() => setAnimOpponent(false), 200)
        } else {
             // Player attack
             setAnimPlayer(true)
             setTimeout(() => setAnimPlayer(false), 200)
        }
      }
    }
    setPrevLogLength(log.length)
  }, [log, prevLogLength])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  // Auto-combat effect
  useEffect(() => {
    if (!isFinished) {
      const timer = setInterval(() => {
        onAttack()
      }, 700)
      return () => clearInterval(timer)
    }
  }, [isFinished, onAttack])

  // Victory sequence state
  // phases: 'fighting' -> 'throw_ball' -> 'shake_ball' -> 'caught' | 'broke_out' -> 'finished'
  const [victoryPhase, setVictoryPhase] = useState('fighting')

  useEffect(() => {
    if (isFinished) {
      if (result === 'win') {
        // Capture Sequence
        const t1 = setTimeout(() => {
          setVictoryPhase('throw_ball')
          
          const t2 = setTimeout(() => {
             // Ball hits -> Pokemon absorbed
             setVictoryPhase('shake_ball')

             const t3 = setTimeout(() => {
               // Shaking done -> Check result
               if (captured) {
                 setVictoryPhase('caught')
                 setTimeout(() => setVictoryPhase('finished'), 800)
               } else {
                 setVictoryPhase('broke_out')
                 setTimeout(() => setVictoryPhase('finished'), 1000) // Flee time
               }
             }, 2200) // 3 shakes * ~0.7s
             return () => clearTimeout(t3)

          }, 600) // Throw duration
          return () => clearTimeout(t2)
        }, 500) // HP bar wait
        return () => clearTimeout(t1)
      } else {
        // Flee or loss
        setVictoryPhase('finished')
      }
    } else {
      setVictoryPhase('fighting')
    }
  }, [isFinished, result, captured])

  // Helper to get image URL
  const pokemonImages = import.meta.glob('../../../assets/pokemon/*.{gif,png,jpg,jpeg}', {
    eager: true
  })
  const pokeballIcon = import.meta.glob('../../../assets/icon/pokeball.png', { eager: true })['../../../assets/icon/pokeball.png'].default

  const getPokemonImage = (speciesId) => {
    return Object.entries(pokemonImages).find(([path]) =>
      path.toLowerCase().includes(speciesId.toLowerCase())
    )?.[1]?.default
  }

  const playerHpPercent = (playerHp / maxPlayerHp) * 100
  const opponentHpPercent = (opponentHp / maxOpponentHp) * 100

  // Animation Classes
  const getOpponentClass = () => {
    let classes = 'combat-sprite-container '
    if (animOpponent) classes += 'anim-attack-opponent '
    
    // Capture animations
    if (victoryPhase === 'throw_ball') {
       // Ball incoming.. nothing yet
    } else if (['shake_ball', 'caught'].includes(victoryPhase)) {
       classes += 'anim-absorb ' // Shrink to 0
    } else if (victoryPhase === 'broke_out') {
       classes += 'anim-breakout ' // Grow back
    } else if (victoryPhase === 'finished' && result === 'win' && !captured) {
       classes += 'anim-flee ' // Fade away
    } else if (victoryPhase === 'finished' && result === 'win' && captured) {
       classes += 'anim-absorb ' // Stay hidden
    }
    
    return classes
  }

  const getPokeballClass = () => {
    let classes = 'pokeball-icon '
    if (victoryPhase === 'throw_ball') classes += 'anim-throw '
    else if (victoryPhase === 'shake_ball') classes += 'anim-shake '
    else if (victoryPhase === 'caught') classes += 'anim-caught '
    else if (victoryPhase === 'broke_out') classes += 'anim-breakout ' // Wait, ball should fade? No, ball breaks?
    // Easy fix for breakout: just hide ball or make it disappear
    else if (victoryPhase === 'finished' && captured) classes += 'anim-caught ' // Stay visible
    return classes
  }

  return (
    <div className="combat-slot-container">
      {/* POKEBALL ANIMATION LAYER */}
      <img src={pokeballIcon} alt="pokeball" className={getPokeballClass()} />

      {/* PLAYER (Left) */}
      <div className="combat-fighter player">
         <div className={`combat-sprite-container ${animPlayer ? 'anim-attack-player' : ''}`}>
            <img src={getPokemonImage(playerPokemon.speciesId)} alt={playerPokemon.label} className="combat-sprite" />
         </div>
         <div className="combat-info">
            <div className="combat-name">{playerPokemon.label} <span className="combat-lvl">Lvl {playerPokemon.level}</span></div>
            <div className="combat-hp-bar">
              <div className="combat-hp-fill" style={{ '--progress': `${Math.max(0, playerHpPercent)}%` }} />
            </div>
            <div className="combat-hp-text">{playerHp}/{maxPlayerHp}</div>
         </div>
      </div>

      <div className="combat-vs">VS</div>

      {/* OPPONENT (Right) */}
      <div className="combat-fighter opponent">
         <div className={getOpponentClass()}>
            <img src={getPokemonImage(opponentPokemon.speciesId)} alt={opponentPokemon.label} className="combat-sprite" />
         </div>
         <div className="combat-info">
            <div className="combat-name">{opponentPokemon.label} <span className="combat-lvl">Lvl {opponentPokemon.level}</span></div>
            <div className="combat-hp-bar">
              <div className="combat-hp-fill opponent-hp" style={{ '--progress': `${Math.max(0, opponentHpPercent)}%` }} />
            </div>
         </div>
      </div>

      {/* RESULT / CONTROLS */}
      {victoryPhase === 'finished' && (
        <div className="combat-footer">
           {result === 'win' && (
             <div className="capture-msg">
                {captured ? 'Pokémon capturé !' : 'Il s\'est échappé...'}
             </div>
           )}
           <button className="btn-return" onClick={onClose}>
             {result === 'win' ? 'Retour' : 'Continuer'}
           </button>
        </div>
      )}
    </div>
  )
}

CombatScreen.propTypes = {
  playerPokemon: PropTypes.shape({
    label: PropTypes.string,
    level: PropTypes.number,
    speciesId: PropTypes.string
  }).isRequired,
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
  result: PropTypes.string,
  captured: PropTypes.bool
}
