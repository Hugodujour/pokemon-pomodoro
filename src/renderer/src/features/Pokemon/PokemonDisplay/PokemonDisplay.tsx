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
  onRename
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

  return (
    <div className="pokemon-display-container">
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
        <span className="pokemon-display-lvl">Lvl {level}</span>
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
