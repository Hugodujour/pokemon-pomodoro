import PropTypes from 'prop-types'

export default function StorageSystem({ storedPokemon, onWithdraw, visible }) {
  if (!visible) return null

  return (
    <div
      style={{
        border: '2px solid #444',
        borderRadius: '10px',
        padding: '10px',
        marginTop: '20px',
        backgroundColor: '#111'
      }}
    >
      <h3>PC Storage ({storedPokemon.length})</h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
          gap: '10px',
          maxHeight: '300px',
          overflowY: 'auto'
        }}
      >
        {storedPokemon.map((pokemon) => (
          <div
            key={pokemon.uuid}
            onClick={() => onWithdraw(pokemon.uuid)}
            style={{
              padding: '10px',
              border: '1px solid #444',
              borderRadius: '8px',
              backgroundColor: '#222',
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{pokemon.label}</div>
            <div style={{ fontSize: '0.7rem' }}>Lvl {pokemon.level}</div>
          </div>
        ))}
        {storedPokemon.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666' }}>
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
