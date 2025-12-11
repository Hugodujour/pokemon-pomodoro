export const pokedex = [
  {
    id: 'pikachu',
    label: 'Pikachu',
    evolutions: [
      { type: 'item', item: 'pierre-foudre', to: 'raichu' }
    ]
  },
  {
    id: 'raichu',
    label: 'Raichu',
    evolutions: []
  },
  {
    id: 'bulbizarre',
    label: 'Bulbizarre',
    evolutions: [
      { type: 'level', level: 16, to: 'herbizarre' }
    ]
  },
  {
    id: 'herbizarre',
    label: 'Herbizarre',
    evolutions: [
      { type: 'level', level: 32, to: 'florizarre' }
    ]
  },
  {
    id: 'florizarre',
    label: 'Florizarre',
    evolutions: []
  },
  { id: 'salameche', label: 'Salamèche', evolutions: [] },
  { id: 'carapuce', label: 'Carapuce', evolutions: [] }
]
