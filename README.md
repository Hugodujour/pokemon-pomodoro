# Pokémon Widget (Pomodoro Idle Game)

Une application de bureau **Electron** qui combine un **Timer Pomodoro** avec un **Idle Game Pokémon**. L'application est conçue comme un widget flottant discret ("Always on Top") qui vous récompense pour votre temps de travail.

## 🚀 Technologies

Ce projet utilise une stack moderne et robuste :

- **Electron** : Application de bureau cross-platform.
- **React** : Interface utilisateur (Hooks, Context API).
- **TypeScript** : Typage statique strict pour le Main et le Renderer.
- **Vite** : Build tool rapide.
- **SQLite (better-sqlite3)** : Base de données locale performante.
- **Drizzle ORM** : Gestion de la base de données et des migrations.
- **TailwindCSS** : Styling utilitaire.

## ✨ Fonctionnalités Principales

- **Widget Flottant** : Interface transparente et "Always on Top" qui ne gêne pas le travail.
- **Mode Focus (Aventure)** : Lancez un timer (Pomodoro). Pendant ce temps, votre Pokémon part en "Aventure".
- **Système de Combat** : À la fin du timer, un combat au tour par tour se déclenche (Types, PV, Dégâts, Capture).
- **Gestion d'Équipe** : Capturez des Pokémon, gérez votre équipe de 3, et stockez les autres dans le PC via une fenêtre dédiée.
- **Progression** : Gagnez de l'XP, des niveaux, et faites évoluer vos Pokémon (pierres d'évolution).
- **Sauvegarde Locale** : Toutes les données sont persistées localement dans une base SQLite robuste (`%APPDATA%/electron-app/pokemon-game.db`).
- **Modes d'Affichage** : Mode Widget complet ou Mode Minimaliste (Barre/Icône).

## 🛠️ Installation & Développement

### Prérequis
- Node.js (v18+)

### Commandes

```bash
# Installation des dépendances
npm install

# Lancer en mode développement (Hot Reload)
# Ouvre la fenêtre Electron et le serveur Vite
npm run dev

# Construire pour la production (Windows)
npm run build:win
```

## 📚 Documentation Détaillée

La documentation technique se trouve dans le dossier `docs/` :

- [**Architecture IPC**](docs/ARCHITECTURE_IPC.md) : Communication Main/Renderer et structure du code.
- [**Logique Métier**](docs/LOGIC.md) : Services (Game, Combat, DB) et structures de données.
- [**Composants UI**](docs/COMPONENTS.md) : Détails des composants React (Widget, CombatScreen, etc.).

