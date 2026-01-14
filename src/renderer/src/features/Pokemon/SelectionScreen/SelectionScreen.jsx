import { useState } from 'react';
import Team from '../Team/Team';
import StorageSystem from '../StorageSystem/StorageSystem';
import { pokedex } from '../../../data/pokedex';
import { useGame } from '../../../contexts/GameContext';
import './SelectionScreen.css';

function SelectionScreen() {
  const { 
    ownedPokemon, 
    teamIds, 
    setTeamIds, 
    activeId, 
    setActiveId 
  } = useGame();

  const [showStorage, setShowStorage] = useState(false);

  const handleSelectActive = id => {
    setActiveId(id);
    if (window.api) {
      window.api.selectPokemon(id);
    }
  };

  const handleWithdraw = uuid => {
    if (teamIds.length < 3) {
      const newTeam = [...teamIds, uuid];
      setTeamIds(newTeam);
      if (window.api) window.api.selectPokemon(activeId, false); // No close
    }
  };

  const handleRemoveFromTeam = uuid => {
    if (teamIds.length > 1) {
      const newTeam = teamIds.filter(id => id !== uuid);
      setTeamIds(newTeam);
      let newActive = activeId;
      if (activeId === uuid) {
        newActive = newTeam[0];
        setActiveId(newActive);
      }
      if (window.api) window.api.selectPokemon(newActive, false); // No close
    }
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

  return (
    <div className="selection-screen">
      <div className="selection-header">
        <h2 className="selection-title">Choisir un Pokémon</h2>
        <button className="selection-close" onClick={() => window.api.selectPokemon(activeId)}>×</button>
      </div>
      
      <Team 
        team={teamList} 
        activeId={activeId} 
        onSelect={handleSelectActive} 
        onRemove={handleRemoveFromTeam} 
      />

      <div className="storage-section">
        <button className="btn-toggle-storage" onClick={() => setShowStorage(prev => !prev)}>
          {showStorage ? 'Fermer PC' : 'Accéder au PC'}
        </button>
        {showStorage && (
          <StorageSystem 
            storedPokemon={storageList} 
            onWithdraw={handleWithdraw} 
            visible={true} 
          />
        )}
      </div>
    </div>
  );
}

export default SelectionScreen;
