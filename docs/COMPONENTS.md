# Documentation des Composants (UI)

Cette section détaille les principaux composants d'interface utilisateur (UI) de l'application.

## 1. Widget Component
**Chemin :** `src/renderer/src/features/Core/Widget/Widget.jsx`

Le composant racine de l'interface "overlay".

### Props
Aucune (utilise `useGame` context).

### Responsabilités
*   Affichage du Pokémon actif.
*   Affichage du Timer Pomodoro.
*   Boutons de contrôle (Lancer Aventure, Boutique, Changement de Zone).
*   Gestion des modales (Boutique).
*   Conteneur pour `CombatScreen` lorsque le combat est actif.

---

## 2. CombatScreen
**Chemin :** `src/renderer/src/features/Combat/CombatScreen/CombatScreen.jsx`

L'écran de combat qui se superpose au widget.

### Props Importantes
*   `playerPokemon` (Object): Données du Pokémon joueur.
*   `opponentPokemon` (Object): Données du Pokémon ennemi.
*   `playerHp` / `maxPlayerHp` (Number): Points de vie joueur.
*   `opponentHp` / `maxOpponentHp` (Number): Points de vie ennemi.
*   `log` (Array): Historique des actions du combat.
*   `result` ('win' | 'lose' | null): Résultat du combat.

### Fonctionnement
Utilise des `useEffect` pour surveiller le log de combat et déclencher des animations CSS (`anim-attack-player`, `anim-attack-opponent`) en conséquence. Gère également la séquence de victoire (lancer de Pokéball).

---

## 3. PokemonDisplay
**Chemin :** `src/renderer/src/features/Pokemon/PokemonDisplay/PokemonDisplay.jsx`

Affiche le sprite du Pokémon actif et sa barre de progression.

### Props
*   `name` (String): Nom de l'espèce (ex: 'pikachu').
*   `xp` (Number): Expérience actuelle.
*   `isAdventureRunning` (Bool): Si true, la barre affiche le temps restant au lieu de l'XP.

### Styles Dynamiques
Utilise la variable CSS `--progress` injectée via le style inline pour animer la largeur de la barre de vie/XP de manière fluide et performante.

---

## 4. SelectionScreen
**Chemin :** `src/renderer/src/features/Pokemon/SelectionScreen/SelectionScreen.jsx`

Une fenêtre Electron séparée pour la gestion d'équipe.

### Fonctionnalités
*   Affichage de l'équipe actuelle (max 3 Pokémon).
*   Accès au stockage PC (liste complète des Pokémon capturés).
*   Mécanisme de Drag & Drop (implémenté via des clics "Sélectionner" / "Déposer" pour l'instant).
*   Synchronisation en temps réel avec le Widget principal via `localStorage` events.
