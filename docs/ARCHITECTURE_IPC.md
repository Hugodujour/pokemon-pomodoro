# Architecture IPC - Plan de Refactoring

## 1. Problème Actuel - ✅ RÉSOLU (Migration TS Complete)

L'application a été entièrement migrée vers **TypeScript** pour assurer une robustesse maximale et une meilleure maintenabilité.
La séparation entre Main et Renderer est strictement maintenue via IPC.

## 2. Architecture Cible (Full TypeScript)

```
┌─────────────────────────────────────────────────────────────────┐
│                      MAIN PROCESS (Typescript)                  │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  GameService    │  │ DatabaseService │  │  CombatService  │  │
│  │  (État global)  │  │ (Persistence)   │  │  (Calculs)      │  │
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
│                       PRELOAD (Bridge - TS)                     │
│                                                                 │
│   contextBridge.exposeInMainWorld('gameAPI', { ... })           │
│                                                                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │
┌────────────────────────────────┴────────────────────────────────┐
│                    RENDERER PROCESS (React TSX)                 │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Widget.tsx    │  │  CombatScreen.tsx│  │SelectionScreen.ts│  │
│  │    (UI only)    │  │    (UI only)    │  │    (UI only)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              GameContext (Thin Client Layer)               │  │
│  │  - Appelle window.gameAPI.* pour toutes les opérations     │  │
│  │  - Fortement typé via interface GameState et Pokemon      │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 3. Services Main Process (TypeScript)

### 3.1 GameService (`src/main/services/gameService.ts`)
Gère l'état global du jeu en mémoire et coordonne avec la DB.

### 3.2 DatabaseService (`src/main/services/databaseService.ts`)
Gère la persistance via **Drizzle ORM** et **SQLite**. Remplace l'ancien `StorageService`.

### 3.3 CombatService (`src/main/services/combatService.ts`)
Gère la logique de combat pure.

## 4. IPC Handlers (`src/main/ipcHandlers.ts`)
Centralise tous les points d'entrée IPC.

## 5. Preload Bridge (`src/preload/index.ts`)
Définit et expose les APIs au Renderer. Accompagné de `env.d.ts` pour le typage global de `window`.

## 6. Logiciel Renderer (React TSX)
Tous les composants sont maintenant en `.tsx`, utilisant les types définis dans `src/renderer/src/types/index.ts`.

## 7. Migration TypeScript - ✅ TERMINÉE

L'application ne contient plus aucun fichier `.js` ou `.jsx` dans le dossier `src`.
Toute la logique est typée, ce qui évite de nombreuses erreurs à l'exécution, notamment lors de la communication IPC.

### Structure Finale des Fichiers (TypeScript)

### Main Process (Backend)
```
src/main/
├── index.ts                 # Point d'entrée, initialisation
├── ipcHandlers.ts           # Handlers IPC typés
├── db/
│   ├── schema.ts            # Schéma Drizzle
│   └── index.ts             # Connexion DB
├── data/
│   └── gameData.ts          # Pokedex et Zones
└── services/
    ├── databaseService.ts   # Persistance SQL
    ├── gameService.ts       # État du jeu
    └── combatService.ts     # Logique de combat
```

### Preload (Bridge)
```
src/preload/
└── index.ts                 # Expose window.gameAPI
```

### Renderer (Frontend - UI Only)
```
src/renderer/src/
├── types/
│   └── index.ts             # Interfaces partagées (GameState, Pokemon, etc.)
├── env.d.ts                 # Typage global de window
├── contexts/
│   └── GameContext.tsx      # Client typé IPC
├── hooks/
│   └── useCombat.ts         # Hook combat typé
├── features/
│   ├── Core/
│   │   └── Widget/          # Widget .tsx
│   ├── Combat/
│   │   └── CombatScreen/    # Écran de combat .tsx
│   └── Pokemon/
│       ├── PokemonDisplay/
│       ├── SelectionScreen/
│       ├── Team/
│       └── StorageSystem/
└── main.tsx                 # Entry point
```
