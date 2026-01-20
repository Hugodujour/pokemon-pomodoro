import { useState, useRef, useCallback, useEffect } from 'react';
import Timer, { TimerHandle } from '../Timer/Timer';
import PokemonDisplay from '../../Pokemon/PokemonDisplay/PokemonDisplay';
import CombatScreen from '../../Combat/CombatScreen/CombatScreen';
import { useCombat } from '../../../hooks/useCombat';
import { useGame } from '../../../contexts/GameContext';
import candyIcon from '../../../assets/icon/rare_candy.png';
import exclamationIcon from '../../../assets/icon/exclamation.png';
import startIcon from '../../../assets/icon/start.png';
import stopIcon from '../../../assets/icon/stop.png';
import pokedexIcon from '../../../assets/icon/pokedex.png';
import mapIcon from '../../../assets/icon/map.png';
import './Widget.css';

const HOVER_MESSAGES = {
  IDLE: "Aucune action en cours.",
  CANDY: "Donner un SUPER BONBON (+40 XP).",
  POKEDEX: "Consulter le POKEDEX (Indisponible)",
  STORAGE: "Gérer l'équipe et le stockage.",
  MAP: "Changer de zone (Indisponible)",
  SHOP: "Aller à la boutique du Bourg",
  ADVENTURE_START: "Chercher un POKéMON sauvage.",
  ADVENTURE_STOP: "Interrompre la mission en cours",
  RENAME: "Changer le nom du POKéMON."
};

