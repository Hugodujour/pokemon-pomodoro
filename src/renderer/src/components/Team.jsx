import PropTypes from 'prop-types'
import './Team.css'

export default function Team({ team, activeId, onSelect, onRemove }) {
  // Ensure we always have 6 slots for display
  const slots = [...team]
  while (slots.length < 6) {
    slots.push(null)
  }

  return (
    <div className="team-container">
      {slots.map((pokemon, index) => {
        const isActive = pokemon && pokemon.uuid === activeId
        const isFilled = !!pokemon
        
        return (
          <div
            key={pokemon ? pokemon.uuid : `empty-${index}`}
            onClick={() => pokemon && onSelect(pokemon.uuid)}
            className={`team-slot ${isFilled ? 'filled' : ''} ${isActive ? 'active' : ''}`}
          >
            {pokemon ? (
              <>
                <div className="team-label">{pokemon.label}</div>
                <div className="team-level">Lvl {pokemon.level}</div>
                {/* Optional: Remove/Deposit button if team > 1 */}
                {onRemove && team.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(pokemon.uuid)
                    }}
                    className="btn-remove-team"
                    title="Move to Storage"
                  >
                    X
                  </button>
                )}
              </>
            ) : (
              <div className="team-empty">Empty</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

Team.propTypes = {
  team: PropTypes.arrayOf(
    PropTypes.shape({
      uuid: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      level: PropTypes.number.isRequired,
      xp: PropTypes.number.isRequired
      // speciesId is implicit from label or passed if needed for image
    })
  ).isRequired,
  activeId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onRemove: PropTypes.func
}
