import { useState, useEffect } from 'react';
import './PokemonDisplay.css';

interface TimerState {
  current: number;
  total: number;
}

interface PokemonDisplayProps {
  name: string;
  xp: number;
  isAdventureRunning?: boolean;
  timerState?: TimerState;
  isBusy?: boolean;
  nickname?: string;
  onRename?: (newName: string) => void;
  types?: string[];
}

// Inline level calculation (logic moved to Main process)
function getLevel(xp: number) {
  let level = 1;
  let remainingXp = xp;
  while (remainingXp >= level * 1) {
    remainingXp -= level * 1;
    level++;
  }
  return { level, current: remainingXp, required: level * 1 };
}

export default function PokemonDisplay({ 
  name, 
  xp, 
  isAdventureRunning, 
  timerState, 
  isBusy,
  nickname,
  onRename,
  types
}: PokemonDisplayProps) {
  const [displaySpecies, setDisplaySpecies] = useState(name);
  const [animPhase, setAnimPhase] = useState<'idle' | 'in' | 'out'>('idle');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nickname || name);

  useEffect(() => {
    if (name !== displaySpecies) {
      // Trigger Evolution Animation
      setAnimPhase('out');
      
      const t1 = setTimeout(() => {
        setDisplaySpecies(name);
        setAnimPhase('in');
      }, 1500); // Match CSS duration

      const t2 = setTimeout(() => {
        setAnimPhase('idle');
      }, 3000);

      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    return undefined;
  }, [name, displaySpecies]);

  // Update edit value if nickname changes externally
  useEffect(() => {
    setEditValue(nickname || name);
  }, [nickname, name]);

  const pokemonImages = import.meta.glob('../../../assets/pokemon/*.{gif,png,jpg,jpeg}', {
    eager: true
  });

  // Use displaySpecies for image lookup
  const pokemonSrc = (Object.entries(pokemonImages).find(([path]) =>
    path.toLowerCase().includes(displaySpecies.toLowerCase())
  )?.[1] as any)?.default;

  const { level, current, required } = getLevel(xp);

  // Logic for display: XP or Timer
  let percent = 0;
  let isTimer = false;
  let text = `${current} / ${required} XP`;

  if (isAdventureRunning && timerState) {
    const { current: rem, total } = timerState;
    percent = (1 - rem / total) * 100;
    isTimer = true;
    const mins = String(Math.floor(rem / 60)).padStart(2, '0');
    const secs = String(rem % 60).padStart(2, '0');
    text = `${mins}:${secs}`;
  } else {
    percent = Math.floor((current / required) * 100);
  }

  const handleSave = () => {
    if (onRename) {
      onRename(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditValue(nickname || name);
      setIsEditing(false);
    }
  };

  // Determine Class
  let imgClass = 'pokemon-image';
  if (animPhase === 'out') imgClass += ' anim-evo-out';
  if (animPhase === 'in') imgClass += ' anim-evo-in';
  if (isBusy) imgClass += ' busy';

  const displayName = nickname || displaySpecies;

  const getBackgroundStyle = () => {
    if (!types || types.length === 0) return {};
    
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

    if (types.length >= 2) {
      const c1 = colors[types[0]] || 'rgba(255, 255, 255, 0.05)';
      const c2 = colors[types[1]] || 'rgba(255, 255, 255, 0.05)';
      return { 
        background: `linear-gradient(135deg, ${c1} 0%, ${c1} 50%, ${c2} 50%, ${c2} 100%)` 
      } as React.CSSProperties;
    }

    const type = types[0];
    return { background: colors[type] || 'rgba(255, 255, 255, 0.05)' } as React.CSSProperties;
  };

  return (
    <div className={`pokemon-display-container ${isBusy ? 'busy' : ''}`} style={getBackgroundStyle()}>
      <div className="pokemon-level-badge">Lvl {level}</div>

      <div className="pokemon-display-name">
        {isEditing ? (
          <input
            autoFocus
            className="pokemon-name-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            maxLength={16}
          />
        ) : (
          <span 
            className={onRename ? 'editable-name' : ''} 
            onClick={(e) => {
              if (onRename) {
                e.stopPropagation();
                setIsEditing(true);
              }
            }}
          >
            {displayName}
          </span>
        )}
      </div>

      <img 
        src={pokemonSrc} 
        alt={displaySpecies} 
        className={imgClass} 
        draggable="false" 
      />

      {/* BARRE D'XP / TIMER */}
      <div className="xp-bar-container">
        <div
          className={`xp-bar-fill ${isTimer ? 'timer' : 'xp'}`}
          style={{ '--progress': percent + '%' } as React.CSSProperties}
        />
      </div>

      <div className="xp-text">
        {text}
      </div>
    </div>
  );
}
