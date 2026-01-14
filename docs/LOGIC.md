# Documentation de la Logique Métier

Cette section couvre les services et la logique de jeu, situés dans le **Main Process** (`src/main/`).

## 1. Architecture des Services

Toute la logique métier réside dans le Main Process pour des raisons de sécurité et de performance.

```
src/main/
├── services/
│   ├── storageService.js   # Persistance fichier
│   ├── gameService.js      # État du jeu
│   └── combatService.js    # Logique de combat
├── data/
│   └── gameData.js         # Pokédex + Zones
└── ipcHandlers.js          # Points d'entrée IPC
```

---

## 2. DatabaseService (SQLite + Drizzle)

**Chemin :** `src/main/services/databaseService.ts`

Gère toutes les interactions avec la base de données SQLite via Drizzle ORM.

### Dépendances
```bash
npm install better-sqlite3 drizzle-orm
npm install -D drizzle-kit @types/better-sqlite3
```

### Schéma (`src/main/db/schema.ts`)
```typescript
export const pokemon = sqliteTable('pokemon', {
  uuid: text('uuid').primaryKey(),
  speciesId: text('species_id').notNull(),
  xp: integer('xp').notNull().default(0),
  level: integer('level').notNull().default(1),
  dateCaught: text('date_caught').notNull(),
  isInTeam: integer('is_in_team', { mode: 'boolean' }),
  teamPosition: integer('team_position')
})

export const gameState = sqliteTable('game_state', {
  id: integer('id').primaryKey().default(1),
  activeId: text('active_id'),
  candies: integer('candies').notNull().default(10),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull()
})

export const inventory = sqliteTable('inventory', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  itemId: text('item_id').notNull().unique(),
  quantity: integer('quantity').notNull().default(0)
})
```

### Méthodes Principales

#### Pokémon
- `getAllPokemon()` : Tous les Pokémon
- `getPokemon(uuid)` : Un Pokémon
- `getTeamPokemon()` : Équipe (triée par position)
- `addPokemon(data)` : Ajoute un Pokémon
- `updatePokemon(uuid, updates)` : Met à jour

#### État du Jeu
- `getGameState()` : État global
- `updateGameState(updates)` : Modifie l'état
- `setActiveId(uuid)` : Change le Pokémon actif

#### Ressources
- `getCandies()` / `addCandies(n)` / `spendCandies(n)`
- `getInventory()` / `addItem(id, qty)` / `useItem(id)`


Gère l'état global du jeu.

### État Géré
```javascript
{
  ownedPokemon: [{ uuid, speciesId, xp, level, dateCaught }],
  teamIds: ['uuid1', 'uuid2', 'uuid3'],
  activeId: 'uuid1',
  candies: 10,
  inventory: { 'pierre-foudre': 1 }
}
```

### Méthodes Principales

#### Pokémon
- `getPokemon(uuid)` : Récupère un Pokémon
- `getActivePokemon()` : Récupère le Pokémon actif
- `updatePokemon(uuid, updates)` : Met à jour un Pokémon
- `addPokemon(speciesId, level)` : Ajoute un nouveau Pokémon

#### Équipe
- `setActiveId(id)` : Change le Pokémon actif
- `setTeamIds(ids)` : Modifie l'équipe (max 3)

#### Ressources
- `addCandies(amount)` / `spendCandies(amount)`
- `addItem(itemId, qty)` / `useItem(itemId)`

#### XP & Évolution
- `giveXp(uuid, amount)` : Donne de l'XP et gère les évolutions
- `useCandy()` : Utilise un bonbon sur le Pokémon actif

---

## 4. CombatService

**Chemin :** `src/main/services/combatService.js`

Gère toute la logique de combat.

### Table des Types
```javascript
typeChart = {
  fire: { strengths: ['grass', 'ice'], weaknesses: ['water', 'rock'] },
  water: { strengths: ['fire', 'rock'], weaknesses: ['electric', 'grass'] },
  // ... (17 types au total)
}
```

### Méthodes Principales

#### `startCombat(activeId, zoneId)`
Initialise un combat contre un adversaire aléatoire.

**Retourne :**
```javascript
{
  playerId: 'uuid',
  player: { label, level, types, basePower },
  opponent: { speciesId, label, level, hp, maxHp, catchRate },
  playerHp: 60,
  maxPlayerHp: 60,
  turn: 'player' | 'opponent',
  log: ['Un Pikachu sauvage apparaît !'],
  isFinished: false,
  result: null
}
```

#### `executeTurn(combatState)`
Exécute un tour de combat et retourne le nouvel état.

#### `flee(combatState)`
Fuite du combat.

#### `finishCombat(combatState)`
Distribue les récompenses (XP, bonbons, capture).

### Formule de Dégâts
```javascript
damage = floor(basePower * 0.5 * (level/10) * STAB * effectiveness * random)
```
- **STAB** : 1.5 (bonus de type)
- **Effectiveness** : 0 / 0.5 / 1 / 2 (immunité, résistance, neutre, super efficace)
- **Random** : 0.85 - 1.00

---

## 5. Données Statiques

**Chemin :** `src/main/data/gameData.js`

### Pokédex
```javascript
{
  id: 'pikachu',
  label: 'Pikachu',
  types: ['electric'],
  basePower: 55,
  baseSpeed: 90,
  catchRate: 40,
  evolutions: [{ type: 'item', item: 'pierre-foudre', to: 'raichu' }]
}
```

### Zones
```javascript
{
  id: 'forest',
  label: 'Forêt de Jadielle',
  type: 'wild',
  pokemon: ['pikachu', 'bulbizarre']
}
```

---

## 6. IPC Handlers

**Chemin :** `src/main/ipcHandlers.js`

Expose les services au Renderer via IPC.

### Canaux Disponibles
| Canal | Service | Méthode |
|-------|---------|---------|
| `game:getState` | GameService | `getState()` |
| `game:setActiveId` | GameService | `setActiveId(id)` |
| `game:updatePokemon` | GameService | `updatePokemon(uuid, updates)` |
| `game:useCandy` | GameService | `useCandy()` |
| `combat:start` | CombatService | `startCombat(activeId, zoneId)` |
| `combat:attack` | CombatService | `executeTurn(state)` |
| `combat:finish` | CombatService | `finishCombat(state)` |
| `shop:buyStone` | GameService | (custom handler) |
| `data:getPokedex` | - | Retourne `pokedex` |
| `data:getZones` | - | Retourne `zones` |
