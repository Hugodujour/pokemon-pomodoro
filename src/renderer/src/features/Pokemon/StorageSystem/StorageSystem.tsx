import React from 'react';
import { PokemonInstance } from '../../../types';
import './StorageSystem.css';

interface StorageSystemProps {
  storedPokemon: PokemonInstance[];
  onWithdraw: (uuid: string) => void;
  visible?: boolean;
  onDragStart: (e: React.DragEvent, uuid: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (targetUuid: string) => void;
}

export default function StorageSystem({ 
  storedPokemon, 
  onWithdraw, 
  visible, 
  onDragStart, 
  onDragEnd, 
  onDragOver, 
  onDrop 
}: StorageSystemProps) {
  if (!visible) return null;

  const pokemonImages = import.meta.glob('../../../assets/pokemon/*.{gif,png,jpg,jpeg}', {
    eager: true
  });

  const getPokemonImage = (speciesId: string): string | undefined => {
    return (Object.entries(pokemonImages).find(([path]) =>
      path.toLowerCase().includes(speciesId.toLowerCase())
    )?.[1] as any)?.default;
  };

  const getSlotStyle = (pokemon: any) => {
    if (!pokemon || !pokemon.types || pokemon.types.length === 0) return {};
    
    const colors: Record<string, string> = {
      electric: 'rgba(250, 204, 21, 0.4)',
      grass: 'rgba(74, 222, 128, 0.4)',
      poison: 'rgba(167, 139, 250, 0.4)',
      fire: 'rgba(248, 113, 113, 0.4)',
      flying: 'rgba(147, 197, 253, 0.4)',
      water: 'rgba(96, 165, 250, 0.4)',
      rock: 'rgba(168, 162, 158, 0.4)',
      ground: 'rgba(251, 191, 36, 0.4)',
      bug: 'rgba(167, 185, 28, 0.4)',
      normal: 'rgba(168, 168, 120, 0.4)'
    };

    if (pokemon.types.length >= 2) {
      const c1 = colors[pokemon.types[0]] || 'rgba(255, 255, 255, 0.05)';
      const c2 = colors[pokemon.types[1]] || 'rgba(255, 255, 255, 0.05)';
      return { 
        background: `linear-gradient(135deg, ${c1} 0%, ${c1} 50%, ${c2} 50%, ${c2} 100%)` 
      } as React.CSSProperties;
    }

    const type = pokemon.types[0];
    return { '--type-bg': colors[type] || 'rgba(255, 255, 255, 0.05)' } as React.CSSProperties;
  };

  return (
    <div className="storage-grid">
      {storedPokemon.map((pokemon) => (
        <div
          key={pokemon.uuid}
          onClick={() => onWithdraw(pokemon.uuid)}
          onDragStart={(e) => onDragStart(e, pokemon.uuid)}
          onDragEnd={onDragEnd}
          onDragOver={onDragOver}
          onDrop={(e) => {
            e.stopPropagation();
            onDrop(pokemon.uuid);
          }}
          draggable
          className="storage-item"
          title={`${pokemon.label} (Lvl ${pokemon.level})`}
          style={getSlotStyle(pokemon)}
        >
          <img src={getPokemonImage(pokemon.speciesId)} alt={pokemon.label} className="storage-sprite" draggable="false" />
          <div className="storage-item-label">{pokemon.label}</div>
          <div className="storage-item-level">Lvl {pokemon.level}</div>
        </div>
      ))}
      {storedPokemon.length === 0 && (
        <div className="storage-empty">
          Le PC est vide.
        </div>
      )}
    </div>
  );
}
