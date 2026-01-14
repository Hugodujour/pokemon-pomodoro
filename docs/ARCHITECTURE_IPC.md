# Architecture IPC - Plan de Refactoring

## 1. Problème Actuel

Actuellement, **toute la logique métier** (gestion d'état, persistance, calculs de combat) réside dans le processus **Renderer** (React). Cela pose plusieurs problèmes :

*   **Sécurité** : Le Renderer a accès direct au `localStorage` et pourrait potentiellement être manipulé.
*   **Performance** : Les calculs lourds bloquent l'UI.
*   **Scalabilité** : Difficile d'ajouter des fonctionnalités comme la sauvegarde cloud ou la synchronisation multi-fenêtres.
*   **Séparation des préoccupations** : L'UI est couplée à la logique métier.

## 2. Architecture Cible

```
┌─────────────────────────────────────────────────────────────────┐
│                      MAIN PROCESS (Node.js)                     │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  GameService    │  │  StorageService │  │  CombatService  │  │
│  │  (État global)  │  │  (Persistence)  │  │  (Calculs)      │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                │
│                         IPC Handlers                            │
│                          (ipcMain)                              │
└────────────────────────────────┬────────────────────────────────┘
                                 │ IPC (invoke/handle)
                                 │
┌────────────────────────────────┴────────────────────────────────┐
│                       PRELOAD (Bridge)                          │
│                                                                 │
│   contextBridge.exposeInMainWorld('gameAPI', { ... })           │
│                                                                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────┴────────────────────────────────┐
│                    RENDERER PROCESS (React)                     │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │    Widget.jsx   │  │  CombatScreen   │  │  SelectionScreen│  │
│  │    (UI only)    │  │    (UI only)    │  │    (UI only)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              GameContext (Thin Client Layer)               │  │
│  │  - Appelle window.gameAPI.* pour toutes les opérations     │  │
│  │  - Maintient un cache local de l'état pour l'UI            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Services Main Process

### 3.1 GameService (`src/main/services/gameService.js`)
Gère l'état global du jeu.

```javascript
// Exemple de structure
class GameService {
  constructor(storageService) {
    this.storage = storageService;
    this.state = this.storage.load('gameState') || this.getDefaultState();
  }

  getDefaultState() {
    return {
      ownedPokemon: [/* starter */],
      teamIds: [],
      activeId: null,
      candies: 0,
      inventory: {}
    };
  }

  getState() { return this.state; }
  
  updatePokemon(uuid, updates) {
    const idx = this.state.ownedPokemon.findIndex(p => p.uuid === uuid);
    if (idx !== -1) {
      this.state.ownedPokemon[idx] = { ...this.state.ownedPokemon[idx], ...updates };
      this.persist();
    }
    return this.state.ownedPokemon[idx];
  }

  addCandy(amount) {
    this.state.candies += amount;
    this.persist();
    return this.state.candies;
  }

  persist() {
    this.storage.save('gameState', this.state);
  }
}
```

### 3.2 StorageService (`src/main/services/storageService.js`)
Gère la persistance des données (fichier JSON, SQLite, ou autre).

```javascript
const fs = require('fs');
const path = require('path');

class StorageService {
  constructor(userDataPath) {
    this.filePath = path.join(userDataPath, 'game-data.json');
  }

  load(key) {
    try {
      const data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
      return data[key];
    } catch { return null; }
  }

  save(key, value) {
    let data = {};
    try { data = JSON.parse(fs.readFileSync(this.filePath, 'utf-8')); } catch {}
    data[key] = value;
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }
}
```

### 3.3 CombatService (`src/main/services/combatService.js`)
Gère la logique de combat pure.

```javascript
class CombatService {
  constructor(gameService, pokedexData, zonesData) {
    this.game = gameService;
    this.pokedex = pokedexData;
    this.zones = zonesData;
  }

  startCombat(activeId, zoneId) {
    const player = this.game.getState().ownedPokemon.find(p => p.uuid === activeId);
    const zone = this.zones.find(z => z.id === zoneId);
    const opponent = this.generateOpponent(zone);
    return {
      player: this.prepareFighter(player),
      opponent,
      log: [],
      turn: 0
    };
  }

  executeTurn(combatState) {
    // Logique de tour de combat...
    return updatedCombatState;
  }

  generateOpponent(zone) { /* ... */ }
  prepareFighter(pokemon) { /* ... */ }
  calculateDamage(attacker, defender) { /* ... */ }
}
```

## 4. IPC Handlers (`src/main/ipcHandlers.js`)

```javascript
const { ipcMain } = require('electron');

function setupIpcHandlers(gameService, combatService) {
  // --- GAME STATE ---
  ipcMain.handle('game:getState', () => gameService.getState());
  
  ipcMain.handle('game:updatePokemon', (_, uuid, updates) => 
    gameService.updatePokemon(uuid, updates));
  
  ipcMain.handle('game:addCandy', (_, amount) => 
    gameService.addCandy(amount));
  
  ipcMain.handle('game:setActiveId', (_, id) => 
    gameService.setActiveId(id));

  // --- COMBAT ---
  ipcMain.handle('combat:start', (_, activeId, zoneId) => 
    combatService.startCombat(activeId, zoneId));
  
  ipcMain.handle('combat:attack', (_, combatState) => 
    combatService.executeTurn(combatState));
  
  ipcMain.handle('combat:flee', (_, combatState) => 
    combatService.attemptFlee(combatState));

  // --- INVENTORY ---
  ipcMain.handle('inventory:buyItem', (_, itemId, cost) => 
    gameService.buyItem(itemId, cost));
  
  ipcMain.handle('inventory:useItem', (_, itemId, targetUuid) => 
    gameService.useItem(itemId, targetUuid));
}

module.exports = { setupIpcHandlers };
```

## 5. Preload Bridge (`src/preload/index.js`)

```javascript
const { contextBridge, ipcRenderer } = require('electron');

const gameAPI = {
  // Game State
  getState: () => ipcRenderer.invoke('game:getState'),
  updatePokemon: (uuid, updates) => ipcRenderer.invoke('game:updatePokemon', uuid, updates),
  addCandy: (amount) => ipcRenderer.invoke('game:addCandy', amount),
  setActiveId: (id) => ipcRenderer.invoke('game:setActiveId', id),

  // Combat
  startCombat: (activeId, zoneId) => ipcRenderer.invoke('combat:start', activeId, zoneId),
  attack: (combatState) => ipcRenderer.invoke('combat:attack', combatState),
  flee: (combatState) => ipcRenderer.invoke('combat:flee', combatState),

  // Inventory
  buyItem: (itemId, cost) => ipcRenderer.invoke('inventory:buyItem', itemId, cost),
  useItem: (itemId, targetUuid) => ipcRenderer.invoke('inventory:useItem', itemId, targetUuid),

  // Events (Main -> Renderer)
  onStateChange: (callback) => {
    const handler = (_, newState) => callback(newState);
    ipcRenderer.on('game:stateChanged', handler);
    return () => ipcRenderer.removeListener('game:stateChanged', handler);
  }
};

contextBridge.exposeInMainWorld('gameAPI', gameAPI);
```

## 6. GameContext Refactorisé (`src/renderer/src/contexts/GameContext.jsx`)

```jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Charger l'état initial depuis le Main process
  useEffect(() => {
    window.gameAPI.getState().then(initialState => {
      setState(initialState);
      setLoading(false);
    });

    // Écouter les changements d'état venant du Main
    const unsubscribe = window.gameAPI.onStateChange(newState => {
      setState(newState);
    });

    return unsubscribe;
  }, []);

  // Wrapper pour les actions : appelle l'API et met à jour le state local
  const updatePokemon = useCallback(async (uuid, updates) => {
    const updatedPokemon = await window.gameAPI.updatePokemon(uuid, updates);
    setState(prev => ({
      ...prev,
      ownedPokemon: prev.ownedPokemon.map(p => 
        p.uuid === uuid ? updatedPokemon : p
      )
    }));
  }, []);

  const addCandy = useCallback(async (amount) => {
    const newTotal = await window.gameAPI.addCandy(amount);
    setState(prev => ({ ...prev, candies: newTotal }));
  }, []);

  // ... autres actions

  if (loading) return <div>Loading...</div>;

  return (
    <GameContext.Provider value={{ 
      ...state, 
      updatePokemon, 
      addCandy,
      // ... autres actions
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
```

## 7. Avantages de cette Architecture

| Aspect | Avant | Après |
|--------|-------|-------|
| **Sécurité** | localStorage exposé | Données dans le Main process, inaccessibles au renderer |
| **Performance** | Calculs dans l'UI thread | Calculs dans le Main process (Node.js) |
| **Testabilité** | Difficile à tester | Services isolés, facilement testables unitairement |
| **Persistance** | localStorage (5MB limite) | Fichier JSON ou SQLite (illimité) |
| **Sync Multi-fenêtres** | Événements localStorage | IPC natif, fiable et performant |
| **Évolutivité** | Couplage fort | Services découplés, faciles à étendre |

## 8. Plan de Migration (Étapes) - ✅ COMPLÉTÉ

1. **Phase 1 - Services Main** ✅
   - [x] Créer `src/main/services/storageService.js`
   - [x] Créer `src/main/services/gameService.js`
   - [x] Créer `src/main/services/combatService.js`
   - [x] Migrer les données statiques (`pokedex.js`, `zones.js`) vers le Main

2. **Phase 2 - IPC Handlers** ✅
   - [x] Créer `src/main/ipcHandlers.js`
   - [x] Mettre à jour `src/main/index.js` pour initialiser les services et handlers

3. **Phase 3 - Preload** ✅
   - [x] Étendre `src/preload/index.js` avec la nouvelle `gameAPI`

4. **Phase 4 - Renderer** ✅
   - [x] Refactoriser `GameContext.jsx` pour utiliser `window.gameAPI`
   - [x] Supprimer les accès directs au `localStorage`
   - [x] Mettre à jour `useCombat.js` pour appeler `window.gameAPI.startCombat()`, etc.

5. **Phase 5 - Nettoyage** ✅
   - [x] Supprimer les fichiers de logique métier du Renderer (`utils/combatLogic.js`, `utils/leveling.js`)
   - [x] Supprimer les données dupliquées (`data/pokedex.js`, `data/zones.js`)
   - [x] Mettre à jour la documentation

## 9. Structure Finale des Fichiers

### Main Process (Backend)
```
src/main/
├── index.js                 # Point d'entrée, initialisation des services
├── ipcHandlers.js           # Tous les handlers IPC
├── data/
│   └── gameData.js          # Pokedex et Zones (source unique)
└── services/
    ├── storageService.js    # Persistance fichier JSON
    ├── gameService.js       # État du jeu (équipe, inventaire, XP)
    └── combatService.js     # Logique de combat
```

### Preload (Bridge)
```
src/preload/
└── index.js                 # Expose window.api et window.gameAPI
```

### Renderer (Frontend - UI Only)
```
src/renderer/src/
├── contexts/
│   └── GameContext.jsx      # Client léger IPC
├── hooks/
│   └── useCombat.js         # Hook combat utilisant IPC
├── features/
│   ├── Core/
│   │   └── Widget/          # Widget principal
│   ├── Combat/
│   │   └── CombatScreen/    # Écran de combat
│   └── Pokemon/
│       ├── PokemonDisplay/
│       ├── SelectionScreen/
│       ├── Team/
│       └── StorageSystem/
└── utils/
    └── candyTimer.js        # Timer local (UI seulement)
```
