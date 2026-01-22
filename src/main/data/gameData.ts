// Data statiques pour le Main Process
export const pokedex = [
  {
    id: 'pikachu',
    label: 'Pikachu',
    types: ['electric'],
    basePower: 55,
    baseSpeed: 90,
    catchRate: 40,
    size: 'S',
    evolutions: [{ type: 'item', item: 'pierre-foudre', to: 'raichu' }]
  },
  {
    id: 'raichu',
    label: 'Raichu',
    types: ['electric'],
    basePower: 90,
    baseSpeed: 110,
    catchRate: 15,
    size: 'M',
    evolutions: []
  },
  {
    id: 'bulbizarre',
    label: 'Bulbizarre',
    types: ['grass', 'poison'],
    basePower: 45,
    baseSpeed: 45,
    catchRate: 30,
    size: 'S',
    evolutions: [{ type: 'level', level: 16, to: 'herbizarre' }]
  },
  {
    id: 'herbizarre',
    label: 'Herbizarre',
    types: ['grass', 'poison'],
    basePower: 60,
    baseSpeed: 60,
    catchRate: 20,
    size: 'M',
    evolutions: [{ type: 'level', level: 32, to: 'florizarre' }]
  },
  {
    id: 'florizarre',
    label: 'Florizarre',
    types: ['grass', 'poison'],
    basePower: 100,
    baseSpeed: 80,
    catchRate: 10,
    size: 'L',
    evolutions: []
  },
  {
    id: 'salameche',
    label: 'Salamèche',
    types: ['fire'],
    basePower: 52,
    baseSpeed: 65,
    catchRate: 30,
    size: 'S',
    evolutions: [{ type: 'level', level: 16, to: 'reptincel' }]
  },
  {
    id: 'reptincel',
    label: 'Reptincel',
    types: ['fire'],
    basePower: 64,
    baseSpeed: 80,
    catchRate: 20,
    size: 'M',
    evolutions: [{ type: 'level', level: 36, to: 'dracaufeu' }]
  },
  {
    id: 'dracaufeu',
    label: 'Dracaufeu',
    types: ['fire', 'flying'],
    basePower: 104,
    baseSpeed: 100,
    catchRate: 10,
    size: 'L',
    evolutions: []
  },
  {
    id: 'carapuce',
    label: 'Carapuce',
    types: ['water'],
    basePower: 48,
    baseSpeed: 43,
    catchRate: 30,
    size: 'S',
    evolutions: [{ type: 'level', level: 16, to: 'carabaffe' }]
  },
  {
    id: 'carabaffe',
    label: 'Carabaffe',
    types: ['water'],
    basePower: 63,
    baseSpeed: 58,
    catchRate: 20,
    size: 'M',
    evolutions: [{ type: 'level', level: 36, to: 'tortank' }]
  },
  {
    id: 'tortank',
    label: 'Tortank',
    types: ['water'],
    basePower: 95,
    baseSpeed: 78,
    catchRate: 10,
    size: 'L',
    evolutions: []
  },
  { id: 'nidoran-f', label: 'Nidoran♀', types: ['poison'], basePower: 47, baseSpeed: 41, catchRate: 35, size: 'S', evolutions: [] },
  { id: 'nidoran-m', label: 'Nidoran♂', types: ['poison'], basePower: 50, baseSpeed: 50, catchRate: 35, size: 'S', evolutions: [] },
  { id: 'nosferapti', label: 'Nosferapti', types: ['poison', 'flying'], basePower: 45, baseSpeed: 55, catchRate: 35, size: 'S', evolutions: [] },
  { id: 'racaillou', label: 'Racaillou', types: ['rock', 'ground'], basePower: 80, baseSpeed: 20, catchRate: 35, size: 'S', evolutions: [] },
  { id: 'hypotrempe', label: 'Hypotrempe', types: ['water'], basePower: 40, baseSpeed: 60, catchRate: 40, size: 'S', evolutions: [] },
  { id: 'magicarp', label: 'Magicarpe', types: ['water'], basePower: 10, baseSpeed: 80, catchRate: 50, size: 'M', evolutions: [] },
  { id: 'tentacool', label: 'Tentacool', types: ['water', 'poison'], basePower: 40, baseSpeed: 70, catchRate: 40, size: 'M', evolutions: [] }
]

export const zones = [
  {
    id: 'bourg-palette',
    label: 'Bourg Palette',
    type: 'city',
    pokemon: [],
    x: 100,
    y: 320
  },
  {
    id: 'jadielle',
    label: 'Jadielle',
    type: 'city',
    pokemon: [],
    x: 100,
    y: 200
  },
  {
    id: 'forest',
    label: 'Foret de Jade',
    type: 'wild',
    pokemon: ['pikachu', 'bulbizarre'],
    x: 100,
    y: 120
  },
  {
    id: 'cave',
    label: 'Mont Sélénite',
    type: 'wild',
    pokemon: ['nidoran-f', 'nidoran-m', 'nosferapti', 'racaillou'],
    x: 250,
    y: 80
  },
  {
    id: 'sea',
    label: 'Route 19',
    type: 'wild',
    pokemon: ['carapuce', 'hypotrempe', 'magicarp', 'tentacool'],
    x: 100,
    y: 400
  },
  {
    id: 'test',
    label: 'Zone TEST',
    type: 'wild',
    pokemon: ['pikachu'],
    x: 350,
    y: 200,
    fixedLevel: 1
  }
]
