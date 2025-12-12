import PropTypes from 'prop-types'
import './StorageSystem.css'

export default function StorageSystem({ storedPokemon, onWithdraw, visible }) {
  if (!visible) return null

  return (
    <div className="storage-container">
      <h3 className="storage-title">PC Storage ({storedPokemon.length})</h3>
      <div className="storage-grid">
        {storedPokemon.map((pokemon) => (
          <div
            key={pokemon.uuid}
            onClick={() => onWithdraw(pokemon.uuid)}
            className="storage-item"
          >
            <div className="storage-item-label">{pokemon.label}</div>
            <div className="storage-item-level">Lvl {pokemon.level}</div>
          </div>
        ))}
        {storedPokemon.length === 0 && (
          <div className="storage-empty">
            Box is empty.
          </div>
        )}
      </div>
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
