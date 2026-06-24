import React, { useState } from 'react';

const ScriptEditor = ({ text, onChange, placeholder }) => {
  const [isTranslating, setIsTranslating] = useState(false);

  const translateText = async (targetLang) => {
    if (!text || !text.trim()) return;
    setIsTranslating(true);
    try {
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
      const data = await response.json();
      const translated = data[0].map(x => x[0]).join('');
      onChange(translated);
    } catch (err) {
      console.error('Translation error:', err);
      alert('Có lỗi xảy ra khi dịch.');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="script-editor-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '300px', background: 'rgba(10, 10, 15, 0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '10px' }}>
        <button 
          onClick={() => translateText('en')} 
          disabled={isTranslating}
          className="translate-btn"
          style={{ padding: '5px 10px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
        >
          {isTranslating ? 'Đang dịch...' : 'VI ➜ EN'}
        </button>
        <button 
          onClick={() => translateText('vi')} 
          disabled={isTranslating}
          className="translate-btn"
          style={{ padding: '5px 10px', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
        >
          {isTranslating ? 'Đang dịch...' : 'EN ➜ VI'}
        </button>
      </div>
      <textarea 
        className="script-editor-textarea" 
        value={text} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Nhập văn bản..."}
        style={{ width: '100%', flex: 1, resize: 'none', background: 'transparent', color: 'var(--text-primary)', border: 'none', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', lineHeight: '1.6' }}
      />
    </div>
  );
};

export default ScriptEditor;
