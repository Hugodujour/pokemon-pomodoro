export {}

declare global {
  interface Window {
    api: {
      openSelectionWindow: () => void;
      closeSelectionWindow: () => void;
      selectPokemon: (pokemonId: string, shouldClose?: boolean) => void;
      onPokemonSelected: (callback: (pokemonId: string) => void) => () => void;
      minimize: () => void;
      close: () => void;
      toggleMinimalist: (isMinimalist: boolean) => void;
      openMapWindow: () => void;
      selectZone: (zoneId: string) => void;
      onZoneSelected: (callback: (zoneId: string) => void) => () => void;
      setCombatMode: (inCombat: boolean) => void;
    };
    gameAPI: {
      getState: () => Promise<any>;
      getActivePokemon: () => Promise<any>;
      setActiveId: (id: string) => Promise<any>;
      setTeamIds: (teamIds: string[]) => Promise<any>;
      pickStarter: (speciesId: string) => Promise<any>;
      reorderPokemon: (uuids: string[]) => Promise<any>;
      setAdventureActive: (active: boolean) => Promise<any>;
      setCombatActive: (active: boolean) => Promise<any>;
      updatePokemon: (uuid: string, updates: any) => Promise<any>;
      giveXp: (uuid: string, amount: number) => Promise<any>;
      addCandies: (amount: number) => Promise<any>;
      useCandy: () => Promise<any>;
      spendCandies: (amount: number) => Promise<any>;
      addItem: (itemId: string, quantity: number) => Promise<any>;
      useItem: (itemId: string) => Promise<any>;
      startCombat: (activeId: string, zoneId: string) => Promise<any>;
      attack: (combatState: any) => Promise<any>;
      flee: (combatState: any) => Promise<any>;
      finishCombat: (combatState: any) => Promise<any>;
      buyStone: () => Promise<any>;
      evolveWithStone: (pokemonUuid: string, stoneType: string) => Promise<any>;
      getPokedex: () => Promise<any[]>;
      getZones: () => Promise<any[]>;
      onStateChange: (callback: (newState: any) => void) => () => void;
    };
  }
}
