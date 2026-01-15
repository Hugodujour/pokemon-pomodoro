import PropTypes from 'prop-types'
import './Team.css'

export default function Team({ team, activeId, onSelect, onRemove, onDragStart, onDragEnd, onDragOver, onDrop, isBusy }) {
  // Ensure we always have 3 slots for display
  const slots = [...team]
  while (slots.length < 3) {
    slots.push(null)
  }

  const pokemonImages = import.meta.glob('../../../assets/pokemon/*.{gif,png,jpg,jpeg}', {
    eager: true
  })

  const getPokemonImage = (speciesId) => {
      // speciesId is usually lowercase like 'pikachu'
     return Object.entries(pokemonImages).find(([path]) =>
        path.toLowerCase().includes(speciesId.toLowerCase())
      )?.[1]?.default
  }

  return (
    <div className="team-container">
      {slots.map((pokemon, index) => {
        const isActive = pokemon && pokemon.uuid === activeId
        const isFilled = !!pokemon
        const imgSrc = pokemon ? getPokemonImage(pokemon.speciesId || pokemon.label) : null
        
        return (
          <div
            key={pokemon ? pokemon.uuid : `empty-${index}`}
            onClick={() => pokemon && onSelect(pokemon.uuid)}
            onDragStart={(e) => pokemon && onDragStart(e, pokemon.uuid)}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDrop={() => onDrop(pokemon ? pokemon.uuid : null, index)}
            draggable={isFilled}
            className={`team-slot ${isFilled ? 'filled' : ''} ${isActive ? 'active' : ''} ${isActive && isBusy ? 'busy' : ''}`}
          >
            {pokemon ? (
              <>
                <img src={imgSrc} alt={pokemon.label} className="team-sprite" draggable="false" />
                <div className="team-label">{pokemon.label}</div>
                <div className="team-level">Lvl {pokemon.level}</div>
                
                {onRemove && team.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemove(pokemon.uuid)
                    }}
                    className="btn-remove-team"
                    title="Move to Storage"
                  >
                    ×
                  </button>
                )}
              </>
            ) : (
              <div className="team-empty">Vide</div>
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
      xp: PropTypes.number.isRequired,
      speciesId: PropTypes.string.isRequired
    })
  ).isRequired,
  activeId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onRemove: PropTypes.func
}
