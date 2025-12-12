import PropTypes from 'prop-types'
import { getLevel } from '../utils/leveling'
import './PokemonDisplay.css'

export default function PokemonDisplay({ name, xp }) {
  const pokemonImages = import.meta.glob('../assets/pokemon/*.{gif,png,jpg,jpeg}', {
    eager: true
  })


  const pokemonSrc = Object.entries(pokemonImages).find(([path]) =>
    path.toLowerCase().includes(name.toLowerCase())
  )?.[1]?.default

  const { level, current, required } = getLevel(xp)

  const percent = Math.floor((current / required) * 100)

  return (
    <div className="pokemon-display-container">
      <h2 className="pokemon-display-title">
        {name} — Niveau {level}
      </h2>

      <img src={pokemonSrc} alt={name} className="pokemon-image" />

      {/* BARRE D'XP */}
      <div className="xp-bar-container">
        <div
          className="xp-bar-fill"
          style={{ width: percent + '%' }}
        />
      </div>

      <div className="xp-text">
        {current} / {required} XP
      </div>
    </div>
  )
}

PokemonDisplay.propTypes = {
  name: PropTypes.string.isRequired,
  xp: PropTypes.number.isRequired
}
