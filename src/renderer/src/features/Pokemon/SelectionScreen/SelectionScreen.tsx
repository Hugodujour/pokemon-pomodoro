import React, { useState } from 'react';
import Team from '../Team/Team';
import StorageSystem from '../StorageSystem/StorageSystem';
import { useGame } from '../../../contexts/GameContext';
import { PokemonInstance } from '../../../types';
import './SelectionScreen.css';

interface DraggedItem {
  uuid: string;
  source: 'team' | 'storage';
}

function SelectionScreen() {
  const { 
    ownedPokemon, 
    teamIds, 
    setTeamIds, 
    activeId, 
    setActiveId,
    pokedex,
    reorderPokemon,
    isAdventureActive,
    isCombatActive
  } = useGame();

  const teamList = teamIds.map(id => {
    const instance = ownedPokemon.find(p => p.uuid === id);
    if (!instance) return null;
    const data = pokedex.find(p => p.id === instance.speciesId);
    const label = instance.nickname || (data ? data.label : instance.speciesId.toUpperCase());
    return { ...instance, label, types: data?.types } as any;
  }).filter((p): p is any => p !== null);

  const storageList = ownedPokemon.filter(p => !teamIds.includes(p.uuid)).map(instance => {
    const data = pokedex.find(p => p.id === instance.speciesId);
    const label = instance.nickname || (data ? data.label : instance.speciesId.toUpperCase());
    return { ...instance, label, types: data?.types } as any;
  });

  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);

  const handleDragStart = (_e: React.DragEvent, uuid: string, source: 'team' | 'storage') => {
    setDraggedItem({ uuid, source });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnTeam = async (targetUuid: string | null, targetIndex: number | null) => {
    if (!draggedItem) return;
    
    const { uuid, source } = draggedItem;
    let newTeam = [...teamIds];

    if (source === 'storage') {
      // Replace or Add
      if (targetIndex !== null && targetIndex < 3) {
        if (newTeam[targetIndex]) {
          // Replace existing
          if ((isAdventureActive || isCombatActive) && newTeam[targetIndex] === activeId) {
             console.warn("Cannot replace active pokemon during adventure/combat");
             setDraggedItem(null);
             return;
          }
          newTeam[targetIndex] = uuid;
        } else {
          // Fill empty slot (if it was an empty index)
          newTeam[targetIndex] = uuid;
        }
      } else if (newTeam.length < 3) {
        newTeam.push(uuid);
      }
    } else if (source === 'team') {
      const oldIndex = newTeam.indexOf(uuid);
      const actualTargetIndex = targetUuid ? newTeam.indexOf(targetUuid) : (targetIndex !== null ? targetIndex : -1);

      if (oldIndex !== -1 && actualTargetIndex !== -1 && oldIndex !== actualTargetIndex) {
        const temp = newTeam[actualTargetIndex];
        newTeam[actualTargetIndex] = newTeam[oldIndex];
        newTeam[oldIndex] = temp;
      }
    }

    const uniqueTeam = [...new Set(newTeam.filter(Boolean))].slice(0, 3) as string[];
    await setTeamIds(uniqueTeam);
    if (window.api && activeId) window.api.selectPokemon(activeId, false);
    setDraggedItem(null);
  };

  const handleDropOnStorage = async (targetUuid: string | null = null) => {
    if (!draggedItem) return;
    const { uuid, source } = draggedItem;

    if (source === 'team') {
      if ((isAdventureActive || isCombatActive) && uuid === activeId) {
         setDraggedItem(null);
         return;
      }

      if (teamIds.length > 1) {
        const newTeam = teamIds.filter(id => id !== uuid);
        await setTeamIds(newTeam);
        if (activeId === uuid) {
          await setActiveId(newTeam[0]);
        }
        if (window.api && activeId) window.api.selectPokemon(activeId, false);
      }
    } else if (source === 'storage') {
      if (isAdventureActive || isCombatActive) {
        setDraggedItem(null);
        return;
      }
      if (targetUuid && uuid !== targetUuid) {
        const storageUuids = storageList.map(p => p.uuid);
        const oldIndex = storageUuids.indexOf(uuid);
        const targetIndex = storageUuids.indexOf(targetUuid);
        
        if (oldIndex !== -1 && targetIndex !== -1) {
          const newOrder = [...storageUuids];
          const temp = newOrder[targetIndex];
          newOrder[targetIndex] = newOrder[oldIndex];
          newOrder[oldIndex] = temp;
          await reorderPokemon(newOrder);
        }
      }
    }
    setDraggedItem(null);
  };

  const handleSelectActive = async (id: string) => {
    if (isAdventureActive || isCombatActive) return;
    await setActiveId(id);
    if (window.api) {
      window.api.selectPokemon(id, false);
    }
  };

  const handleWithdraw = async (uuid: string) => {
    if (isAdventureActive || isCombatActive) return;
    if (teamIds.length < 3) {
      const newTeam = [...teamIds, uuid];
      await setTeamIds(newTeam);
      if (window.api && activeId) window.api.selectPokemon(activeId, false);
    }
  };

  const handleRemoveFromTeam = async (uuid: string) => {
    if (isAdventureActive || isCombatActive) return;

    if (teamIds.length > 1) {
      const newTeam = teamIds.filter(id => id !== uuid);
      await setTeamIds(newTeam);
      
      let newActive = activeId;
      if (activeId === uuid) {
        newActive = newTeam[0];
        await setActiveId(newActive);
      }
      if (window.api && newActive) window.api.selectPokemon(newActive, false);
    }
  };

  const isBusy = isAdventureActive || isCombatActive;

  return (
    <div className={`selection-screen ${isBusy ? 'is-busy' : ''}`}>
      <div className="app-header">
        <div className="header-zone-label">
          {isBusy ? 'AVENTURE EN COURS' : 'GESTION DE L\'EQUIPE'}
        </div>
        <div className="window-controls">
          <button 
            className="win-btn minimize" 
            onClick={() => window.api?.minimize()} 
            title="Reduire"
          >−</button>
          <button className="win-btn close" onClick={() => {
            if (activeId) {
              window.api.selectPokemon(activeId);
            } else {
              window.api.close();
            }
          }}>×</button>
        </div>
      </div>
      
      <div className="selection-content">
        <Team 
          team={teamList} 
          activeId={activeId} 
          onSelect={handleSelectActive} 
          onRemove={handleRemoveFromTeam}
          onDragStart={(e, uuid) => handleDragStart(e, uuid, 'team')}
          onDragEnd={() => setDraggedItem(null)}
          onDragOver={handleDragOver}
          onDrop={handleDropOnTeam}
          isBusy={isAdventureActive || isCombatActive}
        />
      </div>

      <div className="section-divider">
        <div className="header-zone-label">POKéMONs STOCKES (PC)</div>
      </div>
      
      <div className="selection-content">
        <div 
          className="storage-section drop-zone"
          onDragOver={handleDragOver}
          onDrop={() => handleDropOnStorage(null)}
        >
          <StorageSystem 
            storedPokemon={storageList} 
            onWithdraw={handleWithdraw} 
            visible={true}
            onDragStart={(e, uuid) => handleDragStart(e, uuid, 'storage')}
            onDragEnd={() => setDraggedItem(null)}
            onDragOver={handleDragOver}
            onDrop={(targetUuid) => handleDropOnStorage(targetUuid)}
          />
        </div>
      </div>
    </div>
  );
}

export default SelectionScreen;
