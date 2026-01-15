import { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { GameState, PokedexEntry, Zone, PokemonInstance } from '../types';

interface GameContextType extends GameState {
  pokedex: PokedexEntry[];
  zones: Zone[];
  setActiveId: (id: string) => Promise<void>;
  setTeamIds: (teamIds: string[]) => Promise<void>;
  setCandies: (amount: number | ((prev: number) => number)) => Promise<void>;
  addCandies: (amount: number) => Promise<void>;
  useCandy: () => Promise<any>;
  setInventory: (updater: any) => Promise<void>;
  setOwnedPokemon: (updater: any) => Promise<void>;
  updatePokemon: (uuid: string, updates: any) => Promise<any>;
  refreshState: () => Promise<GameState>;
  pickStarter: (speciesId: string) => Promise<any>;
  reorderPokemon: (uuids: string[]) => Promise<void>;
  getActiveInstance: () => PokemonInstance | null;
}

const GameContext = createContext<GameContextType | null>(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export function GameProvider({ children }: GameProviderProps) {
  // --- STATE (Mirror of Main Process State) ---
  const [state, setState] = useState<GameState | null>(null);
  const [pokedex, setPokedex] = useState<PokedexEntry[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshState = useCallback(async () => {
    const newState = await window.gameAPI.getState();
    setState(newState);
    return newState;
  }, []);

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
      const unsubscribe = window.gameAPI.onStateChange((newState: GameState) => {
        console.log('[GameContext] REÇU DE MAIN:', newState.isAdventureActive ? 'AVENTURE ON' : 'AVENTURE OFF', newState.isCombatActive ? 'COMBAT ON' : 'COMBAT OFF');
        setState(newState);
      });
      return unsubscribe;
    }
    return undefined;
  }, []);


  // --- SYNC WITH SELECTION WINDOW ---
  useEffect(() => {
    if (window.api?.onPokemonSelected) {
      const unsubscribe = window.api.onPokemonSelected(async () => {
        // Refresh state from Main when a pokemon is selected from other window
        const newState = await window.gameAPI.getState();
        setState(newState);
      });
      return unsubscribe;
    }
    return undefined;
  }, []);

  // --- ACTIONS (Wrappers around IPC calls) ---
  
  const pickStarter = useCallback(async (speciesId: string) => {
    const result = await window.gameAPI.pickStarter(speciesId);
    await refreshState();
    return result;
  }, [refreshState]);

  const updatePokemon = useCallback(async (uuid: string, updates: any) => {
    const updated = await window.gameAPI.updatePokemon(uuid, updates);
    await refreshState();
    return updated;
  }, [refreshState]);

  const setActiveId = useCallback(async (id: string) => {
    await window.gameAPI.setActiveId(id);
    await refreshState();
  }, [refreshState]);

  const setTeamIds = useCallback(async (teamIds: string[]) => {
    await window.gameAPI.setTeamIds(teamIds);
    await refreshState();
  }, [refreshState]);

  const reorderPokemon = useCallback(async (uuids: string[]) => {
    await window.gameAPI.reorderPokemon(uuids);
    await refreshState();
  }, [refreshState]);

  const setCandies = useCallback(async (amount: number | ((prev: number) => number)) => {
    // For compatibility with old code that uses setCandies(c => c + 1)
    if (typeof amount === 'function') {
      const currentState = await window.gameAPI.getState();
      const newAmountValue = amount(currentState.candies) - currentState.candies;
      await window.gameAPI.addCandies(newAmountValue);
    } else {
      const currentState = await window.gameAPI.getState();
      const diff = amount - currentState.candies;
      await window.gameAPI.addCandies(diff);
    }
    await refreshState();
  }, [refreshState]);

  const addCandies = useCallback(async (amount: number) => {
    await window.gameAPI.addCandies(amount);
    await refreshState();
  }, [refreshState]);

  const useCandy = useCallback(async () => {
    const result = await window.gameAPI.useCandy();
    await refreshState();
    return result;
  }, [refreshState]);

  const setInventory = useCallback(async (updater: any) => {
    // For compatibility: inventory updates are complex, 
    // we'll handle common cases (adding items)
    const currentState = await window.gameAPI.getState();
    const newInventory = typeof updater === 'function' 
      ? updater(currentState.inventory) 
      : updater;
    
    // Find differences and apply
    for (const [itemId, quantity] of Object.entries(newInventory)) {
      const q = quantity as number;
      const diff = q - (currentState.inventory[itemId] || 0);
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

  const setOwnedPokemon = useCallback(async (_updater: any) => {
    // This is mainly for adding new pokemon (capture)
    // Complex operations should use specific IPC calls
    console.warn('[GameContext] setOwnedPokemon is deprecated, use specific IPC calls');
    await refreshState();
  }, [refreshState]);

  // --- DERIVED STATE ---
  const getActiveInstance = useCallback(() => {
    if (!state) return null;
    return state.ownedPokemon.find(p => p.uuid === state.activeId) || null;
  }, [state]);

  // --- LOADING STATE ---
  if (loading || !state) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        color: loading ? 'white' : 'red',
        fontSize: '0.875rem'
      }}>
        {loading ? 'Chargement...' : 'Erreur de chargement'}
      </div>
    );
  }

  // --- CONTEXT VALUE ---
  const value: GameContextType = {
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
