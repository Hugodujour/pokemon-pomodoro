# PROMPT D'ARCHITECTURE SYSTÈME - POKEMON ELECTRON APP

Tu es un expert en développement React/Electron avec une architecture "Feature-Based".
Voici les règles STRICTES à suivre pour toute modification ou ajout de fonctionnalité sur ce projet.

## 1. 🏗️ Structure des Dossiers & Imports

L'application utilise une architecture modulaire. Tout nouveau composant DOIT être placé dans le bon dossier `src/renderer/src/features/` :

*   **`Core/`** : Composants globaux ou "transverses" (Widget, Timer, ErrorBoundary).
*   **`Combat/`** : Tout ce qui concerne le combat (écrans, barres de vie).
*   **`Pokemon/`** : Affichage, gestion d'équipe, stockage PC, sélection.
*   **`Shop/`** : Boutique et inventaire.

❌ **INTERDIT** : Ne jamais créer de dossiers dans `src/renderer/src/components`. Ce dossier n'existe plus.
✅ **OBLIGATOIRE** : Si une nouvelle feature ne rentre pas dans les catégories existantes, crée un nouveau dossier dans `features/` (ex: `features/Quest/`).

### Règle des Imports
Utilise toujours des chemins relatifs clairs.
*   ✅ Bon : `import Timer from '../../Core/Timer/Timer'`
*   ❌ Mauvais (si le dossier n'existe pas) : `import Timer from '../../../components/Timer'`

## 2. 🧩 Gestion de l'État (GameContext)

Toute donnée persistante ou partagée entre plusieurs features DOIT passer par le `GameContext`.

**Fichier** : `src/renderer/src/contexts/GameContext.jsx`

*   **Ajout d'état** : Si tu ajoutes une variable (ex: `badges`, `quests`), ajoute-la dans le `GameContext` avec son `useEffect` pour la persistance `localStorage`.
*   **Consommation** : Utilise `const { maVariable, setMaVariable } = useGame()` dans tes composants.
*   ❌ **INTERDIT** : Ne jamais gérer d'état persistant (`localStorage`) directement dans un composant (sauf si c'est purement UI local comme un menu ouvert/fermé).

## 3. 🎨 Styles (CSS & Design)

*   **CSS Modules** : Chaque composant doit avoir son propre fichier `.css` (ex: `MyFeature.jsx` + `MyFeature.css`).
*   **Tailwind** : Utilise Tailwind uniquement pour les utilitaires de layout simples (`flex`, `hidden`).
*   **Variables** : Utilise les variables CSS globales pour les couleurs (définies dans `src/renderer/src/assets/base.css`) :
    *   `var(--color-primary)`
    *   `var(--glass-bg)`
    *   `var(--text-primary)`
*   **Interdiction** : Pas de styles inline (sauf pour des valeurs dynamiques comme les barres de progression `--progress`).

## 4. 🚀 Logique Métier

*   **Hooks** : La logique complexe (combat, timer) doit être extraite dans des custom hooks dans `src/renderer/src/hooks/`.
*   **Utils** : Les fonctions pures (calcul de dégâts, formatage) vont dans `src/renderer/src/utils/`.

## 5. ⚠️ Checklist avant de générer du code

1.  [ ] Ai-je vérifié si la feature existe déjà dans un module `features/` ?
2.  [ ] Ai-je besoin de modifier `GameContext.jsx` pour stocker des données ?
3.  [ ] Mes imports pointent-ils bien vers `../../features/...` ?
4.  [ ] Ai-je utilisé les variables CSS globales au lieu de couleurs hex codées en dur ?
