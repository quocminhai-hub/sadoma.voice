import React from 'react';

const VoiceSelector = ({ voices, selectedVoice, onSelect }) => {
  return (
    <div className="voice-grid-container">
      {voices.length === 0 ? <div style={{padding: '15px'}}>Đang tải danh sách giọng...</div> : voices.map((voice) => {
        const isSelected = selectedVoice === voice.id;
        return (
          <div 
            key={voice.id} 
            className={`voice-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(voice.id)}
          >
            <div className="voice-avatar-wrapper">
              <img src={voice.avatar || 'https://resource.unmixr.com/avatar/default-0.png'} alt={voice.name} className="voice-avatar" />
              {isSelected && <div className="voice-selected-badge">✓</div>}
            </div>
            <div className="voice-details">
              <div className="voice-name-row">
                <span className="voice-name">{voice.name} {voice.quality && <span className="voice-quality">{voice.quality}</span>}</span>
              </div>
              <div className="voice-meta">
                <span className="voice-gender">{voice.gender}</span>
                {voice.isMultilingual && <span className="voice-multilingual">🌍 Multilingual</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VoiceSelector;
