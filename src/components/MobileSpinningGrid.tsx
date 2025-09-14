import React, { useState, useEffect, useRef } from 'react';
import { Application, extend, useTick } from '@pixi/react';
import * as PIXI from 'pixi.js';
import spriteUrl from './sprites/sprite.png';

// Extend tells @pixi/react what Pixi.js components are available
extend({
  Container: PIXI.Container,
  Graphics: PIXI.Graphics,
  Sprite: PIXI.Sprite,
});

// Now we can use these as JSX components
const Container = 'Container' as any;
const Graphics = 'Graphics' as any;
const Sprite = 'Sprite' as any;

// Helper: slice a 256x256 grid into textures in row-major order
const sliceGrid256 = (baseTexture: PIXI.Texture, names: string[]) => {
  const textures: Record<string, PIXI.Texture> = {};
  names.forEach((name, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    textures[name] = new PIXI.Texture({
      source: baseTexture.source,
      frame: new PIXI.Rectangle(col * 256, row * 256, 256, 256)
    });
  });
  return textures;
};

// Store loaded textures globally
let loadedTextures: Record<string, PIXI.Texture> | null = null;

const SYMBOLS = ['dragon_red', 'dragon_green', 'dragon_gold', 'dragon_blue', 'star', 'diamond', 'seven', 'bar', 'cherry', 'lemon', 'bell', 'spin'];

interface MobileSpinningCellProps {
  x: number;
  y: number;
  cellSize: number;
  isSpinning: boolean;
  finalSprite: string;
  spinDuration: number;
  onSpinComplete: () => void;
}

const MobileSpinningCell: React.FC<MobileSpinningCellProps> = ({ 
  x, y, cellSize, isSpinning, finalSprite, spinDuration, onSpinComplete 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spinSpeed, setSpinSpeed] = useState(0);
  const [timeSpinning, setTimeSpinning] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  useTick((delta) => {
    if (isSpinning && !hasCompleted) {
      setTimeSpinning(prev => prev + delta.deltaTime);
      
      // Faster acceleration for mobile
      if (timeSpinning < spinDuration * 0.7) {
        setSpinSpeed(prev => Math.min(prev + 0.8, 20));
      } else {
        setSpinSpeed(prev => Math.max(prev - 0.5, 2));
      }

      if (timeSpinning >= spinDuration) {
        setSpinSpeed(0);
        setHasCompleted(true);
        const finalIndex = SYMBOLS.indexOf(finalSprite);
        setCurrentIndex(finalIndex >= 0 ? finalIndex : 0);
        onSpinComplete();
      } else {
        setCurrentIndex(prev => (prev + spinSpeed / 10) % SYMBOLS.length);
      }
    }

    if (!isSpinning) {
      setTimeSpinning(0);
      setHasCompleted(false);
      setSpinSpeed(0);
    }
  });

  const currentSymbol = SYMBOLS[Math.floor(currentIndex)];

  return (
    <Container x={x} y={y}>
      {/* Cell background with mobile-friendly styling */}
      <Graphics
        draw={(g: any) => {
          g.clear();
          g.beginFill(isSpinning ? 0x2a2a2a : 0x222222);
          g.drawRoundedRect(-cellSize/2 + 2, -cellSize/2 + 2, cellSize - 4, cellSize - 4, 8);
          g.endFill();
          g.lineStyle(isSpinning ? 3 : 2, isSpinning ? 0x00aaff : 0x444444);
          g.drawRoundedRect(-cellSize/2 + 2, -cellSize/2 + 2, cellSize - 4, cellSize - 4, 8);
        }}
      />
      
      {/* Sprite with mobile optimization */}
      {loadedTextures && loadedTextures[currentSymbol] ? (
        <Sprite
          texture={loadedTextures[currentSymbol]}
          anchor={0.5}
          scale={(cellSize - 12) / 256} // More padding for mobile
          alpha={isSpinning ? 0.85 : 1.0}
        />
      ) : (
        <Graphics
          draw={(g: any) => {
            g.clear();
            g.beginFill(isSpinning ? 0x00aaff : 0xff4444);
            g.drawCircle(0, 0, cellSize * 0.2);
            g.endFill();
          }}
        />
      )}
    </Container>
  );
};

interface MobileSpinningGridProps {
  spinPromise: Promise<string[][]> | null;
  onSpinComplete?: (result: string[][]) => void;
  containerWidth?: number;
  containerHeight?: number;
}

