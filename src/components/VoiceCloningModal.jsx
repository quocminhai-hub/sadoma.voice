import React, { useState, useRef } from 'react';
import { cloneVoice } from '../services/openai';

const VoiceCloningModal = ({ isOpen, onClose, apiKey, onSuccess }) => {
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleClone = async () => {
    if (!apiKey) {
      setError('Vui lòng nhập API Key ở góc phải trên cùng màn hình.');
      return;
    }
    if (!name.trim()) {
      setError('Vui lòng nhập tên cho giọng nói này.');
      return;
    }
    if (!file) {
      setError('Vui lòng chọn một file âm thanh (.mp3, .wav).');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await cloneVoice(file, name, 'Giọng Clone tạo từ ứng dụng', apiKey);
      onSuccess(); // Refresh voice list
      setName('');
      setFile(null);
      onClose();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi tạo giọng nói (Clone).');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.7)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        backgroundColor: '#1a1a2e', padding: '24px', borderRadius: '12px',
        width: '90%', maxWidth: '400px', border: '1px solid #333'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#fff' }}>Tạo giọng nói mới (Clone)</h3>
        
        {error && <div style={{ color: '#ff4d4f', marginBottom: '15px', fontSize: '14px' }}>{error}</div>}
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>Tên giọng nói</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Giọng Test Việt"
            style={{ 
              width: '100%', padding: '10px', borderRadius: '6px', 
              border: '1px solid #444', backgroundColor: '#0f0f1a', color: '#fff',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '14px' }}>File âm thanh mẫu (tối ưu nhất 1-2 phút)</label>
          <input 
            type="file" 
            accept="audio/mpeg, audio/wav, .mp3, .wav" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '8px 12px', borderRadius: '6px', border: '1px solid #444',
                backgroundColor: '#2a2a3e', color: '#fff', cursor: 'pointer'
              }}
            >
              Chọn File
            </button>
            <span style={{ color: '#aaa', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file ? file.name : 'Chưa chọn file nào'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button 
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: '10px 16px', borderRadius: '6px', border: '1px solid #444',
              backgroundColor: 'transparent', color: '#ccc', cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            Hủy
          </button>
          <button 
            onClick={handleClone}
            disabled={isLoading}
            style={{
              padding: '10px 16px', borderRadius: '6px', border: 'none',
              backgroundColor: '#4CAF50', color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isLoading ? 'Đang tạo...' : 'Tạo Giọng'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceCloningModal;
