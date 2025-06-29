import React, { useState } from 'react';
import CodePanel from './components/CodePanel';
import CityScene from './components/CityScene';
import BoltBadge from './components/BoltBadge';

function App() {
  const [showCodePanel, setShowCodePanel] = useState(true);

  const handlePeelAway = () => {
    setShowCodePanel(false);
  };

  return (
    <div className="w-full h-screen overflow-hidden">
      <CodePanel onPeelAway={handlePeelAway} isVisible={showCodePanel} />
      <CityScene isVisible={!showCodePanel} />
      <BoltBadge />
    </div>
  );
}

export default App;