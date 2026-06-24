import React from 'react';

const ScriptEditor = ({ text, onChange }) => {
  return (
    <textarea 
      className="script-editor" 
      value={text} 
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default ScriptEditor;
