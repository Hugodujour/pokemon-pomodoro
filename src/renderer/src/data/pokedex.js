export const pokedex = [
  {
    id: 'pikachu',
    label: 'Pikachu',
    evolutions: [{ type: 'item', item: 'pierre-foudre', to: 'raichu' }]
  },
  {
    id: 'raichu',
    label: 'Raichu',
    evolutions: []
  },
  {
    id: 'bulbizarre',
    label: 'Bulbizarre',
    evolutions: [{ type: 'level', level: 16, to: 'herbizarre' }]
  },
  {
    id: 'herbizarre',
    label: 'Herbizarre',
    evolutions: [{ type: 'level', level: 32, to: 'florizarre' }]
  },
  {
    id: 'florizarre',
    label: 'Florizarre',
    evolutions: []
  },
  { id: 'salameche',
    label: 'Salamèche',
    evolutions: [{ type: 'level', level: 16, to: 'reptincel' }] },
  { id: 'reptincel',
    label: 'Reptincel',
    evolutions: [{ type: 'level', level: 36, to: 'dracaufeu' }] },
    { id: 'dracaufeu',
    label: 'Dracaufeu',
    evolutions: [] },
  { id: 'carapuce',
    label: 'Carapuce',
    evolutions: [{ type: 'level', level: 16, to: 'carabaffe' }] },
  { id: 'carabaffe',
    label: 'Carabaffe',
    evolutions: [{ type: 'level', level: 36, to: 'tortank' }] },
  { id: 'tortank',
    label: 'Tortank',
    evolutions: [] },
]
