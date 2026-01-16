import React from 'react';
import { PokemonInstance } from '../../../types';
import './Team.css';

interface TeamProps {
  team: PokemonInstance[];
  activeId: string | null;
  onSelect: (uuid: string) => void;
  onRemove?: (uuid: string) => void;
  onDragStart: (e: React.DragEvent, uuid: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (targetUuid: string | null, targetIndex: number) => void;
  isBusy: boolean;
}

export default function Team({ 
  team, 
  activeId, 
  onSelect, 
  onRemove, 
  onDragStart, 
  onDragEnd, 
  onDragOver, 
  onDrop, 
  isBusy 
}: TeamProps) {
  // Ensure we always have 3 slots for display
  const slots: (PokemonInstance | null)[] = [...team];
  while (slots.length < 3) {
    slots.push(null);
  }

  const pokemonImages = import.meta.glob('../../../assets/pokemon/mini/*.{gif,png,jpg,jpeg}', {
    eager: true
  });

  const getPokemonImage = (speciesId: string): string | undefined => {
      // speciesId is usually lowercase like 'pikachu'
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
    <div className="team-container">
      {slots.map((pokemon, index) => {
        const isActive = pokemon && pokemon.uuid === activeId;
        const isFilled = !!pokemon;
        const imgSrc = pokemon ? getPokemonImage(pokemon.speciesId || (pokemon as any).label || '') : null;
        
        return (
          <div
            key={pokemon ? pokemon.uuid : `empty-${index}`}
            onClick={() => pokemon && onSelect(pokemon.uuid)}
            onDragStart={(e) => pokemon && onDragStart(e, pokemon.uuid)}
            onDragEnd={onDragEnd}
            onDragOver={handleDragOver}
            onDrop={() => onDrop(pokemon ? pokemon.uuid : null, index)}
            draggable={isFilled}
            className={`team-slot ${isFilled ? 'filled' : ''} ${isActive ? 'active' : ''} ${isActive && isBusy ? 'busy' : ''}`}
            title={pokemon ? `${(pokemon as any).label} (Lvl ${pokemon.level})` : 'Emplacement vide'}
            style={getSlotStyle(pokemon)}
          >
            {pokemon ? (
              <>
                {imgSrc && <img src={imgSrc} alt={(pokemon as any).label} className="team-sprite" draggable="false" />}
                <div className="team-label">{(pokemon as any).label}</div>
                <div className="team-level">Lvl {pokemon.level}</div>
                
                {onRemove && team.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(pokemon.uuid);
                    }}
                    className="btn-remove-team"
                    title="Move to Storage"
                  >
                    ↓
                  </button>
                )}
              </>
            ) : (
              <div className="team-empty">Vide</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function handleDragOver(e: React.DragEvent) {
  e.preventDefault();
}
