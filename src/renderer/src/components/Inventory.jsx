import PropTypes from 'prop-types'
import './Inventory.css'

export default function Inventory({ pokedex, active, onSelect, xpData }) {
  return (
    <div className="inventory-container">
      {pokedex.map((p) => (
        <div
          key={p.id}
          className={`inventory-item ${p.id === active ? 'active' : ''}`}
          onClick={() => onSelect(p.id)}
        >
          {p.label}
          <div className="inventory-xp">XP: {xpData[p.id] ?? 0}</div>
        </div>
      ))}
    </div>
  )
}

Inventory.propTypes = {
  pokedex: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  active: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  xpData: PropTypes.objectOf(PropTypes.number).isRequired
}

