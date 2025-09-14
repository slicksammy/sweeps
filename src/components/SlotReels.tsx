import React, { useCallback, useRef, useState, useEffect } from 'react';
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

// Slot symbols
const SYMBOLS = ['cherry', 'lemon', 'bell', 'bar', 'star', 'diamond', 'seven', 'dragon_red'];

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

interface ReelProps {
  x: number;
  y: number;
  symbols: string[];
  isSpinning: boolean;
  onSpinComplete: (finalSymbol: string) => void;
  spinDuration: number;
}

const Reel: React.FC<ReelProps> = ({ x, y, symbols, isSpinning, onSpinComplete, spinDuration }) => {
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
        const finalIndex = Math.floor(Math.random() * symbols.length);
        setCurrentIndex(finalIndex);
        onSpinComplete(symbols[finalIndex]);
      } else {
        setCurrentIndex(prev => (prev + spinSpeed / 10) % symbols.length);
      }
    }

    if (!isSpinning) {
      setTimeSpinning(0);
      setHasCompleted(false);
      setSpinSpeed(0);
    }
  });

  const currentSymbol = symbols[Math.floor(currentIndex)];
  
  // Debug logging
  React.useEffect(() => {
    console.log(`Reel at (${x},${y}): currentSymbol=${currentSymbol}, texturesLoaded=${!!loadedTextures}, hasTexture=${!!(loadedTextures && loadedTextures[currentSymbol])}`);
  }, [currentSymbol, x, y]);

  return (
    <Container x={x} y={y}>
      {/* Reel background */}
      <Graphics
        draw={(g: any) => {
          g.clear();
          g.beginFill(0x222222);
          g.drawRoundedRect(-48, -48, 96, 96, 8);
          g.endFill();
          g.lineStyle(2, 0x444444);
          g.drawRoundedRect(-48, -48, 96, 96, 8);
        }}
      />
      
      {/* Symbol sprite */}
      {loadedTextures && loadedTextures[currentSymbol] ? (
        <Sprite
          texture={loadedTextures[currentSymbol]}
          anchor={0.5}
          scale={0.375} // 256 * 0.375 = 96px to fit in the 96x96 reel
        />
      ) : (
        <Graphics
          draw={(g: any) => {
            g.clear();
            g.beginFill(0xff0000);
            g.drawCircle(0, 0, 20);
            g.endFill();
          }}
        />
      )}
    </Container>
  );
};

interface SlotReelsProps {
  isSpinning: boolean;
  onSpinComplete: (results: string[][]) => void;
}

const SlotReels: React.FC<SlotReelsProps> = ({ isSpinning, onSpinComplete }) => {
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const [reelResults, setReelResults] = useState<string[][]>([
    ['cherry', 'cherry', 'cherry'],
    ['cherry', 'cherry', 'cherry'],
    ['cherry', 'cherry', 'cherry']
  ]);
  const completedReels = useRef(0);

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
        console.log('SlotReels: Textures loaded:', Object.keys(loadedTextures));
        setTexturesLoaded(true);
      } catch (error) {
        console.error('Failed to load textures:', error);
      }
    };

    loadTextures();
  }, []);

  const handleReelComplete = useCallback((symbol: string, col: number, row: number) => {
    setReelResults(prev => {
      const newResults = [...prev];
      newResults[col] = [...newResults[col]];
      newResults[col][row] = symbol;
      return newResults;
    });

    completedReels.current++;
    
    if (completedReels.current === 9) { // 3x3 = 9 reels
      setTimeout(() => {
        completedReels.current = 0;
        onSpinComplete(reelResults);
      }, 100);
    }
  }, [reelResults, onSpinComplete]);

  if (!texturesLoaded) {
    return (
      <div style={{ 
        width: '300px', 
        height: '300px', 
        backgroundColor: '#222', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'white',
        borderRadius: '12px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Container>
        {/* Machine background */}
        <Graphics
          draw={(g: any) => {
            g.clear();
            g.beginFill(0x1a1a1a);
            g.drawRoundedRect(10, 10, 280, 280, 12);
            g.endFill();
            g.lineStyle(2, 0x333333);
            g.drawRoundedRect(10, 10, 280, 280, 12);
          }}
        />

        {/* 3x3 Grid of Reels */}
        {[0, 1, 2].map(col => 
          [0, 1, 2].map(row => (
            <Reel
              key={`${col}-${row}`}
              x={70 + col * 80}
              y={70 + row * 80}
              symbols={SYMBOLS}
              isSpinning={isSpinning}
              onSpinComplete={(symbol) => handleReelComplete(symbol, col, row)}
              spinDuration={60 + Math.random() * 40 + col * 10 + row * 5}
            />
          ))
        )}
    </Container>
  );
};

export default SlotReels;