const MobileSpinningGrid: React.FC<MobileSpinningGridProps> = ({ 
  spinPromise, 
  onSpinComplete,
  containerWidth = 320,
  containerHeight = 320
}) => {
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [finalGrid, setFinalGrid] = useState<string[][]>([
    ['cherry', 'lemon', 'bell'],
    ['star', 'diamond', 'seven'],
    ['dragon_red', 'dragon_green', 'dragon_gold']
  ]);
  const completedCells = useRef(0);
  
  // Calculate responsive cell size based on container
  const cellSize = Math.min((containerWidth - 30) / 3, (containerHeight - 30) / 3);
  const actualWidth = Math.min(containerWidth, cellSize * 3 + 30);
  const actualHeight = Math.min(containerHeight, cellSize * 3 + 30);

  // Load textures when component mounts
  useEffect(() => {
    const loadTextures = async () => {
      try {
        const baseTexture = await PIXI.Assets.load(spriteUrl);

        const names = [
          'dragon_red','dragon_green','dragon_gold','dragon_blue',
          'star','diamond','seven','bar',
          'cherry','lemon','bell','spin'
        ];

        loadedTextures = sliceGrid256(baseTexture, names);
        console.log('MobileSpinningGrid: Textures loaded:', Object.keys(loadedTextures));
        setTexturesLoaded(true);
      } catch (error) {
        console.error('MobileSpinningGrid: Failed to load textures:', error);
      }
    };

    if (!loadedTextures) {
      loadTextures();
    } else {
      setTexturesLoaded(true);
    }
  }, []);

  // Handle spin promise
  useEffect(() => {
    if (spinPromise && texturesLoaded) {
      setIsSpinning(true);
      completedCells.current = 0;
      
      spinPromise.then(result => {
        console.log('MobileSpinningGrid: Promise resolved with:', result);
        setFinalGrid(result);
      }).catch(error => {
        console.error('MobileSpinningGrid: Promise rejected:', error);
      });
    }
  }, [spinPromise, texturesLoaded]);

  const handleCellComplete = () => {
    completedCells.current++;
    
    if (completedCells.current === 9) {
      // Add haptic feedback for mobile
      if ('vibrate' in navigator) {
        navigator.vibrate(100);
      }
      
      setTimeout(() => {
        setIsSpinning(false);
        completedCells.current = 0;
        if (onSpinComplete) {
          onSpinComplete(finalGrid);
        }
      }, 150);
    }
  };

  if (!texturesLoaded) {
    return (
      <div style={{ 
        width: actualWidth, 
        height: actualHeight, 
        backgroundColor: '#333', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'white',
        borderRadius: '16px',
        border: '3px solid #666',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        <div style={{ marginBottom: '10px' }}>🎰</div>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      borderRadius: '16px', 
      overflow: 'hidden', 
      border: `3px solid ${isSpinning ? '#00aaff' : '#666'}`,
      boxShadow: isSpinning ? '0 0 30px rgba(0, 170, 255, 0.6)' : '0 4px 20px rgba(0, 0, 0, 0.3)',
      transition: 'all 0.3s ease',
      background: 'linear-gradient(145deg, #1a1a1a, #0f0f0f)',
      position: 'relative'
    }}>
      {/* Mobile-friendly loading overlay */}
      {isSpinning && (
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#00aaff',
          fontSize: '14px',
          fontWeight: 'bold',
          zIndex: 10,
          textShadow: '0 0 10px rgba(0, 170, 255, 0.8)'
        }}>
          SPINNING...
        </div>
      )}
      
      <Application 
        width={actualWidth} 
        height={actualHeight} 
        backgroundColor={isSpinning ? 0x0a0a0f : 0x111111}
        antialias={true}
        resolution={window.devicePixelRatio || 1}
      >
        <Container>
          {/* Mobile-optimized grid background */}
          <Graphics
            draw={(g: any) => {
              g.clear();
              // Gradient-like effect with multiple fills
              g.beginFill(isSpinning ? 0x1a1a2a : 0x1a1a1a);
              g.drawRoundedRect(15, 15, actualWidth - 30, actualHeight - 30, 12);
              g.endFill();
              g.lineStyle(3, isSpinning ? 0x0066cc : 0x333333);
              g.drawRoundedRect(15, 15, actualWidth - 30, actualHeight - 30, 12);
            }}
          />

          {/* 3x3 Grid of Mobile-Optimized Spinning Cells */}
          {finalGrid.map((row, rowIndex) =>
            row.map((spriteName, colIndex) => {
              const x = 15 + colIndex * cellSize + cellSize / 2;
              const y = 15 + rowIndex * cellSize + cellSize / 2;
              
              return (
                <MobileSpinningCell
                  key={`${rowIndex}-${colIndex}`}
                  x={x}
                  y={y}
                  cellSize={cellSize}
                  isSpinning={isSpinning}
                  finalSprite={spriteName}
                  spinDuration={40 + Math.random() * 30 + colIndex * 8 + rowIndex * 4} // Faster for mobile
                  onSpinComplete={handleCellComplete}
                />
              );
            })
          )}
        </Container>
      </Application>
    </div>
  );
};

export default MobileSpinningGrid;