import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Timer from '../Timer/Timer';
import PokemonDisplay from '../PokemonDisplay/PokemonDisplay';
import Team from '../Team/Team';
import StorageSystem from '../StorageSystem/StorageSystem';
import CombatScreen from '../CombatScreen/CombatScreen';
import { pokedex } from '../../data/pokedex';
import { createCandyTimer } from '../../utils/candyTimer';
import { getLevel, checkEvolution } from '../../utils/leveling';
import { useCombat } from '../../hooks/useCombat';
import { zones } from '../../data/zones';
import candyIcon from '../../assets/icon/rare_candy.png';
import './Widget.css';

function Widget() {
  // --- STATE ---
  const candyTimer = useRef(createCandyTimer(0, 300));

  const [ownedPokemon, setOwnedPokemon] = useState(() => {
    try {
      const stored = localStorage.getItem('ownedPokemon');
      if (stored) return JSON.parse(stored);
      const oldUnlocked = localStorage.getItem('unlockedPokemon');
      if (oldUnlocked) {
        const ids = JSON.parse(oldUnlocked);
        const oldXpData = JSON.parse(localStorage.getItem('xpData') || '{}');
        return ids.map(speciesId => {
          const xp = oldXpData[speciesId] || 0;
          const { level } = getLevel(xp);
          return { uuid: uuidv4(), speciesId, xp, level, dateCaught: new Date().toISOString() };
        });
      }
    } catch (e) {
      console.error('Error loading ownedPokemon:', e);
    }
    const starters = ['pikachu', 'bulbizarre', 'salameche', 'carapuce'];
    return starters.map(speciesId => ({ uuid: uuidv4(), speciesId, xp: 0, level: 1, dateCaught: new Date().toISOString() }));
  });

  const [teamIds, setTeamIds] = useState(() => {
    try {
      const stored = localStorage.getItem('teamIds');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.length > 3 ? parsed.slice(0, 3) : parsed;
      }
    } catch (e) {
      console.error('Error loading teamIds:', e);
    }
    return [];
  });

  const [activeId, setActiveId] = useState(() => localStorage.getItem('activeId') || null);
  const [candies, setCandies] = useState(() => Number(localStorage.getItem('candies')) || 0);
  const [inventory, setInventory] = useState(() => {
    try {
      const stored = localStorage.getItem('inventory');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Error loading inventory:', e);
      return {};
    }
  });
  const [showStorage, setShowStorage] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [busyPokemonId, setBusyPokemonId] = useState(null);
  const [selectedZone, setSelectedZone] = useState('forest');
  const [isAdventureRunning, setIsAdventureRunning] = useState(false);
  const timerRef = useRef();

  // --- LOGIC ---
  const getActiveInstance = () => ownedPokemon.find(p => p.uuid === activeId);

  const updatePokemon = (uuid, updates) => {
    setOwnedPokemon(prev => prev.map(p => (p.uuid === uuid ? { ...p, ...updates } : p)));
  };

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

  // --- EFFECTS ---
  useEffect(() => { localStorage.setItem('ownedPokemon', JSON.stringify(ownedPokemon)); }, [ownedPokemon]);
  useEffect(() => { localStorage.setItem('teamIds', JSON.stringify(teamIds)); }, [teamIds]);
  useEffect(() => { localStorage.setItem('activeId', activeId); }, [activeId]);
  useEffect(() => { localStorage.setItem('candies', candies); }, [candies]);
  useEffect(() => { localStorage.setItem('inventory', JSON.stringify(inventory)); }, [inventory]);

  // Ensure team and active are set on load
  useEffect(() => {
    if (ownedPokemon.length > 0) {
      if (teamIds.length === 0) {
        const newTeam = ownedPokemon.slice(0, 3).map(p => p.uuid);
        setTeamIds(newTeam);
        if (!activeId) setActiveId(newTeam[0]);
      } else if (!activeId || !ownedPokemon.find(p => p.uuid === activeId)) {
        setActiveId(teamIds[0] || ownedPokemon[0].uuid);
      }
    }
  }, [ownedPokemon, teamIds, activeId]);

  const handleTick = useCallback(seconds => {
    if (candyTimer.current.tick(seconds)) setCandies(c => c + 1);
  }, []);

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
    setOwnedPokemon(prev => prev.map(p => (p.uuid === active.uuid ? { ...p, ...updates } : p)));
  }, [candies, activeId, ownedPokemon, busyPokemonId]);

  const handleBuyStone = useCallback(() => {
    if (candies >= 50 && busyPokemonId !== activeId) {
      setCandies(c => c - 50);
      setInventory(inv => ({ ...inv, 'pierre-foudre': (inv['pierre-foudre'] || 0) + 1 }));
    }
  }, [candies, busyPokemonId, activeId]);

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
  }, [busyPokemonId, activeId, inventory]);

  const handleWithdraw = uuid => {
    if (teamIds.length < 3) setTeamIds(prev => [...prev, uuid]);
  };

  const handleRemoveFromTeam = uuid => {
    if (uuid === busyPokemonId) return;
    if (teamIds.length > 1) {
      setTeamIds(prev => prev.filter(id => id !== uuid));
      if (activeId === uuid) setActiveId(null);
    }
  };

  const handleSelectActive = id => {
    if (busyPokemonId) return;
    setActiveId(id);
  };

  const teamList = teamIds.map(id => {
    const instance = ownedPokemon.find(p => p.uuid === id);
    if (!instance) return null;
    const data = pokedex.find(p => p.id === instance.speciesId);
    return { ...instance, label: data ? data.label : '???' };
  }).filter(Boolean);

  const storageList = ownedPokemon.filter(p => !teamIds.includes(p.uuid)).map(instance => {
    const data = pokedex.find(p => p.id === instance.speciesId);
    return { ...instance, label: data ? data.label : '???' };
  });

  const activeInstance = getActiveInstance();

  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const handlePokemonClick = () => setShowTeamSelector(true);

  return (
    <div className="app-container">
      {/* MODAL OVERLAYS */}
      {showTeamSelector && (
        <div className="modal-overlay" onClick={() => setShowTeamSelector(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowTeamSelector(false)}>×</button>
            <h2 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Choisir un Pokémon</h2>
            <Team team={teamList} activeId={activeId} onSelect={id => { handleSelectActive(id); setShowTeamSelector(false); }} onRemove={handleRemoveFromTeam} />
            <div style={{ marginTop: '2rem', borderTop: '1px solid #444', paddingTop: '1rem', textAlign: 'center' }}>
              <button className="btn-toggle-storage" onClick={() => setShowStorage(prev => !prev)}>
                {showStorage ? 'Fermer PC' : 'Accéder au PC'}
              </button>
              {showStorage && (
                <StorageSystem storedPokemon={storageList} onWithdraw={handleWithdraw} visible={true} />
              )}
            </div>
          </div>
        </div>
      )}

      {showShop && (
        <div className="modal-overlay" onClick={() => setShowShop(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowShop(false)}>×</button>
            <h4 className="shop-title" style={{ marginTop: '1rem' }}>Boutique Pokémon</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="shop-inventory">Pierres Foudre possédées: {inventory['pierre-foudre'] || 0}</div>
              <button className="btn-primary" onClick={handleBuyStone} disabled={candies < 50}>Acheter Pierre Foudre (50 🍬)</button>
              {activeInstance && pokedex.find(p => p.id === activeInstance.speciesId)?.evolutions?.some(e => e.type === 'item' && inventory[e.item] > 0) && (
                <button className="btn-evolve" onClick={handleEvolveWithStone} disabled={busyPokemonId === activeId}>Faire évoluer {activeInstance.speciesId}!</button>
              )}
            </div>
          </div>
        </div>
      )}

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
        />
      )}

      {/* WIDGET LAYOUT */}
      <div className="active-pokemon-section">
        {activeInstance && (
          <div onClick={handlePokemonClick} title="Cliquez pour changer de Pokémon">
            <PokemonDisplay name={activeInstance.speciesId.toUpperCase()} xp={activeInstance.xp} />
          </div>
        )}
      </div>

      <div className="widget-middle-section">
        {!isAdventureRunning && (
          <div className="candy-display" title="Bonbons disponibles" onClick={giveCandy} style={{ cursor: 'pointer' }}>
            <img src={candyIcon} alt="candy" />
            <span style={{ fontWeight: 'bold', marginRight: '5px' }}>{candies}</span>
            <span style={{ fontSize: '0.9rem' }}>+</span>
          </div>
        )}
        <div style={{ display: isAdventureRunning ? 'block' : 'none' }}>
          <Timer ref={timerRef} onFinish={handlePomodoroFinish} onTick={handleTick} onStart={handleTimerStart} />
        </div>
      </div>

      <div className="adventure-controls">
        <select value={selectedZone} onChange={e => { setSelectedZone(e.target.value); setShowShop(false); }} disabled={isAdventureRunning} title="Choisir une zone">
          {zones.map(z => (
            <option key={z.id} value={z.id}>
              {z.label} {z.type === 'city' ? '🏙️' : '🌲'}
            </option>
          ))}
        </select>
        {zones.find(z => z.id === selectedZone)?.type === 'city' ? (
          <button className="btn-primary" onClick={() => setShowShop(true)} title="Ouvrir la boutique" style={{ fontSize: '1.2rem', padding: '5px' }}>🏪</button>
        ) : (
          !isAdventureRunning ? (
            <button className="btn-primary" onClick={() => { if (activeId) { setIsAdventureRunning(true); setBusyPokemonId(activeId); timerRef.current.start(); } }} title="Démarrer l'aventure" style={{ fontSize: '1.2rem', padding: '5px' }}>▶</button>
          ) : (
            <button className="btn-primary" style={{ backgroundColor: '#e74c3c', fontSize: '1.2rem', padding: '5px' }} onClick={() => { setIsAdventureRunning(false); timerRef.current.reset(); setBusyPokemonId(null); }} title="Arrêter">⏹</button>
          )
        )}
      </div>
    </div>
  );
}

export default Widget;
