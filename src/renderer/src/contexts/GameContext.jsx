import { createContext, useState, useEffect, useContext, useCallback } from 'react';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export function GameProvider({ children }) {
  // --- STATE (Mirror of Main Process State) ---
  const [state, setState] = useState(null);
  const [pokedex, setPokedex] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- INITIAL LOAD ---
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load static data
        if (!window.gameAPI) {
          throw new Error('API non disponible (Preload failed)');
        }

        const [pokedexData, zonesData, gameState] = await Promise.all([
          window.gameAPI.getPokedex(),
          window.gameAPI.getZones(),
          window.gameAPI.getState()
        ]);


        setPokedex(pokedexData);
        setZones(zonesData);
        setState(gameState);
        setLoading(false);

        console.log('[GameContext] État initial chargé:', gameState);
      } catch (err) {
        console.error('[GameContext] Erreur de chargement:', err);
        setLoading(false);
      }
    };

    loadInitialData();

    // Listen for state changes from Main process
    if (window.gameAPI?.onStateChange) {
      const unsubscribe = window.gameAPI.onStateChange((newState) => {
        console.log('[GameContext] REÇU DE MAIN:', newState.isAdventureActive ? 'AVENTURE ON' : 'AVENTURE OFF', newState.isCombatActive ? 'COMBAT ON' : 'COMBAT OFF');
        setState(newState);
      });
      return unsubscribe;
    }
  }, []);


  // --- SYNC WITH SELECTION WINDOW ---
  useEffect(() => {
    if (window.api?.onPokemonSelected) {
      const unsubscribe = window.api.onPokemonSelected(async (newId) => {
        // Refresh state from Main when a pokemon is selected from other window
        const newState = await window.gameAPI.getState();
        setState(newState);
      });
      return unsubscribe;
    }
  }, []);

  // --- ACTIONS (Wrappers around IPC calls) ---
  
  const pickStarter = useCallback(async (speciesId) => {
    const result = await window.gameAPI.pickStarter(speciesId);
    await refreshState();
    return result;
  }, []);

  const refreshState = useCallback(async () => {
    const newState = await window.gameAPI.getState();
    setState(newState);
    return newState;
  }, []);

  const updatePokemon = useCallback(async (uuid, updates) => {
    const updated = await window.gameAPI.updatePokemon(uuid, updates);
    await refreshState();
    return updated;
  }, [refreshState]);

  const setActiveId = useCallback(async (id) => {
    await window.gameAPI.setActiveId(id);
    await refreshState();
  }, [refreshState]);

  const setTeamIds = useCallback(async (teamIds) => {
    await window.gameAPI.setTeamIds(teamIds);
    await refreshState();
  }, [refreshState]);

  const reorderPokemon = useCallback(async (uuids) => {
    await window.gameAPI.reorderPokemon(uuids);
    await refreshState();
  }, [refreshState]);

  const setCandies = useCallback(async (amount) => {
    // For compatibility with old code that uses setCandies(c => c + 1)
    if (typeof amount === 'function') {
      const currentState = await window.gameAPI.getState();
      const newAmount = amount(currentState.candies) - currentState.candies;
      await window.gameAPI.addCandies(newAmount);
    } else {
      const currentState = await window.gameAPI.getState();
      const diff = amount - currentState.candies;
      await window.gameAPI.addCandies(diff);
    }
    await refreshState();
  }, [refreshState]);

  const addCandies = useCallback(async (amount) => {
    await window.gameAPI.addCandies(amount);
    await refreshState();
  }, [refreshState]);

  const useCandy = useCallback(async () => {
    const result = await window.gameAPI.useCandy();
    await refreshState();
    return result;
  }, [refreshState]);

  const setInventory = useCallback(async (updater) => {
    // For compatibility: inventory updates are complex, 
    // we'll handle common cases (adding items)
    const currentState = await window.gameAPI.getState();
    const newInventory = typeof updater === 'function' 
      ? updater(currentState.inventory) 
      : updater;
    
    // Find differences and apply
    for (const [itemId, quantity] of Object.entries(newInventory)) {
      const diff = quantity - (currentState.inventory[itemId] || 0);
      if (diff > 0) {
        await window.gameAPI.addItem(itemId, diff);
      } else if (diff < 0) {
        for (let i = 0; i < Math.abs(diff); i++) {
          await window.gameAPI.useItem(itemId);
        }
      }
    }
    await refreshState();
  }, [refreshState]);

  const setOwnedPokemon = useCallback(async (updater) => {
    // This is mainly for adding new pokemon (capture)
    // Complex operations should use specific IPC calls
    console.warn('[GameContext] setOwnedPokemon is deprecated, use specific IPC calls');
    await refreshState();
  }, [refreshState]);

  // --- DERIVED STATE ---
  const getActiveInstance = useCallback(() => {
    if (!state) return null;
    return state.ownedPokemon.find(p => p.uuid === state.activeId);
  }, [state]);

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        color: 'white',
        fontSize: '0.875rem'
      }}>
        Chargement...
      </div>
    );
  }

  if (!state) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        color: 'red',
        fontSize: '0.875rem'
      }}>
        Erreur de chargement
      </div>
    );
  }

  // --- CONTEXT VALUE ---
  const value = {
    // State (read-only mirrors)
    ownedPokemon: state.ownedPokemon,
    teamIds: state.teamIds,
    activeId: state.activeId,
    candies: state.candies,
    inventory: state.inventory,
    isAdventureActive: state.isAdventureActive,
    isCombatActive: state.isCombatActive,

    // Static data
    pokedex,
    zones,

    // Actions (IPC wrappers)
    setActiveId,
    setTeamIds,
    setCandies,
    addCandies,
    useCandy,
    setInventory,
    setOwnedPokemon,
    updatePokemon,
    refreshState,
    pickStarter,
    reorderPokemon,

    // Helpers
    getActiveInstance
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
