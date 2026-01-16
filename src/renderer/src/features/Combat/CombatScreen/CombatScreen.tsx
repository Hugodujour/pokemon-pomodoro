import React, { useEffect, useRef, useState } from 'react';
import './CombatScreen.css';

interface CombatPokemon {
  label: string;
  level: number;
  speciesId: string;
}

interface CombatScreenProps {
  playerPokemon: CombatPokemon;
  opponentPokemon: CombatPokemon & { hp: number; maxHp: number };
  log: string[];
  onAttack: () => void;
  onFlee: () => void;
  playerHp: number;
  maxPlayerHp: number;
  opponentHp: number;
  maxOpponentHp: number;
  isFinished: boolean;
  onClose: () => void;
  result: 'win' | 'lose' | 'flee' | string | null;
  captured?: boolean;
}

export default function CombatScreen({ 
  playerPokemon, 
  opponentPokemon, 
  log, 
  onAttack, 
  onFlee, 
  playerHp, 
  maxPlayerHp, 
  opponentHp, 
  maxOpponentHp,
  isFinished,
  onClose,
  result,
  captured
}: CombatScreenProps): React.ReactElement {
  
  // Victory sequence state
  // phases: 'fighting' -> 'throw_ball' -> 'shake_ball' -> 'caught' | 'broke_out' -> 'finished'
  const [victoryPhase, setVictoryPhase] = useState<'fighting' | 'throw_ball' | 'shake_ball' | 'caught' | 'broke_out' | 'finished'>('fighting');

  // Animation states
  const [animPlayer, setAnimPlayer] = useState(false);
  const [animOpponent, setAnimOpponent] = useState(false);
  const [prevLogLength, setPrevLogLength] = useState(0);

  useEffect(() => {
    if (log.length > prevLogLength) {
      const newLines = log.slice(prevLogLength);
      
      // Check for keywords in French log messages
      const attackLog = newLines.slice().reverse().find(line => line.includes('inflige'));
      
      if (attackLog) {
        const isOpponent = attackLog.startsWith("L'ennemi");
        
        if (isOpponent) {
             // Opponent attack
             setAnimOpponent(true);
             setTimeout(() => setAnimOpponent(false), 200);
        } else {
             // Player attack
             setAnimPlayer(true);
             setTimeout(() => setAnimPlayer(false), 200);
        }
      }
    }
    setPrevLogLength(log.length);
  }, [log, prevLogLength]);

  const logViewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      if (logViewportRef.current) {
        logViewportRef.current.scrollTop = logViewportRef.current.scrollHeight;
      }
    };
    
    // Immediate scroll
    scrollToBottom();
    
    // Small delay to account for potential layout shifts or status messages rendering
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [log, victoryPhase]);

  // Auto-combat effect
  useEffect(() => {
    if (!isFinished) {
      const timer = setInterval(() => {
        onAttack();
      }, 700);
      return () => clearInterval(timer);
    }
    return undefined;
  }, [isFinished, onAttack]);

  useEffect(() => {
    if (isFinished) {
      if (result === 'win') {
        // Capture Sequence
        const t1 = setTimeout(() => {
          setVictoryPhase('throw_ball');
          
          const t2 = setTimeout(() => {
             // Ball hits -> Pokemon absorbed
             setVictoryPhase('shake_ball');

             const t3 = setTimeout(() => {
                // Shaking done -> Check result
                if (captured) {
                  setVictoryPhase('caught');
                  setTimeout(() => setVictoryPhase('finished'), 800);
                } else {
                  setVictoryPhase('broke_out');
                  setTimeout(() => setVictoryPhase('finished'), 1000); // Flee time
                }
             }, 2200); // 3 shakes * ~0.7s
             return () => clearTimeout(t3);

          }, 600); // Throw duration
          return () => clearTimeout(t2);
        }, 500); // HP bar wait
        return () => clearTimeout(t1);
      } else {
        // Flee or loss
        setVictoryPhase('finished');
      }
    } else {
      setVictoryPhase('fighting');
    }
    return undefined;
  }, [isFinished, result, captured]);

  // Helper to get image URL
  const pokemonImages = import.meta.glob('../../../assets/pokemon/*.{gif,png,jpg,jpeg}', {
    eager: true
  });
  const pokeballIcon = (import.meta.glob('../../../assets/icon/pokeball.png', { eager: true })['../../../assets/icon/pokeball.png'] as any).default;

  const getPokemonImage = (speciesId: string): string | undefined => {
    return (Object.entries(pokemonImages).find(([path]) =>
      path.toLowerCase().includes(speciesId.toLowerCase())
    )?.[1] as any)?.default;
  }

  const playerHpPercent = (playerHp / maxPlayerHp) * 100;
  const opponentHpPercent = (opponentHp / maxOpponentHp) * 100;

  // Animation Classes
  const getOpponentClass = () => {
    let classes = 'combat-sprite-container ';
    if (animOpponent) classes += 'anim-attack-opponent ';
    
    // Capture animations
    if (victoryPhase === 'throw_ball') {
       // Ball incoming.. nothing yet
    } else if (['shake_ball', 'caught'].includes(victoryPhase)) {
       classes += 'anim-absorb '; // Shrink to 0
    } else if (victoryPhase === 'broke_out') {
       classes += 'anim-breakout '; // Grow back
    } else if (victoryPhase === 'finished' && result === 'win' && !captured) {
       classes += 'anim-flee '; // Fade away
    } else if (victoryPhase === 'finished' && result === 'win' && captured) {
       classes += 'anim-absorb '; // Stay hidden
    }
    
    return classes;
  }

  const getPokeballClass = () => {
    let classes = 'pokeball-icon ';
    if (victoryPhase === 'throw_ball') classes += 'anim-throw ';
    else if (victoryPhase === 'shake_ball') classes += 'anim-shake ';
    else if (victoryPhase === 'caught') classes += 'anim-caught ';
    else if (victoryPhase === 'broke_out') classes += 'anim-breakout ';
    else if (victoryPhase === 'finished' && captured) classes += 'anim-caught '; // Stay visible
    return classes;
  }

  return (
    <div className="combat-screen-layout">
      {/* TOP: POKEMON DISPLAY */}
      <div className="combat-pokemon-top">
        {/* POKEBALL ANIMATION LAYER */}
        <img src={pokeballIcon} alt="pokeball" className={getPokeballClass()} />

        {/* PLAYER (Left) */}
        <div className="combat-fighter player">
           <div className={`combat-sprite-container ${animPlayer ? 'anim-attack-player' : ''}`}>
              <img src={getPokemonImage(playerPokemon.speciesId)} alt={playerPokemon.label} className="combat-sprite" />
           </div>
           <div className="combat-info">
              <div className="combat-name">{playerPokemon.label} <span className="combat-lvl">Lvl {playerPokemon.level}</span></div>
              <div className="combat-hp-bar">
                <div className="combat-hp-fill" style={{ '--progress': `${Math.max(0, playerHpPercent)}%` } as React.CSSProperties} />
              </div>
              <div className="combat-hp-text">{playerHp}/{maxPlayerHp}</div>
           </div>
        </div>

        <div className="combat-vs">
          {victoryPhase === 'finished' ? (
            <button 
              className={`btn-icon result-btn ${result === 'win' ? 'btn-primary' : 'btn-danger'}`} 
              onClick={onClose}
              title="Retour à l'accueil"
            >
              ↩
            </button>
          ) : (
            "VS"
          )}
        </div>

        {/* OPPONENT (Right) */}
        <div className="combat-fighter opponent">
           <div className={getOpponentClass()}>
              <img src={getPokemonImage(opponentPokemon.speciesId)} alt={opponentPokemon.label} className="combat-sprite" />
           </div>
           <div className="combat-info">
              <div className="combat-name">{opponentPokemon.label} <span className="combat-lvl">Lvl {opponentPokemon.level}</span></div>
              <div className="combat-hp-bar">
                <div className="combat-hp-fill opponent-hp" style={{ '--progress': `${Math.max(0, opponentHpPercent)}%` } as React.CSSProperties} />
              </div>
           </div>
        </div>
      </div>

      {/* MIDDLE: ACTION / RETURN BUTTON */}
      <div className="combat-action-middle">
        {/* Actions or additional UI could go here */}
      </div>

      {/* BOTTOM: LOGS */}
      <div className="section-divider">
         <div className="header-zone-label">Détails du combat</div>
      </div>

      <div className="combat-logs-bottom">
        <div className="logs-viewport" ref={logViewportRef}>
           {log.map((line, i) => (
             <div key={i} className="log-line">{line}</div>
           ))}
           {victoryPhase === 'finished' && result === 'win' && (
            <div className="log-line">
               {captured ? (
                 <strong>{opponentPokemon.label} capturé !</strong>
               ) : (
                 <strong>Le {opponentPokemon.label} sauvage s'est échappé...</strong>
               )}
             </div>
           )}
           {victoryPhase === 'finished' && result === 'flee' && (
             <div className="log-line">Vous avez pris la fuite.</div>
           )}
           {victoryPhase === 'finished' && result === 'lose' && (
             <div className="log-line">Votre Pokémon est K.O...</div>
           )}
        </div>
      </div>
    </div>
  );
}
