import React, { useState, useEffect, useRef } from 'react';
import { Application, extend } from '@pixi/react';
import * as PIXI from 'pixi.js';
import MobileSpinningGrid from './components/MobileSpinningGrid';
import spriteUrl from './components/sprites/sprite.png';
import './App.css';

// Extend tells @pixi/react what Pixi.js components are available
extend({
  Container: PIXI.Container,
  Graphics: PIXI.Graphics,
  Sprite: PIXI.Sprite,
  Text: PIXI.Text,
});

const Container = 'Container' as any;
const Graphics = 'Graphics' as any;
const Sprite = 'Sprite' as any;
const Text = 'Text' as any;

const sprites = ['dragon_red', 'dragon_green', 'dragon_gold', 'dragon_blue', 'star', 'diamond', 'seven', 'bar', 'cherry', 'lemon', 'bell', 'spin'];

// Create sprite textures using proper PIXI v8 Assets system
const createSpriteTextures = async () => {
  // Load the base spritesheet through Assets system
  const base = await PIXI.Assets.load(spriteUrl);
  const baseTexture = base.baseTexture || base;

  // Create sub-textures and register them with Assets for global access
  const spriteDefinitions = [
    { name: 'dragon_red', x: 0, y: 0 },
    { name: 'dragon_green', x: 256, y: 0 },
    { name: 'dragon_gold', x: 512, y: 0 },
    { name: 'dragon_blue', x: 768, y: 0 },
    { name: 'star', x: 0, y: 256 },
    { name: 'diamond', x: 256, y: 256 },
    { name: 'seven', x: 512, y: 256 },
    { name: 'bar', x: 768, y: 256 },
    { name: 'cherry', x: 0, y: 512 },
    { name: 'lemon', x: 256, y: 512 },
    { name: 'bell', x: 512, y: 512 },
    { name: 'spin', x: 768, y: 512 }
  ];

  // Create and register each sprite texture
  spriteDefinitions.forEach(({ name, x, y }) => {
    const texture = new PIXI.Texture({
      source: baseTexture.source,
      frame: new PIXI.Rectangle(x, y, 256, 256)
    });
    // Register with Assets cache for global access
    PIXI.Assets.cache.set(name, texture);
  });

  console.log('Sprite textures created and registered globally');
};

function App() {
  const [lastMobileResult, setLastMobileResult] = useState<string[][] | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [mobileSpinPromise, setMobileSpinPromise] = useState<Promise<string[][]> | null>(null);
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  // Load textures using proper PIXI v8 Assets system
  useEffect(() => {
    const loadTextures = async () => {
      try {
        await createSpriteTextures();
        setTexturesLoaded(true);
      } catch (error) {
        console.error('App: Failed to load textures:', error);
      }
    };

    loadTextures();
  }, []);

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
    if (isSpinning) return; // Prevent multiple spins
    
    setIsSpinning(true);
    const promise = createSpinPromise(delay);
    setMobileSpinPromise(promise);
    
    setTimeout(() => {
      setMobileSpinPromise(null);
    }, delay + 1000);
  };

  const handleMobileSpinComplete = (result: string[][]) => {
    setLastMobileResult(result);
    setIsSpinning(false); // Re-enable button
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
        fontSize: 'clamp(24px, 6vw, 32px)', 
        marginBottom: '20px',
        textAlign: 'center',
        background: 'linear-gradient(45deg, #00aaff, #0088cc)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
      }}>
        🎰 Mobile Slot Machine
      </h1>
      
      {/* Simple fixed-size PIXI container */}
      <div 
        ref={parentRef}
        style={{
          width: '320px',
          height: '320px',
          border: '2px solid #333',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: '#111'
        }}
      >
        <Application 
          width={320}
          height={320}
          backgroundColor={0x0a0a0a}
          antialias={true}
          resolution={1}
        >
          {texturesLoaded ? (
            <MobileSpinningGrid 
              spinPromise={mobileSpinPromise}
              onSpinComplete={handleMobileSpinComplete}
              containerWidth={320}
              containerHeight={320}
            />
          ) : (
            <Container x={200} y={200}>
              <Text
                text="Loading Sprites..."
                style={new PIXI.TextStyle({
                  fontSize: 24,
                  fill: 0xFFFFFF,
                  fontWeight: 'bold'
                })}
                anchor={0.5}
              />
            </Container>
          )}
        </Application>
      </div>
      
      <button
        onClick={() => startMobileSpin(1000)}
        disabled={isSpinning}
        style={{
          padding: '15px 25px',
          backgroundColor: isSpinning ? '#666666' : '#00aaff',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          cursor: isSpinning ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          minWidth: '120px',
          boxShadow: isSpinning ? '0 2px 8px rgba(102, 102, 102, 0.3)' : '0 4px 15px rgba(0, 170, 255, 0.3)',
          transition: 'all 0.2s ease',
          opacity: isSpinning ? 0.7 : 1.0
        }}
        onMouseDown={(e) => !isSpinning && (e.currentTarget.style.transform = 'scale(0.95)')}
        onMouseUp={(e) => !isSpinning && (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={(e) => !isSpinning && (e.currentTarget.style.transform = 'scale(1)')}
      >
        {isSpinning ? 'SPINNING...' : 'Bet $5'}
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
