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

interface SpinningCellProps {
  x: number;
  y: number;
  cellSize: number;
  isSpinning: boolean;
  finalSprite: string;
  spinDuration: number;
  onSpinComplete: () => void;
}

const SpinningCell: React.FC<SpinningCellProps> = ({ 
  x, y, cellSize, isSpinning, finalSprite, spinDuration, onSpinComplete 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spinSpeed, setSpinSpeed] = useState(0);
  const [timeSpinning, setTimeSpinning] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  useTick((delta) => {
    if (isSpinning && !hasCompleted) {
      setTimeSpinning(prev => prev + delta.deltaTime);
      
      if (timeSpinning < spinDuration * 0.8) {
        // Accelerate
        setSpinSpeed(prev => Math.min(prev + 0.5, 15));
      } else {
        // Decelerate
        setSpinSpeed(prev => Math.max(prev - 0.3, 1));
      }

      if (timeSpinning >= spinDuration) {
        setSpinSpeed(0);
        setHasCompleted(true);
        // Set to final sprite
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
      {/* Cell background */}
      <Graphics
        draw={(g: any) => {
          g.clear();
          g.beginFill(0x222222);
          g.drawRoundedRect(-cellSize/2 + 4, -cellSize/2 + 4, cellSize - 8, cellSize - 8, 6);
          g.endFill();
          g.lineStyle(1, isSpinning ? 0x666666 : 0x444444);
          g.drawRoundedRect(-cellSize/2 + 4, -cellSize/2 + 4, cellSize - 8, cellSize - 8, 6);
        }}
      />
      
      {/* Sprite */}
      {loadedTextures && loadedTextures[currentSymbol] ? (
        <Sprite
          texture={loadedTextures[currentSymbol]}
          anchor={0.5}
          scale={(cellSize - 16) / 256} // Scale to fit in cell with padding
          alpha={isSpinning ? 0.8 : 1.0} // Slightly transparent while spinning
        />
      ) : (
        <Graphics
          draw={(g: any) => {
            g.clear();
            g.beginFill(isSpinning ? 0xffff00 : 0xff0000);
            g.drawCircle(0, 0, 15);
            g.endFill();
          }}
        />
      )}
    </Container>
  );
};

interface SpinningGrid3x3Props {
  spinPromise: Promise<string[][]> | null;
  cellSize?: number;
  onSpinComplete?: (result: string[][]) => void;
}

const SpinningGrid3x3: React.FC<SpinningGrid3x3Props> = ({ 
  spinPromise, 
  cellSize = 80,
  onSpinComplete
}) => {
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [finalGrid, setFinalGrid] = useState<string[][]>([
    ['cherry', 'lemon', 'bell'],
    ['star', 'diamond', 'seven'],
    ['dragon_red', 'dragon_green', 'dragon_gold']
  ]);
  const completedCells = useRef(0);
  const totalSize = cellSize * 3 + 20; // 3 cells + padding

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
        console.log('SpinningGrid3x3: Textures loaded:', Object.keys(loadedTextures));
        setTexturesLoaded(true);
      } catch (error) {
        console.error('SpinningGrid3x3: Failed to load textures:', error);
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
        console.log('SpinningGrid3x3: Promise resolved with:', result);
        setFinalGrid(result);
      }).catch(error => {
        console.error('SpinningGrid3x3: Promise rejected:', error);
        // Keep current grid on error
      });
    }
  }, [spinPromise, texturesLoaded]);

  const handleCellComplete = () => {
    completedCells.current++;
    console.log(`SpinningGrid3x3: Cell completed (${completedCells.current}/9)`);
    
    if (completedCells.current === 9) {
      // All cells completed
      setTimeout(() => {
        setIsSpinning(false);
        completedCells.current = 0;
        if (onSpinComplete) {
          onSpinComplete(finalGrid);
        }
      }, 100);
    }
  };

  if (!texturesLoaded) {
    return (
      <div style={{ 
        width: totalSize, 
        height: totalSize, 
        backgroundColor: '#333', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'white',
        borderRadius: '12px',
        border: '2px solid #666'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ 
      borderRadius: '12px', 
      overflow: 'hidden', 
      border: `2px solid ${isSpinning ? '#ffaa00' : '#666'}`,
      boxShadow: isSpinning ? '0 0 20px rgba(255, 170, 0, 0.5)' : 'none',
      transition: 'all 0.3s ease'
    }}>
      <Application 
        width={totalSize} 
        height={totalSize} 
        backgroundColor={isSpinning ? 0x0f0f0f : 0x111111}
        antialias={true}
      >
        <Container>
          {/* Grid background */}
          <Graphics
            draw={(g: any) => {
              g.clear();
              g.beginFill(isSpinning ? 0x1f1a0f : 0x1a1a1a);
              g.drawRoundedRect(10, 10, totalSize - 20, totalSize - 20, 8);
              g.endFill();
              g.lineStyle(2, isSpinning ? 0x444400 : 0x333333);
              g.drawRoundedRect(10, 10, totalSize - 20, totalSize - 20, 8);
            }}
          />

          {/* 3x3 Grid of Spinning Cells */}
          {finalGrid.map((row, rowIndex) =>
            row.map((spriteName, colIndex) => {
              const x = 10 + colIndex * cellSize + cellSize / 2;
              const y = 10 + rowIndex * cellSize + cellSize / 2;
              
              return (
                <SpinningCell
                  key={`${rowIndex}-${colIndex}`}
                  x={x}
                  y={y}
                  cellSize={cellSize}
                  isSpinning={isSpinning}
                  finalSprite={spriteName}
                  spinDuration={60 + Math.random() * 40 + colIndex * 10 + rowIndex * 5}
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

export default SpinningGrid3x3;