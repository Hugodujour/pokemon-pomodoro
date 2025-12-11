import { getLevel } from '../utils/leveling'

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
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <h2>
        {name} — Niveau {level}
      </h2>

      <img src={pokemonSrc} alt={name} style={{ width: '150px', imageRendering: 'pixelated' }} />

      {/* BARRE D'XP */}
      <div
        style={{
          width: '200px',
          height: '12px',
          background: '#222',
          margin: '10px auto',
          borderRadius: '6px',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: percent + '%',
            height: '100%',
            background: 'limegreen'
          }}
        />
      </div>

      <div style={{ fontSize: '0.8rem' }}>
        {current} / {required} XP
      </div>
    </div>
  )
}
