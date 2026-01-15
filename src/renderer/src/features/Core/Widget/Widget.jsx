import { useState, useRef, useCallback, useEffect } from 'react';
import Timer from '../Timer/Timer';
import PokemonDisplay from '../../Pokemon/PokemonDisplay/PokemonDisplay';
import CombatScreen from '../../Combat/CombatScreen/CombatScreen';
import { useCombat } from '../../../hooks/useCombat';
import { useGame } from '../../../contexts/GameContext';
import candyIcon from '../../../assets/icon/rare_candy.png';
import './Widget.css';

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
    useCandy
  } = useGame();

  // --- LOCAL UI STATE ---
  const ADVENTURE_DURATION = 0.1 * 60;

  const [showShop, setShowShop] = useState(false);
  const [busyPokemonId, setBusyPokemonId] = useState(null);
  const [selectedZone, setSelectedZone] = useState('forest');
  const [isAdventureRunning, setIsAdventureRunning] = useState(false);
  const [timerState, setTimerState] = useState({ current: ADVENTURE_DURATION, total: ADVENTURE_DURATION });
  const timerRef = useRef();

  // --- COMBAT (IPC) ---
  const { combatState, startCombat, handleAttack, handleFlee, closeCombat } = useCombat({
    activeId,
    busyPokemonId,
    selectedZone,
    refreshState
  });

  // --- TIMER HANDLERS ---
  const handleTick = useCallback(async (seconds) => {
    // Candy generation is handled in Main process now, but we can trigger it here
    // For simplicity, we'll add candies every tick via IPC
    // This could be optimized to batch calls
  }, []);

  const handleTimerStart = useCallback(() => {
    setBusyPokemonId(activeId);
  }, [activeId]);

  const handlePomodoroFinish = useCallback(() => {
    startCombat();
  }, [startCombat]);

  const handleTimerUpdate = useCallback((rem, total) => {
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
    if (window.api) {
      window.api.openSelectionWindow();
    }
  };

  const handleCloseCombat = useCallback(async () => {
    // Reset combat state via hook (IPC + local state)
    await closeCombat();
    
    // Ensure adventure is stopped and busy state is cleared
    setIsAdventureRunning(false);
    setBusyPokemonId(null);
    if (window.gameAPI?.setAdventureActive) {
      window.gameAPI.setAdventureActive(false);
    }
    
    if (timerRef.current) {
      timerRef.current.reset();
    }
  }, [closeCombat]);

  // --- SYNC STATUS TO MAIN ---
  useEffect(() => {
    if (window.gameAPI?.setCombatActive) {
      window.gameAPI.setCombatActive(combatState.active);
    }
  }, [combatState.active]);

  useEffect(() => {
    if (window.gameAPI?.setAdventureActive) {
      window.gameAPI.setAdventureActive(isAdventureRunning);
    }
  }, [isAdventureRunning]);

  const activeInstance = getActiveInstance();
  const activeSpeciesData = activeInstance ? pokedex.find(p => p.id === activeInstance.speciesId) : null;

  if (ownedPokemon.length === 0) {
    const starterOptions = ['bulbizarre', 'carapuce', 'salameche', 'pikachu'];
    return (
      <div className="app-container">
        <div className="window-controls">
          <button className="win-btn close" onClick={() => window.api?.close()} title="Fermer">×</button>
        </div>
        <div className="starter-selection">
          <h4 className="starter-title">Choisissez votre starter</h4>
          <div className="starter-grid">
            {starterOptions.map(id => {
              const p = pokedex.find(pData => pData.id === id);
              // Dynamic image lookup
              const pokemonImages = import.meta.glob('../../../assets/pokemon/*.{gif,png}', { eager: true });
              const src = Object.entries(pokemonImages).find(([path]) => path.toLowerCase().includes(id.toLowerCase()))?.[1]?.default;
              
              return (
                <div key={id} className="starter-card" onClick={() => window.gameAPI.pickStarter(id)}>
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
    <div className="app-container">
      <div className="window-controls">
        <button className="win-btn minimize" onClick={() => window.api?.minimize()} title="Réduire">−</button>
        <button className="win-btn close" onClick={() => window.api?.close()} title="Fermer">×</button>
      </div>

      {showShop && (
        <div className="modal-overlay" onClick={() => setShowShop(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowShop(false)}>×</button>
            <h4 className="shop-title">Boutique Pokémon</h4>
            <div className="shop-actions">
              <div className="shop-inventory">Pierres Foudre possédées: {inventory['pierre-foudre'] || 0}</div>
              <button className="btn-primary w-full" onClick={handleBuyStone} disabled={candies < 50}>Acheter Pierre Foudre (50 🍬)</button>
              {activeSpeciesData?.evolutions?.some(e => e.type === 'item' && inventory[e.item] > 0) && (
                <button className="btn-primary w-full" onClick={handleEvolveWithStone} disabled={busyPokemonId === activeId}>Faire évoluer {activeInstance.speciesId}!</button>
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
          <div className="active-pokemon-section">
            {activeInstance && (
              <div 
                className="pokemon-trigger"
                onClick={handlePokemonClick} 
                title="Cliquez pour changer de Pokémon"
              >
                <PokemonDisplay
                  name={activeInstance.speciesId.toUpperCase()}
                  xp={activeInstance.xp}
                  isAdventureRunning={isAdventureRunning}
                  timerState={timerState}
                  isBusy={isAdventureRunning || combatState.active}
                />
              </div>
            )}
          </div>

          <div className="widget-middle-section">
            {!isAdventureRunning && (
              <div className="candy-display clickable" title="Bonbons disponibles" onClick={giveCandy}>
                <img src={candyIcon} alt="candy" />
                <span className="candy-count">{candies}</span>
                <span className="candy-plus">+</span>
              </div>
            )}
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
        </>
      )}

      {!combatState.active && (
        <div className="adventure-controls">
          <select value={selectedZone} onChange={e => { setSelectedZone(e.target.value); setShowShop(false); }} disabled={isAdventureRunning} title="Choisir une zone">
            {zones.map(z => (
              <option key={z.id} value={z.id}>
                {z.label} {z.type === 'city' ? '🏙️' : '🌲'}
              </option>
            ))}
          </select>
          {zones.find(z => z.id === selectedZone)?.type === 'city' ? (
            <button className="btn-primary btn-icon" onClick={() => setShowShop(true)} title="Ouvrir la boutique">🏪</button>
          ) : (
            !isAdventureRunning ? (
              <button className="btn-primary btn-icon" onClick={() => { if (activeId) { setIsAdventureRunning(true); setBusyPokemonId(activeId); timerRef.current.start(); } }} title="Démarrer l'aventure">▶</button>
            ) : (
              <button className="btn-danger btn-icon" onClick={() => { setIsAdventureRunning(false); timerRef.current.reset(); setBusyPokemonId(null); }} title="Arrêter">⏹</button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default Widget;
