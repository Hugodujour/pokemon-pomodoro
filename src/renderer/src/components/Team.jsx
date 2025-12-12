import PropTypes from 'prop-types'

export default function Team({ team, activeId, onSelect, onRemove }) {
  // Ensure we always have 6 slots for display
  const slots = [...team]
  while (slots.length < 6) {
    slots.push(null)
  }

  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
      {slots.map((pokemon, index) => (
        <div
          key={pokemon ? pokemon.uuid : `empty-${index}`}
          onClick={() => pokemon && onSelect(pokemon.uuid)}
          style={{
            width: '80px',
            height: '80px',
            border: pokemon && pokemon.uuid === activeId ? '2px solid yellow' : '1px solid #555',
            borderRadius: '10px',
            backgroundColor: pokemon ? '#333' : '#1a1a1a',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: pokemon ? 'pointer' : 'default',
            position: 'relative'
          }}
        >
          {pokemon ? (
            <>
              <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{pokemon.label}</div>
              <div style={{ fontSize: '0.7rem' }}>Lvl {pokemon.level}</div>
              {/* Optional: Remove/Deposit button if team > 1 */}
              {onRemove && team.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(pokemon.uuid)
                  }}
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    background: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  title="Move to Storage"
                >
                  X
                </button>
              )}
            </>
          ) : (
            <div style={{ color: '#555', fontSize: '0.8rem' }}>Empty</div>
          )}
        </div>
      ))}
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
