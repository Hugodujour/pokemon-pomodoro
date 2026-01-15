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
}: StorageSystemProps): JSX.Element | null {
  if (!visible) return null;

  const pokemonImages = import.meta.glob('../../../assets/pokemon/*.{gif,png,jpg,jpeg}', {
    eager: true
  });

  const getPokemonImage = (speciesId: string): string | undefined => {
    return (Object.entries(pokemonImages).find(([path]) =>
      path.toLowerCase().includes(speciesId.toLowerCase())
    )?.[1] as any)?.default;
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