function Widget() {
  const {
    ownedPokemon,
    activeId,
    candies,
    inventory,
    pokedex,
    zones,
    getActiveInstance,
    refreshState,
    useCandy,
    updatePokemon
  } = useGame();

  // --- LOCAL UI STATE ---
  const ADVENTURE_DURATION = 0.1 * 60;

  const [showShop, setShowShop] = useState(false);
  const [busyPokemonId, setBusyPokemonId] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState('forest');
  const [hoverText, setHoverText] = useState(HOVER_MESSAGES.IDLE);
  const [isAdventureRunning, setIsAdventureRunning] = useState(false);
  const [timerState, setTimerState] = useState({ current: ADVENTURE_DURATION, total: ADVENTURE_DURATION });
  const [isMinimalist, setIsMinimalist] = useState(false);
  const timerRef = useRef<TimerHandle>(null);

  // --- COMBAT (IPC) ---
  const { combatState, startCombat, handleAttack, handleFlee, closeCombat } = useCombat({
    activeId,
    busyPokemonId,
    selectedZone,
    refreshState
  });

  // --- TIMER HANDLERS ---
  const handleTick = useCallback(async (_seconds: number) => {
    // Candy generation is handled in Main process now
  }, []);

  const handleTimerStart = useCallback(() => {
    setBusyPokemonId(activeId);
  }, [activeId]);

  const handlePomodoroFinish = useCallback(() => {
    startCombat();
  }, [startCombat]);

  const handleTimerUpdate = useCallback((rem: number, total: number) => {
    setTimerState({ current: rem, total });
  }, []);

  // --- ACTIONS (Using IPC) ---
  const giveCandy = useCallback(async () => {
    if (candies <= 0 || busyPokemonId === activeId) return;
    await useCandy();
  }, [candies, activeId, busyPokemonId, useCandy]);

  const handleBuyStone = useCallback(async () => {
    if (candies >= 50 && busyPokemonId !== activeId) {
      const result = await window.gameAPI.buyStone();
      if (result.success) {
        await refreshState();
      }
    }
  }, [candies, busyPokemonId, activeId, refreshState]);

  const handleEvolveWithStone = useCallback(async () => {
    if (busyPokemonId === activeId) return;
    const active = getActiveInstance();
    if (!active) return;

    const result = await window.gameAPI.evolveWithStone(active.uuid, 'pierre-foudre');
    if (result.success) {
      await refreshState();
    }
  }, [busyPokemonId, activeId, getActiveInstance, refreshState]);

  const handlePokemonClick = () => {
    if (isMinimalist) {
      toggleMinimalist();
      return;
    }
    if (window.api) {
      window.api.openSelectionWindow();
    }
  };

  const toggleMinimalist = useCallback(() => {
    const nextMode = !isMinimalist;
    setIsMinimalist(nextMode);
    if (window.api?.toggleMinimalist) {
      window.api.toggleMinimalist(nextMode);
    }
  }, [isMinimalist]);

  const handleCloseCombat = useCallback(async () => {
    // Reset combat state via hook (IPC + local state)
    await closeCombat();

    // Ensure adventure is stopped and busy state is cleared
    setIsAdventureRunning(false);
    setBusyPokemonId(null);
    setIsMinimalist(false); // Return to home screen
    if (window.api?.toggleMinimalist) {
      window.api.toggleMinimalist(false);
    }

    if (window.gameAPI?.setAdventureActive) {
      window.gameAPI.setAdventureActive(false);
    }

    if (timerRef.current) {
      timerRef.current.reset();
    }
  }, [closeCombat, setIsMinimalist]);

  // --- SYNC STATUS TO MAIN ---
  useEffect(() => {
    if (window.gameAPI?.setCombatActive) {
      window.gameAPI.setCombatActive(combatState.active);
    }
    if (window.api?.setCombatMode && !isMinimalist) {
      window.api.setCombatMode(combatState.active);
    }
  }, [combatState.active, isMinimalist]);

  useEffect(() => {
    if (window.gameAPI?.setAdventureActive) {
      window.gameAPI.setAdventureActive(isAdventureRunning);
    }
  }, [isAdventureRunning]);

  useEffect(() => {
    if (window.api?.onZoneSelected) {
      const unsubscribe = window.api.onZoneSelected((zoneId: string) => {
        setSelectedZone(zoneId);
      });
      return unsubscribe;
    }
    return undefined;
  }, []);

  const activeInstance = getActiveInstance();
  const activeSpeciesData = activeInstance ? pokedex.find(p => p.id === activeInstance.speciesId) : null;

  const getTypeBackground = (types: string[] = []) => {
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

  const handleRename = useCallback(async (newName: string) => {
    if (activeId) {
      await updatePokemon(activeId, { nickname: newName });
    }
  }, [activeId, updatePokemon]);

  if (ownedPokemon.length === 0) {
    const starterOptions = ['bulbizarre', 'carapuce', 'salameche', 'pikachu'];

    const getTypeBackground = (types: string[] = []) => {
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
      <div className="app-container">
        <div className="app-header">
          <div className="header-zone-label">CHOISISSEZ VOTRE STARTER</div>
          <div className="window-controls">
            <button
              className="win-btn minimize"
              onClick={() => window.api?.minimize()}
              title="Réduire"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >−</button>
            <button
              className="win-btn close"
              onClick={() => window.api?.close()}
              title="Fermer"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >×</button>
          </div>
        </div>

        <div className="starter-selection">
          <div className="starter-grid">
            {starterOptions.map(id => {
              const p = pokedex.find(pData => pData.id === id);
              // Dynamic image lookup
              const pokemonImages = import.meta.glob('../../../assets/pokemon/mini/*.{gif,png}', { eager: true });
              const src = (Object.entries(pokemonImages).find(([path]) => path.toLowerCase().includes(id.toLowerCase()))?.[1] as any)?.default;

              return (
                <div
                  key={id}
                  className="starter-card"
                  onClick={() => window.gameAPI.pickStarter(id)}
                  style={getTypeBackground(p?.types)}
                >
                  <div className="starter-level">Lvl 5</div>
                  <img src={src} alt={id} className="starter-img" />
                  <span className="starter-label">{p?.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-container ${isMinimalist ? 'minimal' : ''} ${isAdventureRunning ? 'running' : ''} ${combatState.active ? 'in-combat' : ''}`}>
      {/* --- WINDOW CONTROLS (Normal mode only) --- */}
      {!isMinimalist && (
        <div className="app-header">
          {combatState.active ? (
            <div className="header-zone-label">COMBAT EN COURS</div>
          ) : (
            <div className="header-zone-label">
              {zones.find(z => z.id === selectedZone)?.label}
            </div>
          )}
          <div className="window-controls">
            <button
              className="win-btn minimize"
              onClick={() => window.api?.minimize()}
              title="Réduire"
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >−</button>
            {!combatState.active && (
              <button
                className="win-btn minimize-mode"
                onClick={toggleMinimalist}
                title="Mode Minimaliste"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
              >
                🗗
              </button>
            )}
            <button
              className="win-btn close"
              onClick={() => {
                if (combatState.active) {
                  handleCloseCombat();
                } else {
                  window.api?.close();
                }
              }}
              title={combatState.active ? "Quitter le combat" : "Fermer"}
              style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >×</button>
          </div>
        </div>
      )}

      {/* --- MINIMALIST LAYOUT --- */}
      {isMinimalist && (
        combatState.active ? (
          <div
            className="minimal-box combat-box"
            onClick={(e) => { e.stopPropagation(); toggleMinimalist(); }}
            title="Combat disponible !"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <img src={exclamationIcon} alt="!" className="minimal-exclamation-img" />
          </div>
        ) : (
          <>
            <div className="minimal-box pokemon-box" onClick={handlePokemonClick}>
              <div className="minimal-timer">
                {isAdventureRunning ? `${String(Math.floor(timerState.current / 60)).padStart(2, '0')}:${String(timerState.current % 60).padStart(2, '0')}` : ''}
              </div>
              <div className="minimal-pokemon-slot" style={getTypeBackground(activeSpeciesData?.types)}>
                {activeInstance && (
                  <img
                    src={(Object.entries(import.meta.glob('../../../assets/pokemon/mini/*.{gif,png}', { eager: true })).find(([path]) => path.toLowerCase().includes(activeInstance!.speciesId.toLowerCase()))?.[1] as any)?.default}
                    alt="poke"
                    className="minimal-poke-img"
                    draggable="false"
                  />
                )}
              </div>
            </div>

            <div className="minimal-box control-box">
              <div className="minimal-controls">
                {!isAdventureRunning ? (
                  <button className="min-btn-play" onClick={() => {
                    if (activeId) {
                      setIsAdventureRunning(true);
                      setBusyPokemonId(activeId);
                      window.api?.closeSelectionWindow();
                      timerRef.current?.start();
                    }
                  }} title="Démarrer l'aventure">
                    <img src={startIcon} alt="play" className="btn-icon-img" draggable="false" />
                  </button>
                ) : (
                  <button className="min-btn-stop" onClick={() => { setIsAdventureRunning(false); timerRef.current?.reset(); setBusyPokemonId(null); }} title="Arrêter">
                    <img src={stopIcon} alt="stop" className="btn-icon-img" draggable="false" />
                  </button>
                )}
              </div>
            </div>
          </>
        )
      )}

      {/* --- NORMAL LAYOUT --- */}
      {!isMinimalist && (
        <>
          {showShop && (
            <div className="modal-overlay" onClick={() => setShowShop(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setShowShop(false)}>×</button>
                <h4 className="shop-title">Boutique Pokémon</h4>
                <div className="shop-actions">
                  <div className="shop-inventory">Pierres Foudre possédées: {inventory['pierre-foudre'] || 0}</div>
                  <button className="btn-primary w-full" onClick={handleBuyStone} disabled={candies < 50}>Acheter Pierre Foudre (50 🍬)</button>
                  {activeSpeciesData?.evolutions?.some(e => e.type === 'item' && (inventory[e.item!] || 0) > 0) && (
                    <button className="btn-primary w-full" onClick={handleEvolveWithStone} disabled={busyPokemonId === activeId}>Faire évoluer {activeInstance?.speciesId}!</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {combatState.active && combatState.opponent && activeInstance ? (
            <CombatScreen
              playerPokemon={{
                label: activeSpeciesData?.label || activeInstance.speciesId,
                level: activeInstance.level,
                speciesId: activeInstance.speciesId
              }}
              opponentPokemon={combatState.opponent}
              log={combatState.log}
              playerHp={combatState.playerHp}
              maxPlayerHp={combatState.maxPlayerHp}
              opponentHp={combatState.opponent.hp}
              maxOpponentHp={combatState.opponent.maxHp}
              onAttack={handleAttack}
              onFlee={handleFlee}
              isFinished={combatState.isFinished}
              onClose={handleCloseCombat}
              result={combatState.result}
              captured={combatState.captured}
            />
          ) : (
            <>
              <div className="main-content-row">
                <div className="side-controls left">
                  {/* Always show controls, disable candy if running */}
                  <>
                    <button
                      className="action-btn-square candy-btn"
                      onClick={giveCandy}
                      disabled={isAdventureRunning}
                      onMouseEnter={() => setHoverText(HOVER_MESSAGES.CANDY)}
                      onMouseLeave={() => setHoverText(HOVER_MESSAGES.IDLE)}
                    >
                      <img src={candyIcon} alt="candy" draggable="false" />
                      <span className="candy-count-badge">{candies}</span>
                    </button>
                    <button
                      className="action-btn-square pokedex-btn"
                      disabled
                      onClick={() => { /* Open Pokedex */ }}
                      onMouseEnter={() => setHoverText(HOVER_MESSAGES.POKEDEX)}
                      onMouseLeave={() => setHoverText(HOVER_MESSAGES.IDLE)}
                    >
                      <img src={pokedexIcon} alt="pokedex" className="btn-icon-img" draggable="false" />
                    </button>
                  </>
                </div>

                <div className="active-pokemon-section">
                  {activeInstance && (
                    <div
                      className="pokemon-trigger"
                      onClick={handlePokemonClick}
                      onMouseEnter={() => setHoverText(HOVER_MESSAGES.STORAGE)}
                      onMouseLeave={() => setHoverText(HOVER_MESSAGES.IDLE)}
                    >
                      <PokemonDisplay
                        name={activeInstance.speciesId.toUpperCase()}
                        xp={activeInstance.xp}
                        isAdventureRunning={isAdventureRunning}
                        timerState={timerState}
                        isBusy={isAdventureRunning || combatState.active}
                        nickname={activeInstance.nickname}
                        onRename={handleRename}
                        onNameMouseEnter={() => setHoverText(HOVER_MESSAGES.RENAME)}
                        onNameMouseLeave={() => setHoverText(HOVER_MESSAGES.STORAGE)}
                        types={activeSpeciesData?.types || []}
                      />
                    </div>
                  )}
                </div>

                <div className="side-controls right">
                  {!combatState.active && (
                    <>
                      <button
                        className="action-btn-square map-btn"
                        onClick={() => window.api?.openMapWindow()}
                        disabled
                        onMouseEnter={() => setHoverText(HOVER_MESSAGES.MAP)}
                        onMouseLeave={() => setHoverText(HOVER_MESSAGES.IDLE)}
                      >
                        <img src={mapIcon} alt="map" className="btn-icon-img" draggable="false" />
                      </button>

                      {zones.find(z => z.id === selectedZone)?.type === 'city' ? (
                        <button
                          className="action-btn-square map-btn"
                          onClick={() => setShowShop(true)}
                          onMouseEnter={() => setHoverText(HOVER_MESSAGES.SHOP)}
                          onMouseLeave={() => setHoverText(HOVER_MESSAGES.IDLE)}
                        >
                          🏪
                        </button>
                      ) : (
                        !isAdventureRunning ? (
                          <button className="action-btn-square play-btn" onClick={() => {
                            if (activeId) {
                              setIsAdventureRunning(true);
                              setBusyPokemonId(activeId);
                              window.api?.closeSelectionWindow();
                              timerRef.current?.start();
                              if (!isMinimalist) toggleMinimalist();
                            }
                          }}
                            onMouseEnter={() => setHoverText(HOVER_MESSAGES.ADVENTURE_START)}
                            onMouseLeave={() => setHoverText(HOVER_MESSAGES.IDLE)}
                          >
                            <img src={startIcon} alt="play" className="btn-icon-img" draggable="false" />
                          </button>
                        ) : (
                          <button
                            className="action-btn-square stop-btn"
                            onClick={() => { setIsAdventureRunning(false); timerRef.current?.reset(); setBusyPokemonId(null); }}
                            onMouseEnter={() => setHoverText(HOVER_MESSAGES.ADVENTURE_STOP)}
                            onMouseLeave={() => setHoverText(HOVER_MESSAGES.IDLE)}
                          >
                            <img src={stopIcon} alt="stop" className="btn-icon-img" draggable="false" />
                          </button>
                        )
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="widget-middle-section">
                {/* Zone label moved to header */}
              </div>

              <div className="adventure-controls">
                {/* Controls moved to side-controls */}
              </div>

              {/* POKEMON DIALOG BOX */}
              <div className="help-box-container">
                <div className="help-box-title">ACTION</div>
                <div className="pokemon-help-box">
                  <div className="help-box-content">
                    {hoverText}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* --- PERSISTENT TIMER (Logic Only) --- */}
      <div className="hidden">
        <Timer
          ref={timerRef}
          initialDuration={ADVENTURE_DURATION}
          onFinish={handlePomodoroFinish}
          onTick={handleTick}
          onStart={handleTimerStart}
          onUpdate={handleTimerUpdate}
        />
      </div>
    </div>
  );
}

export default Widget;
