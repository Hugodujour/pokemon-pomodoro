# Documentation des Composants (UI)

Cette section détaille les composants d'interface utilisateur du **Renderer Process**.
Ces composants sont **purement visuels** et appellent `window.gameAPI` pour toute logique.

## 1. Widget Component

**Chemin :** `src/renderer/src/features/Core/Widget/Widget.jsx`

Le composant racine de l'interface "overlay".

### Contexte Utilisé
```javascript
const { 
  ownedPokemon, activeId, candies, inventory,
  pokedex, zones, getActiveInstance, refreshState, useCandy
} = useGame()
```

### Responsabilités
- Affichage du Pokémon actif via `PokemonDisplay`
- Affichage du Timer Pomodoro
- Boutons de contrôle (Aventure, Boutique, Zone)
- Conteneur pour `CombatScreen` pendant les combats
- Gestion des modales (Boutique)

### Actions IPC
- `window.gameAPI.buyStone()` - Achat de pierre
- `window.gameAPI.evolveWithStone()` - Évolution
- Hook `useCombat` pour la gestion des combats

---

## 2. CombatScreen

**Chemin :** `src/renderer/src/features/Combat/CombatScreen/CombatScreen.jsx`

L'écran de combat en overlay.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `playerPokemon` | Object | `{ label, level, speciesId }` |
| `opponentPokemon` | Object | Données de l'adversaire |
| `playerHp` / `maxPlayerHp` | Number | Points de vie joueur |
| `opponentHp` / `maxOpponentHp` | Number | Points de vie ennemi |
| `log` | Array | Historique des actions |
| `onAttack` | Function | Callback IPC pour attaquer |
| `onFlee` | Function | Callback IPC pour fuir |
| `onClose` | Function | Ferme le combat |
| `result` | 'win' \| 'loss' \| 'flee' | Résultat final |
| `captured` | Boolean | Pokémon capturé ? |

### Animations
- `anim-attack-player` / `anim-attack-opponent` : Attaque
- `anim-ko` : KO (rotation)
- Séquence de capture (Pokéball)

---

## 3. PokemonDisplay

**Chemin :** `src/renderer/src/features/Pokemon/PokemonDisplay/PokemonDisplay.jsx`

Affiche le sprite et la barre de progression.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `name` | String | ID de l'espèce (ex: 'pikachu') |
| `xp` | Number | Expérience actuelle |
| `isAdventureRunning` | Boolean | Mode timer actif ? |
| `timerState` | Object | `{ current, total }` |

### Logique Locale
Contient une fonction `getLevel(xp)` inline pour l'affichage du niveau et de la barre XP.
(La logique principale de leveling est dans le Main process)

### Animation d'Évolution
Utilise des classes CSS `anim-evo-out` et `anim-evo-in` pour l'effet de transformation.

---

## 4. SelectionScreen

**Chemin :** `src/renderer/src/features/Pokemon/SelectionScreen/SelectionScreen.jsx`

Fenêtre Electron séparée pour la gestion d'équipe.

### Fonctionnalités
- Affichage de l'équipe (max 3 Pokémon)
- Composant `Team` pour la sélection
- Composant `StorageSystem` pour le PC
- Synchronisation IPC avec le Widget principal

### Actions IPC
```javascript
await setActiveId(id)           // Change le Pokémon actif
await setTeamIds([...])         // Modifie l'équipe
window.api.selectPokemon(id)    // Notifie le Widget
```

---

## 5. Team

**Chemin :** `src/renderer/src/features/Pokemon/Team/Team.jsx`

Affiche les slots d'équipe (max 3).

### Props
| Prop | Type | Description |
|------|------|-------------|
| `team` | Array | Liste des Pokémon `{ uuid, label, level }` |
| `activeId` | String | UUID du Pokémon actif |
| `onSelect` | Function | Callback de sélection |
| `onRemove` | Function | Callback de retrait (optionnel) |

---

## 6. StorageSystem

**Chemin :** `src/renderer/src/features/Pokemon/StorageSystem/StorageSystem.jsx`

Grille de stockage PC.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `storedPokemon` | Array | Pokémon hors équipe |
| `onWithdraw` | Function | Callback pour retirer du PC |
| `visible` | Boolean | Afficher le composant ? |

---

## 7. Timer

**Chemin :** `src/renderer/src/features/Core/Timer/Timer.jsx`

Composant Timer avec imperative handle.

### Ref API
```javascript
timerRef.current.start()    // Démarre le timer
timerRef.current.reset()    // Reset à la durée initiale
timerRef.current.pause()    // Met en pause
```

### Props
| Prop | Type | Description |
|------|------|-------------|
| `initialDuration` | Number | Durée en secondes |
| `onFinish` | Function | Callback fin de timer |
| `onTick` | Function | Callback chaque seconde |
| `onUpdate` | Function | `(remaining, total) => {}` |

---

## 8. GameContext

**Chemin :** `src/renderer/src/contexts/GameContext.jsx`

Client léger IPC pour l'état du jeu.

### Hook `useGame()`
```javascript
const {
  // État (read-only, miroir du Main)
  ownedPokemon, teamIds, activeId, candies, inventory,
  
  // Données statiques
  pokedex, zones,
  
  // Actions (wrappers IPC)
  setActiveId, setTeamIds, useCandy, addCandies,
  updatePokemon, refreshState,
  
  // Helpers
  getActiveInstance
} = useGame()
```

### Pattern d'Utilisation
Toute action **mute** l'état via IPC, puis `refreshState()` recharge depuis le Main.

---

## 9. useCombat Hook

**Chemin :** `src/renderer/src/hooks/useCombat.js`

Hook pour gérer les combats via IPC.

### Retour
```javascript
const { combatState, startCombat, handleAttack, handleFlee, closeCombat } = useCombat({
  activeId,
  busyPokemonId,
  selectedZone,
  refreshState
})
```

### Flow
1. `startCombat()` → `window.gameAPI.startCombat()`
2. `handleAttack()` → `window.gameAPI.attack(combatState)`
3. `closeCombat()` → `window.gameAPI.finishCombat()` + reset local
