# Charte Graphique et Design (UI/UX)

Ce document définit les standards visuels de l'application pour assurer une cohérence entre tous les modules.

## 1. Principes Fondamentaux
L'application utilise un style **Glassmorphism Moderne** mélangé à une esthétique **Retro Pokémon** (GameBoy).

### Glassmorphism
Tous les conteneurs principaux (Widget, Team, PC, Logs) doivent utiliser les variables de design global :
- **Background** : `var(--glass-bg)` (translucide)
- **Flou** : `backdrop-filter: blur(var(--glass-blur))`
- **Bordure** : `1px solid var(--glass-border)`
- **Arrondis** : `16px` (Standard pour les conteneurs modulaires)
- **Ombres** : Aucune ombre portée (`box-shadow: none`) pour un rendu "flat" et moderne.

### Typographie
- **Police Principale** : `Inter` ou sans-serif système pour la lecture fluide.
- **Police Retro** : `Pokemon GB` (Custom font)
    - Utilisée pour : Noms des Pokémon, Titres de sections (Action Log), Labels de zones.
    - Usage : `font-family: 'Pokemon GB', sans-serif;`

## 2. Interaction & Feedback (UX)

### Action Log (Aide contextuelle)
Au lieu d'utiliser les infobulles natives du navigateur (`title`), l'application utilise une boîte de dialogue dédiée en bas du widget.
- **Principe** : Chaque élément interactif doit mettre à jour le state `hoverText` du Widget via `onMouseEnter`.
- **Réinitialisation** : `onMouseLeave` doit toujours ramener le texte à `HOVER_MESSAGES.IDLE`.

### États de Contrôle
- **Boutons Désactivés** : 
    - Opacité : `0.4`
    - Filtre : `grayscale(1)`
    - Curseur : `not-allowed`

## 3. Thème de Couleurs
Le thème est principalement sombre (Dark Mode) avec des accents basés sur les types de Pokémon :
- **Variables Globales** (`base.css`) :
    - `--glass-bg` : `rgba(15, 23, 42, 0.7)`
    - `--glass-border` : `rgba(255, 255, 255, 0.1)`
    - `--text-primary` : `#ffffff`
    - `--text-secondary` : `rgba(255, 255, 255, 0.6)`
