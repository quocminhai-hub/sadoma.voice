import React, { useState, useRef } from 'react';

const ScriptEditor = ({ text, onChange, placeholder }) => {
  const [isTranslating, setIsTranslating] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const parsedText = parseSrt(content);
      onChange(parsedText);
    };
    reader.readAsText(file);
    event.target.value = null;
  };

  const parseSrt = (srtContent) => {
    const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const blocks = normalized.split(/\n\n+/);
    
    let textOnly = [];
    for (const block of blocks) {
      if (!block.trim()) continue;
      const lines = block.split('\n');
      let textStartIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('-->')) {
          textStartIndex = i + 1;
          break;
        }
      }
      
      if (textStartIndex !== -1 && textStartIndex < lines.length) {
        const textLines = lines.slice(textStartIndex).join('\n').trim();
        if (textLines) {
          textOnly.push(textLines);
        }
      }
    }
    return textOnly.join('\n');
  };

  const handleImportSrtClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="script-editor-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '300px', background: 'rgba(10, 10, 15, 0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '10px' }}>
        <input 
          type="file" 
          accept=".srt" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleFileUpload} 
        />
        <button 
          onClick={handleImportSrtClick} 
          className="translate-btn"
          title="Nhập nội dung từ file .srt"
          style={{ padding: '5px 10px', background: '#444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          📄 Tải file .srt
        </button>
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
