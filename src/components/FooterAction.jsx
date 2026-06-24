import React, { useRef } from 'react';
import { Download, Share, Play, Loader } from 'lucide-react';

const FooterAction = ({ onPlay, isLoading, audioUrl }) => {
  const audioRef = useRef(null);

  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = 'openai-fm-demo.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("Chưa có âm thanh nào được tạo. Hãy nhấn PLAY trước.");
    }
  };

  const handleShare = () => {
    alert("Tính năng chia sẻ đang được phát triển.");
  };

  return (
    <div>
      <div className="footer-actions">
        <button className="btn btn-download" onClick={handleDownload}>
          <Download size={20} />
          DOWNLOAD
        </button>
        <button className="btn btn-share" onClick={handleShare}>
          <Share size={20} />
          SHARE
        </button>
        <button 
          className="btn btn-play" 
          onClick={onPlay} 
          disabled={isLoading}
        >
          {isLoading ? <Loader size={24} className="animate-spin" /> : <Play size={24} fill="white" />}
          PLAY
        </button>
      </div>

      {audioUrl && (
        <audio 
          ref={audioRef} 
          controls 
          autoPlay 
          src={audioUrl} 
          className="audio-player" 
        />
      )}
    </div>
  );
};

export default FooterAction;
