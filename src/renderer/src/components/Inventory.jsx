export default function Inventory({ pokedex, active, onSelect, xpData }) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center',
        marginTop: '1rem'
      }}
    >
      {pokedex.map((p) => (
        <div
          key={p.id}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer',
            border: p.id === active ? '2px solid yellow' : '1px solid #aaa',
            background: p.id === active ? '#333' : '#222',
            color: 'white'
          }}
          onClick={() => onSelect(p.id)}
        >
          {p.label}
          <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>XP: {xpData[p.id] ?? 0}</div>
        </div>
      ))}
    </div>
  )
}
