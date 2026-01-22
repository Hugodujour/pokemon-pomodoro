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

## 4. Mise en Page & Espacement (Layout)
L'application utilise un système de "grille flottante" pour maintenir une cohérence visuelle.

### Variables Globales (`base.css`)
- **`--app-padding`** : `1.5rem` (Standard pour tous les espacements latéraux).
- **`--app-radius`** : `16px` (Bordure standard pour tous les conteneurs).

### Règles de Structure
1. **Conteneurs de Fenêtres** (`.app-container`, `.selection-screen`) :
    - **Padding Vertical** : Toujours `0`. L'espacement haut/bas est géré par les marges des éléments enfants ou le header.
    - **Padding Horizontal** : Géré par les éléments enfants pour permettre aux séparateurs d'être "bord-à-bord".
2. **Séparateurs (Titres)** :
    - Les headers (`.app-header`) et les diviseurs (`.section-divider`) doivent utiliser `width: 100%` et une bordure (`border-bottom` ou `border`) pour toucher les bords gauche et droit de la fenêtre.
    - Ils agissent comme des ancres structurelles.
3. **Cartes de Contenu** :
    - Les sections de contenu (Combat, Équipe, Logs) doivent être traitées comme des "cartes" :
        - `width: calc(100% - (var(--app-padding) * 2))`
        - `margin: 0 auto` (pour le centrage)
        - `border-radius: var(--app-radius)`
        - `border: 1px solid var(--glass-border)`
        - **Marge de Sécurité** : Toujours inclure une marge basse (`margin-bottom: var(--app-padding)`) pour éviter que la carte ne touche le bord de la fenêtre.
4. **Hiérarchie des Titres** :
    - Chaque grande section commence par un titre superposé à une ligne (`.section-divider > .header-zone-label`).
    - L'espacement entre deux cartes ou entre une ligne et une carte doit être `var(--app-padding)` ou une fraction (`calc(var(--app-padding) / 2)`).
5. **Padding Interne (Contenu)** :
    - Pour les zones textuelles (ex: logs), utiliser un padding minimal (`5px 10px`) pour aérer le contenu sans gaspiller d'espace vertical.

## 5. Thème de Couleurs
Le thème est principalement sombre (Dark Mode) avec des accents basés sur les types de Pokémon :
- **Variables Globales** (`base.css`) :
    - `--glass-bg` : `rgba(15, 23, 42, 0.7)`
    - `--glass-border` : `rgba(255, 255, 255, 0.1)`
    - `--text-primary` : `#ffffff`
    - `--text-secondary` : `rgba(255, 255, 255, 0.6)`

## 6. Système de Tailles (Sprites)
Pour assurer une cohérence visuelle malgré les différences de morphologie entre Pokémon, l'application utilise un système de catégories de tailles.

### Catégories de Tailles
Définit dans `gameData.ts` via l'attribut `size` :
- **S** (Small) : Pour les Pokémon de base ou petits (ex: Pikachu, Bulbizarre).
- **M** (Medium) : Taille standard (ex: Herbizarre, Raichu).
- **L** (Large) : Pour les formes finales ou massives (ex: Dracaufeu, Florizarre).

### Impact sur le Combat (`CombatScreen.css`)
Chaque catégorie possède des variables CSS dédiées pour ajuster finement le layout :
- `--opp-size`, `--opp-x`, `--opp-y` : Taille et position de l'adversaire.
- `--ply-size`, `--ply-x`, `--ply-y` : Taille et position du joueur (dos).

### Impact sur le Widget (`PokemonDisplay.css`)
Le Pokémon actif sur l'écran d'accueil utilise également ces classes pour adapter son échelle :
- `.pokemon-image.size-S/M/L` : Utilise la variable `--display-size` pour modifier le rendu sans altérer les icônes de listes.
