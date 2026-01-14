import PropTypes from 'prop-types'
import './StorageSystem.css'

export default function StorageSystem({ storedPokemon, onWithdraw, visible }) {
  if (!visible) return null

  const pokemonImages = import.meta.glob('../../../assets/pokemon/*.{gif,png,jpg,jpeg}', {
    eager: true
  })

  const getPokemonImage = (speciesId) => {
    return Object.entries(pokemonImages).find(([path]) =>
      path.toLowerCase().includes(speciesId.toLowerCase())
    )?.[1]?.default
  }

  return (
    <div className="storage-grid">
      {storedPokemon.map((pokemon) => (
        <div
          key={pokemon.uuid}
          onClick={() => onWithdraw(pokemon.uuid)}
          className="storage-item"
        >
          <img src={getPokemonImage(pokemon.speciesId)} alt={pokemon.label} className="storage-sprite" />
          <div className="storage-item-label">{pokemon.label}</div>
          <div className="storage-item-level">Lvl {pokemon.level}</div>
        </div>
      ))}
      {storedPokemon.length === 0 && (
        <div className="storage-empty">
          Le PC est vide.
        </div>
      )}
    </div>
  )
}

StorageSystem.propTypes = {
  storedPokemon: PropTypes.arrayOf(
    PropTypes.shape({
      uuid: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      level: PropTypes.number.isRequired
    })
  ).isRequired,
  onWithdraw: PropTypes.func.isRequired,
  visible: PropTypes.bool
}
