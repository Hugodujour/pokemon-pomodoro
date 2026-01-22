export interface PokemonInstance {
  uuid: string;
  speciesId: string;
  xp: number;
  level: number;
  dateCaught: string;
  isInTeam: boolean;
  teamPosition: number | null;
  pcPosition: number | null;
  nickname?: string;
  label?: string;
  types?: string[];
  size?: 'S' | 'M' | 'L';
}

export interface PokedexEntry {
  id: string;
  label: string;
  types: string[];
  basePower: number;
  baseSpeed: number;
  catchRate: number;
  size: 'S' | 'M' | 'L';
  evolutions?: Evolution[];
}

export interface Evolution {
  type: 'level' | 'item';
  level?: number;
  item?: string;
  to: string;
}

export interface Zone {
  id: string;
  label: string;
  type: 'wild' | 'city';
  pokemon?: string[];
}

export interface GameState {
  ownedPokemon: PokemonInstance[];
  teamIds: string[];
  activeId: string | null;
  candies: number;
  inventory: Record<string, number>;
  isAdventureActive: boolean;
  isCombatActive: boolean;
}

export interface CombatState {
  active: boolean;
  opponent: Opponent | null;
  player: PlayerFighter | null;
  playerHp: number;
  maxPlayerHp: number;
  log: string[];
  isFinished: boolean;
  result: 'victory' | 'defeat' | 'flee' | null;
  captured: boolean;
  turn: 'player' | 'opponent';
}

export interface Opponent {
  speciesId: string;
  label: string;
  level: number;
  hp: number;
  maxHp: number;
  catchRate: number;
  size: 'S' | 'M' | 'L';
}

export interface PlayerFighter {
  label: string;
  level: number;
  types: string[];
  basePower: number;
  size: 'S' | 'M' | 'L';
}
