import { createContext, useState, useEffect, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export function GameProvider({ children }) {
  // --- STATE ---
  const [ownedPokemon, setOwnedPokemon] = useState(() => {
    try {
      const stored = localStorage.getItem('ownedPokemon');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading ownedPokemon:', e);
    }
    const starters = ['pikachu', 'bulbizarre', 'salameche', 'carapuce'];
    return starters.map(speciesId => ({ uuid: uuidv4(), speciesId, xp: 0, level: 1, dateCaught: new Date().toISOString() }));
  });

  const [teamIds, setTeamIds] = useState(() => {
    try {
      const stored = localStorage.getItem('teamIds');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading teamIds:', e);
    }
    return [];
  });

  const [activeId, setActiveId] = useState(() => localStorage.getItem('activeId') || null);
  const [candies, setCandies] = useState(() => Number(localStorage.getItem('candies')) || 0);
  const [inventory, setInventory] = useState(() => {
    try {
      const stored = localStorage.getItem('inventory');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Error loading inventory:', e);
      return {};
    }
  });

  // --- PERSISTENCE ---
  useEffect(() => { 
    if (ownedPokemon.length > 0) localStorage.setItem('ownedPokemon', JSON.stringify(ownedPokemon)); 
  }, [ownedPokemon]);
  
  useEffect(() => { 
    if (teamIds.length > 0) localStorage.setItem('teamIds', JSON.stringify(teamIds)); 
  }, [teamIds]);
  
  useEffect(() => { 
    if (activeId) localStorage.setItem('activeId', activeId); 
  }, [activeId]);
  
  useEffect(() => { localStorage.setItem('candies', candies); }, [candies]);
  useEffect(() => { localStorage.setItem('inventory', JSON.stringify(inventory)); }, [inventory]);

  // Sync from localStorage when other windows change it (Selection Window)
  useEffect(() => {
    const handleStorage = (e) => {
      try {
        if (e.key === 'ownedPokemon' && e.newValue) setOwnedPokemon(JSON.parse(e.newValue));
        if (e.key === 'teamIds' && e.newValue) setTeamIds(JSON.parse(e.newValue));
        if (e.key === 'activeId' && e.newValue) setActiveId(e.newValue);
        if (e.key === 'candies' && e.newValue) setCandies(Number(e.newValue));
        if (e.key === 'inventory' && e.newValue) setInventory(JSON.parse(e.newValue));
      } catch (err) {
        console.error("Storage sync error:", err);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Sync with selection window (IPC) implementation can stay here or be handled where needed.
  // For now, we keep the IPC listener here to update the central state.
  useEffect(() => {
    if (window.api?.onPokemonSelected) {
      const unsubscribe = window.api.onPokemonSelected((newId) => {
        setActiveId(newId);
        // Refresh everything just in case
        const storedPokemon = localStorage.getItem('ownedPokemon');
        if (storedPokemon) setOwnedPokemon(JSON.parse(storedPokemon));
        const storedTeam = localStorage.getItem('teamIds');
        if (storedTeam) setTeamIds(JSON.parse(storedTeam));
      });
      return unsubscribe;
    }
  }, []);

  // Ensure team and active are set on load
  useEffect(() => {
    if (ownedPokemon.length > 0) {
      if (teamIds.length === 0) {
        const newTeam = ownedPokemon.slice(0, 3).map(p => p.uuid);
        setTeamIds(newTeam);
        if (!activeId) setActiveId(newTeam[0]);
      } else if (!activeId || !ownedPokemon.find(p => p.uuid === activeId)) {
        setActiveId(teamIds[0] || ownedPokemon[0].uuid);
      }
    }
  }, [ownedPokemon, teamIds, activeId]);

  // --- ACTIONS ---
  const updatePokemon = (uuid, updates) => {
    setOwnedPokemon(prev => prev.map(p => (p.uuid === uuid ? { ...p, ...updates } : p)));
  };

  const getActiveInstance = () => ownedPokemon.find(p => p.uuid === activeId);

  const value = {
    ownedPokemon,
    setOwnedPokemon,
    teamIds,
    setTeamIds,
    activeId,
    setActiveId,
    candies,
    setCandies,
    inventory,
    setInventory,
    updatePokemon,
    getActiveInstance
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}
