import React, { useState } from 'react';
import MobileSpinningGrid from './components/MobileSpinningGrid';
import './App.css';

const sprites = ['dragon_red', 'dragon_green', 'dragon_gold', 'dragon_blue', 'star', 'diamond', 'seven', 'bar', 'cherry', 'lemon', 'bell', 'spin'];

function App() {
  const [mobileSpinPromise, setMobileSpinPromise] = useState<Promise<string[][]> | null>(null);
  const [lastMobileResult, setLastMobileResult] = useState<string[][] | null>(null);

  const createSpinPromise = (delay: number = 1500) => {
    return new Promise<string[][]>((resolve) => {
      setTimeout(() => {
        const newGrid = Array(3).fill(null).map(() => 
          Array(3).fill(null).map(() => sprites[Math.floor(Math.random() * sprites.length)])
        );
        resolve(newGrid);
      }, delay);
    });
  };

  const startMobileSpin = (delay: number = 1500) => {
    const promise = createSpinPromise(delay);
    setMobileSpinPromise(promise);
    
    setTimeout(() => {
      setMobileSpinPromise(null);
    }, delay + 1000);
  };

  const handleMobileSpinComplete = (result: string[][]) => {
    setLastMobileResult(result);
    console.log('Mobile spin completed with result:', result);
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
      justifyContent: 'center',
      gap: '30px'
    }}>
      <h1 style={{ 
        fontSize: '32px', 
        marginBottom: '20px',
        textAlign: 'center',
        background: 'linear-gradient(45deg, #00aaff, #0088cc)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        🎰 Mobile Slot Machine
      </h1>
      
      <MobileSpinningGrid 
        spinPromise={mobileSpinPromise}
        onSpinComplete={handleMobileSpinComplete}
        containerWidth={320}
        containerHeight={320}
      />
      
      <button
        onClick={() => startMobileSpin(1000)}
        style={{
          padding: '15px 25px',
          backgroundColor: '#00aaff',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          minWidth: '120px',
          boxShadow: '0 4px 15px rgba(0, 170, 255, 0.3)',
          transition: 'all 0.2s ease'
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        Bet $5
      </button>
      
      {lastMobileResult && (
        <div style={{ 
          textAlign: 'center', 
          maxWidth: '320px',
          padding: '20px',
          backgroundColor: 'rgba(0, 170, 255, 0.1)',
          borderRadius: '12px',
          border: '1px solid rgba(0, 170, 255, 0.3)'
        }}>
          <div style={{ 
            color: '#00aaff', 
            fontWeight: 'bold', 
            marginBottom: '10px',
            fontSize: '18px'
          }}>
            🎉 Last Result
          </div>
          {lastMobileResult.map((row, i) => (
            <div key={i} style={{ 
              marginBottom: '5px',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}>
              {row.map(sprite => sprite.replace('_', ' ')).join(' • ')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
