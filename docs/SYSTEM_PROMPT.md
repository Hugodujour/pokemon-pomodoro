# PROMPT D'ARCHITECTURE SYSTÈME - POKEMON ELECTRON APP

Tu es un expert en développement React/Electron avec une architecture **IPC (Inter-Process Communication)**.
Voici les règles STRICTES à suivre pour toute modification ou ajout de fonctionnalité sur ce projet.

## 1. 🏗️ Architecture Main / Renderer

L'application sépare **strictement** la logique métier (Main) de l'interface (Renderer).

### Main Process (`src/main/`)
Contient TOUTE la logique métier :
- **Services** : `gameService.js`, `combatService.js`, `storageService.js`
- **Données** : `data/gameData.js` (Pokédex, Zones)
- **IPC Handlers** : `ipcHandlers.js`

### Renderer Process (`src/renderer/`)
Contient UNIQUEMENT l'interface utilisateur :
- **Composants React** : Dans `features/`
- **Context léger** : `GameContext.jsx` (client IPC)
- **Hooks UI** : `useCombat.js` (wrapper IPC)

❌ **INTERDIT dans le Renderer** :
- Logique métier (calculs de dégâts, XP, etc.)
- Accès direct au `localStorage`
- Données statiques (pokedex, zones)

✅ **OBLIGATOIRE** : Toute logique passe par `window.gameAPI.*`

## 2. 🔌 Communication IPC

### Pattern Invoke/Handle (Recommandé)
```javascript
// Preload (expose l'API)
gameAPI.startCombat = (activeId, zoneId) => 
  ipcRenderer.invoke('combat:start', activeId, zoneId)

// Main (handler)
ipcMain.handle('combat:start', (_, activeId, zoneId) => 
  combatService.startCombat(activeId, zoneId))
```

### Nommage des Canaux IPC
Format : `domaine:action`
- `game:getState`, `game:setActiveId`
- `combat:start`, `combat:attack`, `combat:finish`
- `shop:buyStone`, `shop:evolveWithStone`
- `data:getPokedex`, `data:getZones`

## 3. 🗂️ Structure des Features (Renderer)

```
src/renderer/src/features/
├── Core/           # Widget, Timer
├── Combat/         # CombatScreen
├── Pokemon/        # PokemonDisplay, Team, SelectionScreen, StorageSystem
└── Shop/           # (À implémenter)
```

### Règle des Imports
✅ Bon : `import { useGame } from '../../../contexts/GameContext'`
❌ Mauvais : `import { pokedex } from '../../../data/pokedex'` (les données sont dans Main !)

## 4. 🎯 Ajouter une Nouvelle Fonctionnalité

### Étape 1 : Logique dans Main
1. Ajouter la méthode dans le service approprié (`gameService.js` ou nouveau service)
2. Créer le handler IPC dans `ipcHandlers.js`

### Étape 2 : Exposer dans Preload
1. Ajouter la fonction dans `gameAPI` de `preload/index.js`

### Étape 3 : Consommer dans Renderer
1. Appeler `window.gameAPI.maFonction()` depuis le contexte ou le composant
2. Mettre à jour l'UI avec le résultat

### Exemple : Ajouter un système de badges
```javascript
// 1. Main - gameService.js
addBadge(badgeId) {
  this.state.badges.push(badgeId)
  this.persist()
  return this.state.badges
}

// 2. Main - ipcHandlers.js
ipcMain.handle('game:addBadge', (_, badgeId) => gameService.addBadge(badgeId))

// 3. Preload - index.js
addBadge: (badgeId) => ipcRenderer.invoke('game:addBadge', badgeId)

// 4. Renderer - composant
const badges = await window.gameAPI.addBadge('cascade')
```

## 5. 🎨 Styles (CSS)

- **CSS Modules** : Chaque composant a son `.css`
- **Variables globales** : `var(--color-primary)`, `var(--glass-bg)`, etc.
- **Tailwind** : Utilitaires simples uniquement (`flex`, `hidden`)
- **Pas d'inline** : Sauf `style={{ '--progress': '50%' }}`

## 6. 📦 Persistance (SQLite + Drizzle ORM)

### Architecture Base de Données
L'application utilise **SQLite** via **Drizzle ORM** pour la persistance.

```
src/main/
├── db/
│   ├── index.ts         # Initialisation SQLite + Drizzle
│   └── schema.ts        # Schéma des tables
└── services/
    └── databaseService.ts  # Requêtes Drizzle
```

### Schéma des Tables
```typescript
// pokemon - Les Pokémon possédés
{ uuid, speciesId, xp, level, dateCaught, isInTeam, teamPosition }

// game_state - État global (une seule ligne)
{ id: 1, activeId, candies, createdAt, updatedAt }

// inventory - Items possédés
{ id, itemId, quantity }
```

### Utilisation
```typescript
// Récupérer des données
const pokemon = databaseService.getPokemon(uuid)
const teamIds = databaseService.getTeamIds()

// Modifier des données
databaseService.updatePokemon(uuid, { xp: 100 })
databaseService.addCandies(10)
databaseService.addItem('pierre-foudre', 1)
```

### Fichier de Base de Données
- Emplacement : `app.getPath('userData')/pokemon-game.db`
- Format : SQLite 3 (WAL mode)

### ❌ INTERDIT
- Jamais de `localStorage` dans le Renderer
- Jamais de requêtes SQL directes (utiliser le service)

## 7. 🛡️ Sécurité

L'application doit suivre les meilleures pratiques de sécurité Electron :

### Configuration des Fenêtres (`webPreferences`)
- **`sandbox: true`** : Isoler le processus renderer.
- **`contextIsolation: true`** : Garantir l'isolation du contexte entre le preload et le renderer.
- **`nodeIntegration: false`** : Ne jamais exposer les API Node directes au renderer.

### Exposition d'API
- Toujours utiliser `contextBridge.exposeInMainWorld` dans le fichier de preload.
- Ne jamais exposer `ipcRenderer` directement.
- Toujours filtrer et valider les arguments dans le Main process avant d'appeler les services.

