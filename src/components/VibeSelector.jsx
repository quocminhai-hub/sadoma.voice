import React from 'react';
import { VIBES } from '../constants';
import { RefreshCw } from 'lucide-react';

const VibeSelector = ({ selectedVibe, onSelect }) => {
  const handleRefresh = () => {
    const randomVibe = VIBES[Math.floor(Math.random() * VIBES.length)];
    onSelect(randomVibe);
  };

  return (
    <div className="vibe-grid">
      {VIBES.map((vibe) => {
        const isSelected = selectedVibe.id === vibe.id;
        return (
          <div 
            key={vibe.id} 
            className={`card vibe-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(vibe)}
          >
            <div className="card-title">{vibe.name}</div>
            <div className="card-indicator"></div>
          </div>
        );
      })}
      
      <div className="action-card vibe-card" onClick={handleRefresh}>
        <RefreshCw size={24} />
      </div>
    </div>
  );
};

export default VibeSelector;
