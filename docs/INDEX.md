# Documentation de l'Application Pokémon Electron

## 1. Introduction
Ce projet est une application de type "Idle Game / Widget" Pokémon développée avec **Electron**, **React**, et **Vite**. L'application est conçue pour être minimaliste, transparente et flotter sur le bureau de l'utilisateur pendant qu'il travaille.

## 2. Architecture Technique

### Architecture IPC (Inter-Process Communication)
L'application utilise une architecture **Main Process / Renderer Process** avec communication IPC pour séparer la logique métier de l'interface utilisateur.

```
┌─────────────────────────────────────────────────────────────────┐
│                      MAIN PROCESS (Node.js)                     │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  GameService    │  │  StorageService │  │  CombatService  │  │
│  │  (État global)  │  │  (Persistence)  │  │  (Calculs)      │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│                         IPC Handlers                            │
│                          (ipcMain)                              │
└────────────────────────────────┬────────────────────────────────┘
                                 │ IPC (invoke/handle)
┌────────────────────────────────┴────────────────────────────────┐
│                       PRELOAD (Bridge)                          │
│   window.gameAPI = { getState, startCombat, attack, ... }       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────┴────────────────────────────────┐
│                    RENDERER PROCESS (React)                     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              GameContext (Client léger IPC)               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │    Widget.jsx   │  │  CombatScreen   │  │  SelectionScreen│  │
│  │    (UI only)    │  │    (UI only)    │  │    (UI only)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Structure du Projet

```
src/
├── main/                          # BACKEND (Node.js)
│   ├── index.js                   # Point d'entrée, initialisation
│   ├── ipcHandlers.js             # Handlers IPC (game:*, combat:*, shop:*)
│   ├── data/
│   │   └── gameData.js            # Pokédex et Zones (source unique)
│   └── services/
│       ├── storageService.js      # Persistance fichier JSON
│       ├── gameService.js         # État du jeu (équipe, inventaire, XP)
│       └── combatService.js       # Logique de combat
│
├── preload/
│   └── index.js                   # Bridge sécurisé (window.api, window.gameAPI)
│
└── renderer/src/                  # FRONTEND (React - UI seulement)
    ├── contexts/
    │   └── GameContext.jsx        # Client léger IPC
    ├── hooks/
    │   └── useCombat.js           # Hook combat utilisant IPC
    ├── features/
    │   ├── Core/                  # Widget, Timer
    │   ├── Combat/                # CombatScreen
    │   └── Pokemon/               # PokemonDisplay, Team, SelectionScreen
    └── assets/                    # Images, CSS global
```

### Flux de Données

1. **Renderer** appelle `window.gameAPI.getState()` via IPC
2. **Preload** transmet l'appel via `ipcRenderer.invoke('game:getState')`
3. **Main Process** exécute `gameService.getState()` et retourne le résultat
4. **Renderer** reçoit l'état et met à jour l'UI

### Gestion de l'État
L'état est **stocké dans le Main Process** et persisté dans une base de données SQLite (`userData/pokemon-game.db`) via Drizzle ORM.

Le `GameContext` dans le Renderer est un **client léger** qui :
- Charge l'état initial via `window.gameAPI.getState()`
- Écoute les changements via `window.gameAPI.onStateChange()`
- Expose des wrappers autour des appels IPC

## 3. Fonctionnalités Principales

### Mode Aventure (Pomodoro)
- L'utilisateur lance un timer basé sur la méthode Pomodoro.
- À la fin du timer, un combat automatique se déclenche.
- Les combats sont gérés entièrement dans le **Main Process**.

### Système de Combat
- Combats au tour par tour via `CombatService`.
- Calcul des dégâts basé sur les types (table d'efficacité complète).
- Récompenses (XP, bonbons, capture) distribuées via IPC.

### Persistance
- **SQLite (better-sqlite3)** dans `app.getPath('userData')`.
- Pas de `localStorage` (plus sécurisé, pas de limite de taille).
- Synchronisation multi-fenêtres via IPC natif.

## 4. API IPC Disponibles

### Game State
```javascript
window.gameAPI.getState()              // Retourne l'état complet
window.gameAPI.setActiveId(id)         // Change le Pokémon actif
window.gameAPI.setTeamIds([...])       // Modifie l'équipe
```

### Combat
```javascript
window.gameAPI.startCombat(activeId, zoneId)
window.gameAPI.attack(combatState)
window.gameAPI.flee(combatState)
window.gameAPI.finishCombat(combatState)
```

### Resources
```javascript
window.gameAPI.useCandy()              // Utilise un bonbon
window.gameAPI.addCandies(amount)
window.gameAPI.buyStone()              // Achète une pierre
```

## 5. Commandes Utiles
- `npm run dev` : Lance l'application en développement
- `npm run build` : Construit pour la production

## 6. Dépendances Principales
- `electron` / `@electron-toolkit/utils`
- `react` / `react-dom`
- `vite` / `electron-vite`
- `tailwindcss`
- `uuid`
