import React, { useState, useEffect } from 'react';
import SpriteBox from './components/SpriteBox';
import SpriteGrid3x3 from './components/SpriteGrid3x3';
import './App.css';

const sprites = ['dragon_red', 'dragon_green', 'dragon_gold', 'dragon_blue', 'star', 'diamond', 'seven', 'bar', 'cherry', 'lemon', 'bell', 'spin'];

function App() {
  const [currentSprite, setCurrentSprite] = useState('dragon_red');
  const [autoChange, setAutoChange] = useState(false);
  const [grid3x3, setGrid3x3] = useState<string[][]>([
    ['cherry', 'lemon', 'bell'],
    ['star', 'diamond', 'seven'],
    ['dragon_red', 'dragon_green', 'dragon_gold']
  ]);

  useEffect(() => {
    if (autoChange) {
      const interval = setInterval(() => {
        setCurrentSprite(prev => {
          const currentIndex = sprites.indexOf(prev);
          const nextIndex = (currentIndex + 1) % sprites.length;
          return sprites[nextIndex];
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [autoChange]);

  const randomizeGrid = () => {
    const newGrid = Array(3).fill(null).map(() => 
      Array(3).fill(null).map(() => sprites[Math.floor(Math.random() * sprites.length)])
    );
    setGrid3x3(newGrid);
  };

  return (
    <div className="App" style={{ 
      padding: '20px', 
      backgroundColor: '#0a0a0a', 
      minHeight: '100vh',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px'
    }}>
      <h1>Sprite Components Test</h1>
      
      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <h2>Single Sprite Box</h2>
          <SpriteBox currentSprite={currentSprite} size={150} />
          <div>Current: {currentSprite}</div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', maxWidth: '200px' }}>
            {sprites.slice(0, 6).map(sprite => (
              <button 
                key={sprite}
                onClick={() => setCurrentSprite(sprite)}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: currentSprite === sprite ? '#555' : '#333',
                  color: 'white',
                  border: '1px solid #666',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {sprite.replace('_', ' ')}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setAutoChange(!autoChange)}
            style={{
              padding: '8px 16px',
              backgroundColor: autoChange ? '#ff4444' : '#44ff44',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            {autoChange ? 'Stop Auto' : 'Start Auto'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
          <h2>3x3 Sprite Grid</h2>
          <SpriteGrid3x3 sprites={grid3x3} cellSize={80} />
          
          <button
            onClick={randomizeGrid}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4444ff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Randomize Grid
          </button>
          
          <div style={{ fontSize: '12px', textAlign: 'center', maxWidth: '250px' }}>
            Grid contents:
            {grid3x3.map((row, i) => (
              <div key={i}>
                {row.map(sprite => sprite.replace('_', ' ')).join(' | ')}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
