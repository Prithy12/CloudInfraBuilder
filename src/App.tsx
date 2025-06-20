import React, { useState } from 'react';
import CodePanel from './components/CodePanel';
import CityScene from './components/CityScene';

function App() {
  const [showCodePanel, setShowCodePanel] = useState(true);

  const handlePeelAway = () => {
    setShowCodePanel(false);
  };

  return (
    <div className="w-full h-screen overflow-hidden">
      <CodePanel onPeelAway={handlePeelAway} isVisible={showCodePanel} />
      <CityScene isVisible={!showCodePanel} />
    </div>
  );
}

export default App;