import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const AudioUploader = ({ onUploadSuccess, isUploading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile) => {
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4'];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(mp3|wav|m4a)$/i)) {
      alert("Vui lòng chọn file âm thanh định dạng MP3, WAV hoặc M4A.");
      return;
    }
    setFile(selectedFile);
  };

  const triggerUpload = () => {
    if (file && onUploadSuccess) {
      onUploadSuccess(file);
    }
  };

  return (
    <div className="audio-uploader">
      <div 
        className={`upload-area ${dragActive ? "drag-active" : ""} ${file ? "has-file" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="audio/mp3, audio/wav, audio/m4a, .mp3, .wav, .m4a"
          onChange={handleChange}
          style={{ display: "none" }}
        />
        
        {isUploading ? (
          <div className="upload-state">
            <Loader className="spinner" size={40} color="#ffb020" />
            <p>Đang xử lý Cloning...</p>
          </div>
        ) : file ? (
          <div className="upload-state file-selected">
            <CheckCircle size={40} color="#4ade80" />
            <p className="filename">{file.name}</p>
            <p className="filesize">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            <div className="upload-actions">
              <button className="btn-upload" onClick={(e) => { e.stopPropagation(); triggerUpload(); }}>BẮT ĐẦU CLONE</button>
              <button className="btn-cancel" onClick={(e) => { e.stopPropagation(); setFile(null); }}>Hủy</button>
            </div>
          </div>
        ) : (
          <div className="upload-state">
            <UploadCloud size={40} color="#666" />
            <p>Kéo thả file âm thanh (MP3, WAV) vào đây</p>
            <span className="upload-hint">hoặc bấm để chọn file</span>
          </div>
        )}
      </div>
      <style>{`
        .audio-uploader {
          width: 100%;
          margin: 15px 0;
        }
        .upload-area {
          border: 2px dashed #444;
          border-radius: 12px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          background: #1a1a1a;
          transition: all 0.3s ease;
        }
        .upload-area.drag-active {
          border-color: #ffb020;
          background: rgba(255, 176, 32, 0.1);
        }
        .upload-area.has-file {
          border-color: #4ade80;
          border-style: solid;
          cursor: default;
        }
        .upload-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        .upload-state p {
          margin: 0;
          color: #eee;
          font-weight: 500;
        }
        .upload-hint {
          color: #888;
          font-size: 13px;
        }
        .filename {
          font-size: 16px;
          word-break: break-all;
        }
        .filesize {
          color: #888 !important;
          font-size: 13px;
        }
        .upload-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }
        .btn-upload {
          background: #ffb020;
          color: #000;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: bold;
          cursor: pointer;
        }
        .btn-cancel {
          background: #333;
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AudioUploader;
