# Documentation de la Logique Métier

Cette section couvre les algorithmes et la logique de jeu pure, situés principalement dans `src/renderer/src/utils/` et `src/renderer/src/hooks/`.

## 1. hook useCombat
**Chemin :** `src/renderer/src/hooks/useCombat.js`

Ce hook encapsule toute la logique d'une session de combat.

### État Interne (`combatState`)
```javascript
{
  active: false,        // Combat en cours ?
  opponent: null,       // Objet Pokémon adverse
  playerHp: 100,
  maxPlayerHp: 100,
  turn: 0,
  log: [],              // Messages textuels
  isFinished: false,
  result: null,         // 'win' ou 'lose'
  captured: false       // Résultat de la tentative de capture
}
```

### Méthodes Exportées
*   `startCombat()`: Initialise un combat contre un adversaire aléatoire de la zone sélectionnée.
*   `handleAttack()`: Exécute un tour de combat (calcul dégâts joueur -> calcul dégâts ennemi).
*   `handleFlee()`: Tente de fuir le combat.

---

## 2. Calculs de Dégâts (`utils/combatLogic.js`)
*(Note: Ce fichier peut être créé si la logique est actuellement dans le hook)*

La formule de dégâts prend en compte :
1.  **Niveau** du Pokémon attaquant.
2.  **Type** (Efficacité) :
    *   Eau 💧 > Feu 🔥
    *   Feu 🔥 > Plante 🌿
    *   Plante 🌿 > Eau 💧
    *   Électrik ⚡ > Eau 💧
3.  **Variation Aléatoire** : Une légère fluctuation pour rendre les combats moins prévisibles.

## 3. Système de Niveaux (`utils/leveling.js`)
Gère la courbe de progression.

### Fonctions
*   `getLevel(xp)`: Retourne le niveau actuel basé sur l'XP total.
    *   Utilise généralement une formule exponentielle ou quadratique (ex: `Level = sqrt(XP / CONSTANT)`).
*   `checkEvolution(speciesId, xp)`: Vérifie si le Pokémon doit évoluer à ce niveau d'XP et retourne la nouvelle speciesId si c'est le cas.

## 4. Données Statiques (`data/`)
*   **pokedex.js** : La "Base de données" de référence. Contient les stats de base, les images, les types et les chaînes d'évolution de chaque espèce.
*   **zones.js** : Définit les lieux (Forêt, Ville, Plage) et les tables de rencontre (quels Pokémon apparaissent dans quelle zone).
