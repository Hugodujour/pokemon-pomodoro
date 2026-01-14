# Documentation de l'Application Pokémon Electron

## 1. Introduction
Ce projet est une application de type "Idle Game / Widget" Pokémon développée avec **Electron**, **React**, et **Vite**. L'application est conçue pour être minimaliste, transparente et flotter sur le bureau de l'utilisateur pendant qu'il travaille.

## 2. Architecture Technique

### Structure du Projet
L'architecture a été refondue pour suivre une approche **"Feature-Based"**, favorisant la modularité et la scalabilité.

```
src/renderer/src/
├── assets/           # Ressources statiques (images, CSS global)
├── contexts/         # Gestion d'état global (React Context)
│   └── GameContext.jsx
├── data/             # Données statiques (Pokedex, Zones)
├── features/         # Modules fonctionnels
│   ├── Combat/       # Logique et UI de combat
│   ├── Core/         # Composants principaux (Widget, Timer)
│   ├── Pokemon/      # Gestion des Pokémon (Affichage, Équipe, Stockage)
│   └── Shop/         # Boutique et Inventaire
├── hooks/            # Hooks personnalisés (useCombat, etc.)
└── utils/            # Fonctions utilitaires pures
```

### Gestion de l'État (State Management)
L'état de l'application est centralisé dans le `GameContext` (`src/renderer/src/contexts/GameContext.jsx`).
Il gère :
*   La liste des Pokémon possédés (`ownedPokemon`).
*   L'équipe active (`teamIds`).
*   Le Pokémon actif (`activeId`).
*   L'inventaire (`candies`, `items`).
*   La persistance automatique via `localStorage`.

### Composants Clés
*   **Widget (`features/Core`)** : Le cœur de l'application. Il orchestre l'interface principale, gère le timer Pomodoro et sert de conteneur pour les autres fonctionnalités.
*   **CombatScreen (`features/Combat`)** : Gère l'affichage et les animations lors des phases de combat automatique.
*   **SelectionScreen (`features/Pokemon`)** : Une fenêtre séparée permettant à l'utilisateur de gérer son équipe et son stockage PC.

## 3. Fonctionnalités Principales

### Mode Aventure (Pomodoro)
*   L'utilisateur lance un timer (basé sur la méthode Pomodoro).
*   Pendant que le timer tourne, le Pokémon "part à l'aventure" (indisponible pour d'autres actions).
*   À la fin du timer, un combat automatique se déclenche.

### Système de Combat
*   Combats au tour par tour automatisés.
*   Calcul des dégâts basé sur le niveau et les types (Eau > Feu > Plante).
*   Animations CSS pour les attaques et la capture.
*   En cas de victoire, chance de capturer le Pokémon ennemi.

### Gestion des Pokémon
*   **Évolution** : Les Pokémon gagnent de l'XP et évoluent automatiquement ou via des objets (Pierres).
*   **Inventaire** : Gestion des bonbons (monnaie) et objets d'évolution.
*   **PC** : Stockage illimité des Pokémon capturés.

## 4. Guide de Développement

### Ajouter une nouvelle fonctionnalité
1.  Créer un nouveau dossier sous `src/renderer/src/features/`.
2.  Si la fonctionnalité nécessite un nouvel état global, l'ajouter dans `GameContext.jsx`.
3.  Importer et utiliser le composant dans `Widget.jsx` ou `App.jsx`.

### Styles
*   Utilisation de **Tailwind CSS** (v4) pour le style utilitaire.
*   Variables CSS globales pour les couleurs et les effets de verre (Glassmorphism) définies dans `assets/base.css`.
*   Pas de styles inline dans le JSX (sauf variables dynamiques `--progress`).

### Commandes Utiles
*   `npm run dev` : Lance l'application en mode développement.
*   `npm run build` : Construit l'application pour la production.

## 5. Dépendances Principales
*   `electron`
*   `react` / `react-dom`
*   `vite`
*   `tailwindcss`
*   `uuid` (pour la génération d'IDs uniques)
