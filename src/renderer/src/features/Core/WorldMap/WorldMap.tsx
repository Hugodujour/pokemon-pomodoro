import React, { useEffect, useState } from 'react';
import './WorldMap.css';

interface Zone {
  id: string;
  label: string;
  type: 'city' | 'wild';
  x: number;
  y: number;
  pokemon: string[];
}

export default function WorldMap() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const allZones = await window.gameAPI.getZones();
      setZones(allZones);
      const state = await window.gameAPI.getState();
      setActiveZoneId(state.activeZoneId || 'bourg-palette');
    };
    loadData();
  }, []);

  const handleSelect = (zoneId: string) => {
    window.api.selectZone(zoneId);
  };

  return (
    <div className="world-map-container">
      <div className="map-header">
        <h2 className="map-title">Carte de Kanto</h2>
        <button className="map-close" onClick={() => window.api.close()}>×</button>
      </div>

      <div className="map-canvas">
        {/* Connection lines (simplified) */}
        <div className="map-routes">
            <div className="route vertical" style={{ left: 108, top: 120, height: 280 }}></div>
            <div className="route horizontal" style={{ left: 100, top: 86, width: 150 }}></div>
        </div>

        {zones.map((zone) => (
          <div
            key={zone.id}
            className={`map-point ${zone.type} ${activeZoneId === zone.id ? 'active' : ''}`}
            style={{ left: zone.x, top: zone.y }}
            onClick={() => handleSelect(zone.id)}
            title={zone.label}
          >
            <div className="point-inner"></div>
            <div className="point-label">{zone.label}</div>
            {activeZoneId === zone.id && (
                <div className="player-marker">🏃</div>
            )}
          </div>
        ))}
      </div>

      <div className="map-footer">
        Cliquez sur un lieu pour voyager
      </div>
    </div>
  );
}
