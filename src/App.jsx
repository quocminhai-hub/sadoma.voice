import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import VoiceSelector from './components/VoiceSelector';
import VibeSelector from './components/VibeSelector';
import ScriptEditor from './components/ScriptEditor';
import FooterAction from './components/FooterAction';
import VoiceCloningModal from './components/VoiceCloningModal';
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
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

  const fetchVoicesData = () => {
    if (!apiKey) return;
    
    Promise.all([
      fetch('/api/proxy?url=/v1/voice-list/?page_size=1000', { headers: { 'Authorization': `Bearer ${apiKey}` } }).then(res => res.json()),
      fetch('/api/proxy?url=/v1/cloned-voice-list/?page_size=1000', { headers: { 'Authorization': `Bearer ${apiKey}` } }).then(res => res.json()).catch(() => ({ results: [] }))
    ])
    .then(([prebuiltData, clonedData]) => {
      const prebuiltList = prebuiltData.results || prebuiltData.data || [];
      const clonedList = clonedData.results || clonedData.data || [];

      let formattedVoices = [];

      if (Array.isArray(prebuiltList)) {
        formattedVoices = [...formattedVoices, ...prebuiltList.map(v => ({
          id: v.uuid || v.id || v.voice_id, 
          name: v.character || v.name || v.voice_name,
          language: v.language || '',
          otherLanguages: v.other_languages || [],
          gender: v.gender ? v.gender.toLowerCase() : '',
          avatar: v.avatar_url || '',
          quality: v.quality || '',
          isMultilingual: v.is_multilingual || false,
          isClone: false
        }))];
      }

      if (Array.isArray(clonedList)) {
        formattedVoices = [...formattedVoices, ...clonedList.map(v => ({
          id: v.uuid || v.id || v.voice_id, 
          name: (v.character || v.name || v.voice_name) + ' (Clone)',
          language: v.language || 'vi', 
          otherLanguages: v.other_languages || ['vi-VN'],
          gender: v.gender ? v.gender.toLowerCase() : 'all',
          avatar: v.avatar_url || '',
          quality: v.quality || '',
          isMultilingual: v.is_multilingual || false,
          isClone: true
        }))];
      }

      if (formattedVoices.length > 0) {
        const priorityNames = ['onyx', 'minh', 'khôi', 'khoi', 'huy', 'hieu', 'hiếu', 'namminh'];
        formattedVoices.sort((a, b) => {
          if (a.isClone && !b.isClone) return -1;
          if (!a.isClone && b.isClone) return 1;

          const scoreA = getVoiceScore(a, priorityNames);
          const scoreB = getVoiceScore(b, priorityNames);
          if (scoreA !== scoreB) {
            return scoreB - scoreA;
          }
          return a.name.localeCompare(b.name);
        });

        setVoices(formattedVoices);
        // Only set selectedVoice if it's empty, so we don't override user selection on refresh
        setSelectedVoice(prev => prev || formattedVoices[0].id);
      }
    })
    .catch(console.error);
  };

  useEffect(() => {
    fetchVoicesData();
  }, [apiKey]);

  const getVoiceScore = (v, priorityNames) => {
    const name = v.name.toLowerCase();
    
    const isPriorityName = priorityNames.some(p => name.includes(p));
    if (isPriorityName) return 100;
    
    const isVi = v.language.startsWith('vi') || v.otherLanguages.includes('vi-VN');
    if (isVi && v.gender === 'female') return 50;
    
    return 0;
  };

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
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setIsCloneModalOpen(true)}
              style={{
                padding: '8px 12px', background: '#4CAF50', color: '#fff',
                border: 'none', borderRadius: '4px', cursor: 'pointer',
                fontSize: '13px', fontWeight: 'bold'
              }}
            >
              + Tạo giọng (Clone)
            </button>
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
            placeholder={selectedVibe.id === 'custom' ? "Gõ yêu cầu / Kịch bản của bạn tại đây..." : "Nhập văn bản..."}
          />
        </div>
      </div>

      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}

      <FooterAction 
        onPlay={handlePlay} 
        isLoading={isLoading} 
        audioUrl={audioUrl} 
      />

      <VoiceCloningModal 
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        apiKey={apiKey}
        onSuccess={fetchVoicesData}
      />
    </>
  );
}

export default App;
