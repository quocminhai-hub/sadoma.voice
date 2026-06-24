import React from 'react';
import { ToggleRight } from 'lucide-react';

const Header = ({ apiKey, setApiKey }) => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">Sadoma Voices</div>
        <div className="header-desc">
          An interactive demo for developers to try our latest text-to-speech models powered by Unmixr API.
          <br/>
          <a href="#" className="start-building">START BUILDING ↗</a>
        </div>
      </div>
      <div className="header-right">
        <input 
          type="password" 
          className="api-input" 
          placeholder="Nhập OpenAI API Key..." 
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <div className="code-toggle">
          &lt;/&gt;
          <ToggleRight size={32} color="#ccc" />
        </div>
      </div>
    </header>
  );
};

export default Header;
