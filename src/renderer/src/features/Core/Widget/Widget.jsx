import { useState, useRef, useCallback } from 'react';
import Timer from '../Timer/Timer';
import PokemonDisplay from '../../Pokemon/PokemonDisplay/PokemonDisplay';
import CombatScreen from '../../Combat/CombatScreen/CombatScreen';
import { pokedex } from '../../../data/pokedex';
import { createCandyTimer } from '../../../utils/candyTimer';
import { getLevel, checkEvolution } from '../../../utils/leveling';
import { useCombat } from '../../../hooks/useCombat';
import { zones } from '../../../data/zones';
import { useGame } from '../../../contexts/GameContext';
import candyIcon from '../../../assets/icon/rare_candy.png';
import './Widget.css';

function Widget() {
  const { 
    ownedPokemon, 
    setOwnedPokemon, 
    teamIds, 
    setTeamIds, 
    activeId, 
    setActiveId, // Potentially unused here directly if handled by hook/context but good to have
    candies, 
    setCandies, 
    inventory, 
    setInventory, 
    updatePokemon,
    getActiveInstance 
  } = useGame();

  // --- LOCAL UI STATE ---
  const candyTimer = useRef(createCandyTimer(0, 300));
  const ADVENTURE_DURATION = 0.1 * 60;

  const [showShop, setShowShop] = useState(false);
  const [busyPokemonId, setBusyPokemonId] = useState(null);
  const [selectedZone, setSelectedZone] = useState('forest');
  const [isAdventureRunning, setIsAdventureRunning] = useState(false);
  const [timerState, setTimerState] = useState({ current: ADVENTURE_DURATION, total: ADVENTURE_DURATION });
  const timerRef = useRef();

  // --- LOGIC ---
  const { combatState, startCombat, handleAttack, handleFlee, closeCombat } = useCombat({
    ownedPokemon,
    updatePokemon,
    setOwnedPokemon,
    setTeamIds,
    teamIds,
    setCandies,
    activeId,
    busyPokemonId,
    setBusyPokemonId,
    selectedZone,
  });

  const handleTick = useCallback(seconds => {
    if (candyTimer.current.tick(seconds)) setCandies(c => c + 1);
  }, [setCandies]);

  const handleTimerStart = useCallback(() => {
    setBusyPokemonId(activeId);
  }, [activeId]);

  const handlePomodoroFinish = useCallback(() => {
    const currentFighter = busyPokemonId || activeId;
    const active = ownedPokemon.find(p => p.uuid === currentFighter);
    if (!active) return;
    startCombat();
  }, [activeId, busyPokemonId, ownedPokemon, startCombat]);

  const giveCandy = useCallback(() => {
    if (candies <= 0 || busyPokemonId === activeId) return;
    const active = ownedPokemon.find(p => p.uuid === activeId);
    if (!active) return;
    const XP_AMOUNT = 40;
    const newXp = active.xp + XP_AMOUNT;
    const { level } = getLevel(newXp);
    setCandies(c => c - 1);
    const nextSpecies = checkEvolution(active.speciesId, newXp, pokedex);
    const updates = { xp: newXp, level };
    if (nextSpecies) updates.speciesId = nextSpecies;
    updatePokemon(active.uuid, updates); // Use context function
  }, [candies, activeId, ownedPokemon, busyPokemonId, setCandies, updatePokemon]);

  const handleBuyStone = useCallback(() => {
    if (candies >= 50 && busyPokemonId !== activeId) {
      setCandies(c => c - 50);
      setInventory(inv => ({ ...inv, 'pierre-foudre': (inv['pierre-foudre'] || 0) + 1 }));
    }
  }, [candies, busyPokemonId, activeId, setCandies, setInventory]);

  const handleEvolveWithStone = useCallback(() => {
    if (busyPokemonId === activeId) return;
    const active = getActiveInstance();
    if (!active) return;
    const pData = pokedex.find(p => p.id === active.speciesId);
    if (!pData?.evolutions) return;
    const itemEvo = pData.evolutions.find(e => e.type === 'item' && inventory[e.item] > 0);
    if (itemEvo) {
      setInventory(inv => ({ ...inv, [itemEvo.item]: inv[itemEvo.item] - 1 }));
      updatePokemon(active.uuid, { speciesId: itemEvo.to });
    }
  }, [busyPokemonId, activeId, inventory, getActiveInstance, setInventory, updatePokemon]);

  const handlePokemonClick = () => {
    if (window.api) {
      window.api.openSelectionWindow();
    }
  };

  const handleTimerUpdate = useCallback((rem, total) => {
    setTimerState({ current: rem, total });
  }, []);

  const activeInstance = getActiveInstance();

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
              {activeInstance && pokedex.find(p => p.id === activeInstance.speciesId)?.evolutions?.some(e => e.type === 'item' && inventory[e.item] > 0) && (
                <button className="btn-primary w-full" onClick={handleEvolveWithStone} disabled={busyPokemonId === activeId}>Faire évoluer {activeInstance.speciesId}!</button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="active-pokemon-section">
        {combatState.active && combatState.opponent && activeInstance && (
          <CombatScreen
            playerPokemon={{ label: pokedex.find(p => p.id === activeInstance.speciesId)?.label, level: activeInstance.level, speciesId: activeInstance.speciesId }}
            opponentPokemon={combatState.opponent}
            log={combatState.log}
            playerHp={combatState.playerHp}
            maxPlayerHp={combatState.maxPlayerHp}
            opponentHp={combatState.opponent.hp}
            maxOpponentHp={combatState.opponent.maxHp}
            onAttack={handleAttack}
            onFlee={handleFlee}
            isFinished={combatState.isFinished}
            onClose={() => {
              closeCombat();
              if (isAdventureRunning) {
                timerRef.current.reset();
                setIsAdventureRunning(false);
              }
            }}
            result={combatState.result}
            captured={combatState.captured}
          />
        )}

        {activeInstance && (
          <div 
            className={`pokemon-trigger ${combatState.active ? 'hidden' : 'block'}`}
            onClick={!combatState.active ? handlePokemonClick : undefined} 
            title="Cliquez pour changer de Pokémon"
          >
            <PokemonDisplay
              name={activeInstance.speciesId.toUpperCase()}
              xp={activeInstance.xp}
              isAdventureRunning={isAdventureRunning}
              timerState={timerState}
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
