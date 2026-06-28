import React from 'react';
import { ToggleRight } from 'lucide-react';

const Header = () => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo">Sadoma Voices (All-in-One)</div>
        <div className="header-desc">
          An interactive demo for developers to try Text-to-Speech powered by Unmixr & Minimax.
        </div>
      </div>
      <div className="header-right">
        <div className="code-toggle">
          &lt;/&gt;
          <ToggleRight size={32} color="#ccc" />
        </div>
      </div>
    </header>
  );
};

export default Header;
