import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import VoiceSelector from './components/VoiceSelector';
import VibeSelector from './components/VibeSelector';
import ScriptEditor from './components/ScriptEditor';
import FooterAction from './components/FooterAction';
import AudioUploader from './components/AudioUploader';
import { generateUnmixrSpeech, generateMinimaxSpeech, cloneMinimaxVoice } from './services/openai';
import { VIBES } from './constants';

function App() {
  // --- Unmixr State ---
  const [unmixrApiKey, setUnmixrApiKey] = useState('31fab03df4736b426e831a6a16ed576e7a6339bc');
  const [unmixrVoices, setUnmixrVoices] = useState([]);
  const [selectedUnmixrVoice, setSelectedUnmixrVoice] = useState('');
  
  // --- Minimax State ---
  const [minimaxApiKey, setMinimaxApiKey] = useState('sk-api-6YQ3QC4bSlarGroR4ozbrGWQHVcRVOTfnayoMUsazpIKemvzxQKgR4ldrK6icp7CStd9YOHzx4cN9Uz_fkj8ZpVujAzcHH4eOoJDUkzTwIW9prRwvbsh4aQ');
  const [minimaxGroupId, setMinimaxGroupId] = useState('2071140823059145067');
  const [clonedVoiceId, setClonedVoiceId] = useState('');
  const [isCloning, setIsCloning] = useState(false);

  // --- Shared/Common State ---
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVibe, setSelectedVibe] = useState(VIBES[0]);
  const [scriptText, setScriptText] = useState(VIBES[0].script);
  
  const [activeSection, setActiveSection] = useState('unmixr'); // 'unmixr' or 'minimax'
  
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (unmixrApiKey) {
      fetch('/api/proxy/v1/voice-list/?page_size=1000', {
        headers: { 'Authorization': `Bearer ${unmixrApiKey}` }
      })
      .then(async (res) => {
        if (!res.ok) throw new Error("Fetch failed");
        return res.json();
      })
      .then(data => {
        const voiceList = data.results || data.data || [];
        if (Array.isArray(voiceList) && voiceList.length > 0) {
          let formattedVoices = voiceList.map(v => ({ 
            id: v.uuid || v.id || v.voice_id, 
            name: v.character || v.name || v.voice_name,
            language: v.language || '',
            otherLanguages: v.other_languages || [],
            gender: v.gender ? v.gender.toLowerCase() : '',
            avatar: v.avatar_url || '',
            quality: v.quality || '',
            isMultilingual: v.is_multilingual || false
          }));

          const priorityNames = ['onyx', 'minh', 'khôi', 'khoi', 'huy', 'hieu', 'hiếu', 'namminh'];
          
          const getVoiceScore = (v, priorityNames) => {
            const name = v.name.toLowerCase();
            if (priorityNames.some(p => name.includes(p))) return 100;
            const isVi = v.language.startsWith('vi') || v.otherLanguages.includes('vi-VN');
            if (isVi) return v.gender === 'female' ? 50 : 40;
            return 0;
          };

          formattedVoices.sort((a, b) => {
            const scoreA = getVoiceScore(a, priorityNames);
            const scoreB = getVoiceScore(b, priorityNames);
            if (scoreA !== scoreB) return scoreB - scoreA;
            return a.name.localeCompare(b.name);
          });

          setUnmixrVoices(formattedVoices);
          if (formattedVoices.length > 0) {
            setSelectedUnmixrVoice(formattedVoices[0].id);
          }
        }
      })
      .catch(console.error);
    }
  }, [unmixrApiKey]);

  const filteredUnmixrVoices = unmixrVoices.filter(v => {
    let passLang = true;
    if (selectedLanguage !== 'all') {
      const isVi = v.language.startsWith('vi') || v.otherLanguages.includes('vi-VN');
      const isEn = v.language.startsWith('en') || v.otherLanguages.includes('en-US');
      if (selectedLanguage === 'vi') passLang = isVi;
      else if (selectedLanguage === 'en') passLang = isEn;
    }
    let passGender = true;
    if (selectedGender !== 'all') passGender = v.gender === selectedGender;
    let passSearch = true;
    if (searchQuery.trim() !== '') passSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase());
    return passLang && passGender && passSearch;
  });

  const handleVibeChange = (vibe) => {
    setSelectedVibe(vibe);
    setScriptText(vibe.script);
  };

  const handleCloneUpload = async (file) => {
    if (!minimaxApiKey || !minimaxGroupId) {
      setError("Thiếu API Key hoặc Group ID của Minimax!");
      return;
    }
    setError(null);
    setIsCloning(true);
    try {
      const voiceId = await cloneMinimaxVoice(file, minimaxApiKey, minimaxGroupId);
      setClonedVoiceId(voiceId);
      setActiveSection('minimax');
      alert(`Clone giọng thành công! Voice ID của bạn là: ${voiceId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCloning(false);
    }
  };

  const handlePlay = async () => {
    setError(null);
    setIsLoading(true);
    setAudioUrl(null);
    
    try {
      let url;
      if (activeSection === 'unmixr') {
        if (!unmixrApiKey || !selectedUnmixrVoice) throw new Error("Vui lòng nhập Unmixr API Key và chọn giọng.");
        url = await generateUnmixrSpeech(scriptText, selectedUnmixrVoice, unmixrApiKey, selectedVibe);
      } else {
        if (!minimaxApiKey || !minimaxGroupId || !clonedVoiceId) {
          throw new Error("Vui lòng nhập Minimax API Key, Group ID và upload audio để clone giọng.");
        }
        url = await generateMinimaxSpeech(scriptText, clonedVoiceId, minimaxApiKey, minimaxGroupId, selectedVibe);
      }
      setAudioUrl(url);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi gọi API.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      
      {/* NỬA TRÊN: UNMIXR TTS */}
      <div className="section" onClick={() => setActiveSection('unmixr')} style={{ border: activeSection === 'unmixr' ? '2px solid #ffb020' : '2px solid transparent', padding: '10px' }}>
        <div className="section-title no-line" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span>1. TEXT-TO-SPEECH (UNMIXR)</span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#888' }}>Unmixr API Key:</span>
            <input 
              type="password" 
              className="api-input" 
              value={unmixrApiKey}
              onChange={(e) => setUnmixrApiKey(e.target.value)}
              style={{ width: '200px' }}
            />
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <input 
            type="text" 
            placeholder="Tìm tên..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="language-select"
            style={{ width: '120px' }}
          />
          <select value={selectedGender} onChange={(e) => setSelectedGender(e.target.value)} className="language-select">
            <option value="all">Giới tính</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
          <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} className="language-select">
            <option value="all">Ngôn ngữ</option>
            <option value="vi">Tiếng Việt</option>
            <option value="en">Tiếng Anh</option>
          </select>
        </div>

        <VoiceSelector 
          voices={filteredUnmixrVoices}
          selectedVoice={selectedUnmixrVoice} 
          onSelect={setSelectedUnmixrVoice} 
        />
      </div>

      <hr style={{ borderColor: '#333', margin: '20px 0' }} />

      {/* NỬA DƯỚI: MINIMAX CLONING */}
      <div className="section" onClick={() => setActiveSection('minimax')} style={{ border: activeSection === 'minimax' ? '2px solid #ffb020' : '2px solid transparent', padding: '10px' }}>
        <div className="section-title no-line" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span>2. VOICE CLONING (MINIMAX)</span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#888' }}>Group ID:</span>
            <input 
              type="text" 
              className="api-input" 
              value={minimaxGroupId}
              onChange={(e) => setMinimaxGroupId(e.target.value)}
              style={{ width: '150px' }}
            />
            <span style={{ fontSize: '12px', color: '#888' }}>Minimax Key:</span>
            <input 
              type="password" 
              className="api-input" 
              value={minimaxApiKey}
              onChange={(e) => setMinimaxApiKey(e.target.value)}
              style={{ width: '150px' }}
            />
          </div>
        </div>

        <AudioUploader onUploadSuccess={handleCloneUpload} isUploading={isCloning} />
        
        {clonedVoiceId && (
          <div style={{ marginTop: '10px', color: '#4ade80' }}>
            <strong>Đã Clone xong! Voice ID hiện tại: </strong> {clonedVoiceId}
          </div>
        )}
      </div>

      <div className="main-grid" style={{ marginTop: '20px' }}>
        <div className="vibe-section">
          <div className="section-title">VIBE</div>
          <VibeSelector selectedVibe={selectedVibe} onSelect={handleVibeChange} />
        </div>

        <div className="script-section">
          <div className="section-title">SCRIPT (Áp dụng cho {activeSection.toUpperCase()})</div>
          <ScriptEditor 
            text={scriptText} 
            onChange={setScriptText} 
            placeholder="Gõ yêu cầu / Kịch bản của bạn tại đây..."
          />
        </div>
      </div>

      {error && <div style={{ color: 'red', marginTop: '10px', padding: '10px', background: '#300', borderRadius: '5px' }}>{error}</div>}

      <FooterAction 
        onPlay={handlePlay} 
        isLoading={isLoading} 
        audioUrl={audioUrl} 
      />
    </>
  );
}

export default App;
