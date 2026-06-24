import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import VoiceSelector from './components/VoiceSelector';
import VibeSelector from './components/VibeSelector';
import ScriptEditor from './components/ScriptEditor';
import FooterAction from './components/FooterAction';
import { generateSpeech } from './services/openai';
import { VIBES } from './constants';

function App() {
  const [apiKey, setApiKey] = useState('31fab03df4736b426e831a6a16ed576e7a6339bc');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all'); // 'all', 'vi', 'en'
  const [selectedGender, setSelectedGender] = useState('all'); // 'all', 'male', 'female'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVibe, setSelectedVibe] = useState(VIBES[0]);
  const [scriptText, setScriptText] = useState(VIBES[0].script);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (apiKey) {
      fetch('/unmixr-api/v1/voice-list/?page_size=1000', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })
      .then(res => res.json())
      .then(data => {
        const voiceList = data.results || data.data || [];
        if (Array.isArray(voiceList) && voiceList.length > 0) {
          const formattedVoices = voiceList.map(v => ({ 
            id: v.uuid || v.id || v.voice_id, 
            name: v.character || v.name || v.voice_name,
            language: v.language || '',
            otherLanguages: v.other_languages || [],
            gender: v.gender ? v.gender.toLowerCase() : '',
            avatar: v.avatar_url || '',
            quality: v.quality || '',
            isMultilingual: v.is_multilingual || false
          }));
          setVoices(formattedVoices);
          setSelectedVoice(formattedVoices[0].id);
        }
      })
      .catch(console.error);
    }
  }, [apiKey]);

  const filteredVoices = voices.filter(v => {
    // Lọc theo ngôn ngữ
    let passLang = true;
    if (selectedLanguage !== 'all') {
      const isVi = v.language.startsWith('vi') || v.otherLanguages.includes('vi-VN');
      const isEn = v.language.startsWith('en') || v.otherLanguages.includes('en-US');
      if (selectedLanguage === 'vi') passLang = isVi;
      else if (selectedLanguage === 'en') passLang = isEn;
    }

    // Lọc theo giới tính
    let passGender = true;
    if (selectedGender !== 'all') {
      passGender = v.gender === selectedGender;
    }

    // Lọc theo tìm kiếm
    let passSearch = true;
    if (searchQuery.trim() !== '') {
      passSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase());
    }

    return passLang && passGender && passSearch;
  });

  const handleFilterChange = (type, value) => {
    let newLang = selectedLanguage;
    let newGender = selectedGender;
    let newSearch = searchQuery;

    if (type === 'language') newLang = value;
    if (type === 'gender') newGender = value;
    if (type === 'search') newSearch = value;

    if (type === 'language') setSelectedLanguage(value);
    if (type === 'gender') setSelectedGender(value);
    if (type === 'search') setSearchQuery(value);

    const filtered = voices.filter(v => {
      let passL = true, passG = true, passS = true;
      if (newLang !== 'all') {
        const isVi = v.language.startsWith('vi') || v.otherLanguages.includes('vi-VN');
        const isEn = v.language.startsWith('en') || v.otherLanguages.includes('en-US');
        passL = newLang === 'vi' ? isVi : isEn;
      }
      if (newGender !== 'all') passG = v.gender === newGender;
      if (newSearch.trim() !== '') passS = v.name.toLowerCase().includes(newSearch.toLowerCase());
      return passL && passG && passS;
    });

    if (filtered.length > 0 && !filtered.find(v => v.id === selectedVoice)) {
      setSelectedVoice(filtered[0].id);
    } else if (filtered.length === 0) {
      setSelectedVoice('');
    }
  };

  const handleVibeChange = (vibe) => {
    setSelectedVibe(vibe);
    setScriptText(vibe.script);
  };

  const handlePlay = async () => {
    if (!apiKey) {
      setError('Vui lòng nhập API Key ở góc phải trên cùng.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const url = await generateSpeech(scriptText, selectedVoice, apiKey);
      setAudioUrl(url);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi gọi API.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header apiKey={apiKey} setApiKey={setApiKey} />
      
      <div className="section">
        <div className="section-title no-line" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span>VOICE (UNMIXR)</span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Tìm tên..." 
              value={searchQuery}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="language-select"
              style={{ width: '120px' }}
            />
            <select 
              value={selectedGender} 
              onChange={(e) => handleFilterChange('gender', e.target.value)}
              className="language-select"
            >
              <option value="all">Giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
            <select 
              value={selectedLanguage} 
              onChange={(e) => handleFilterChange('language', e.target.value)}
              className="language-select"
            >
              <option value="all">Ngôn ngữ</option>
              <option value="vi">Tiếng Việt</option>
              <option value="en">Tiếng Anh</option>
            </select>
          </div>
        </div>
        <VoiceSelector 
          voices={filteredVoices}
          selectedVoice={selectedVoice} 
          onSelect={setSelectedVoice} 
        />
      </div>

      <div className="main-grid">
        <div className="vibe-section">
          <div className="section-title">VIBE</div>
          <VibeSelector 
            selectedVibe={selectedVibe} 
            onSelect={handleVibeChange} 
          />
          <div className="vibe-desc">
            <p><strong>Voice:</strong> {selectedVibe.voiceDesc}</p>
            <br/>
            <p><strong>Tone:</strong> {selectedVibe.toneDesc}</p>
          </div>
        </div>

        <div className="script-section">
          <div className="section-title">SCRIPT</div>
          <ScriptEditor 
            text={scriptText} 
            onChange={setScriptText} 
          />
        </div>
      </div>

      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}

      <FooterAction 
        onPlay={handlePlay} 
        isLoading={isLoading} 
        audioUrl={audioUrl} 
      />
    </>
  );
}

export default App;
