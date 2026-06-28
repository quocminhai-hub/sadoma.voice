import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import VoiceSelector from './components/VoiceSelector';
import ScriptEditor from './components/ScriptEditor';
import FooterAction from './components/FooterAction';
import { generateUnmixrSpeech } from './services/openai';
import { RANDOM_SCRIPTS } from './constants';
import { Download } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('sadoma_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [unmixrApiKey, setUnmixrApiKey] = useState('31fab03df4736b426e831a6a16ed576e7a6339bc');
  const [unmixrVoices, setUnmixrVoices] = useState([]);
  const [selectedUnmixrVoice, setSelectedUnmixrVoice] = useState('');
  
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Lấy ngẫu nhiên một script khi tải trang
  const [scriptText, setScriptText] = useState(() => {
    return RANDOM_SCRIPTS[Math.floor(Math.random() * RANDOM_SCRIPTS.length)];
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const [audioHistory, setAudioHistory] = useState([]);

  useEffect(() => {
    if (unmixrApiKey) {
      fetch('/api/proxy?url=/v1/voice-list/?page_size=1000', {
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

  const handlePlay = async () => {
    setError(null);
    setIsLoading(true);
    setAudioUrl(null);
    
    try {
      if (!unmixrApiKey || !selectedUnmixrVoice) throw new Error("Vui lòng nhập Unmixr API Key và chọn giọng.");
      const url = await generateUnmixrSpeech(scriptText, selectedUnmixrVoice, unmixrApiKey);
      setAudioUrl(url);
      
      // Tìm tên giọng đọc để lưu vào lịch sử
      const voiceObj = unmixrVoices.find(v => v.id === selectedUnmixrVoice);
      const voiceName = voiceObj ? voiceObj.name : 'Unknown Voice';

      // Lưu vào lịch sử
      setAudioHistory(prev => [{
        id: Date.now().toString(),
        url: url,
        text: scriptText.substring(0, 50) + (scriptText.length > 50 ? '...' : ''),
        voiceName: voiceName,
        timestamp: new Date().toLocaleTimeString()
      }, ...prev]);
      
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi gọi API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    // Mật khẩu mặc định là 'sadoma123'. 
    // Bạn có thể thêm biến môi trường VITE_SITE_PASSWORD vào project trên Vercel để đổi mật khẩu.
    const correctPassword = import.meta.env.VITE_SITE_PASSWORD || 'sadoma123';
    
    if (passwordInput === correctPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('sadoma_auth', 'true');
      setLoginError('');
    } else {
      setLoginError('Mật khẩu không đúng!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#121212', color: '#fff', padding: '20px' }}>
        <h2 style={{ marginBottom: '20px', color: '#ffb020' }}>Sadoma Voice - Private Access</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
          <input 
            type="password" 
            placeholder="Nhập mật khẩu..." 
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #444', background: '#222', color: '#fff', width: '280px', fontSize: '16px', outline: 'none' }}
          />
          <button type="submit" style={{ padding: '12px 20px', borderRadius: '8px', border: 'none', background: '#ffb020', color: '#000', fontWeight: 'bold', cursor: 'pointer', width: '280px', fontSize: '16px', transition: 'background 0.2s' }}>
            Đăng Nhập
          </button>
        </form>
        {loginError && <div style={{ color: '#ff4444', marginTop: '15px' }}>{loginError}</div>}
      </div>
    );
  }

  return (
    <>
      <Header />
      
      <div className="section" style={{ padding: '10px' }}>
        <div className="section-title no-line" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <span>TEXT-TO-SPEECH (UNMIXR)</span>
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

      <div className="main-grid" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
        <div className="script-section" style={{ maxWidth: '800px', width: '100%' }}>
          <div className="section-title">SCRIPT</div>
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

      {/* STORAGE SECTION */}
      {audioHistory.length > 0 && (
        <div className="section" style={{ marginTop: '20px', padding: '15px' }}>
          <div className="section-title">KHO LƯU TRỮ (HISTORY)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {audioHistory.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, marginRight: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ color: '#ffb020', fontWeight: 'bold' }}>{item.voiceName}</span>
                    <span style={{ color: '#888', fontSize: '12px' }}>{item.timestamp}</span>
                  </div>
                  <span style={{ color: '#ccc', fontSize: '13px', fontStyle: 'italic' }}>"{item.text}"</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <audio controls src={item.url} style={{ height: '35px', maxWidth: '250px' }}></audio>
                  <a 
                    href={item.url} 
                    download={`Sadoma_${item.voiceName}_${item.id}.mp3`}
                    style={{ background: '#222', color: 'white', padding: '8px', borderRadius: '5px', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #444', transition: '0.2s' }}
                    onMouseOver={e => e.currentTarget.style.background = '#444'}
                    onMouseOut={e => e.currentTarget.style.background = '#222'}
                    title="Tải xuống"
                  >
                    <Download size={18} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
