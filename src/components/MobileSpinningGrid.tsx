import React, { useState, useEffect, useRef } from 'react';
import { Application, extend, useTick } from '@pixi/react';
import * as PIXI from 'pixi.js';
// Extend tells @pixi/react what Pixi.js components are available
extend({
  Container: PIXI.Container,
  Graphics: PIXI.Graphics,
  Sprite: PIXI.Sprite,
  Text: PIXI.Text,
});

// Now we can use these as JSX components
const Container = 'Container' as any;
const Graphics = 'Graphics' as any;
const Sprite = 'Sprite' as any;
const Text = 'Text' as any;

const SYMBOLS = ['ukrainian1', 'ukrainian2', 'ukrainian3', 'ukrainian4', 'ukrainian5', 'ukrainian6'];

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
  
  // Debug: log current symbol during spinning
  React.useEffect(() => {
    if (isSpinning) {
      console.log(`Cell (${x},${y}): currentSymbol=${currentSymbol}, index=${Math.floor(currentIndex)}`);
    }
  }, [currentSymbol, isSpinning, x, y, currentIndex]);

  return (
    <Container x={x} y={y}>
      {/* Cell background with mobile-friendly styling - no padding */}
      <Graphics
        draw={(g: any) => {
          g.clear();
          g.beginFill(isSpinning ? 0x2a2a2a : 0x222222);
          g.drawRoundedRect(-cellSize/2, -cellSize/2, cellSize, cellSize, 4);
          g.endFill();
          g.lineStyle(isSpinning ? 2 : 1, isSpinning ? 0x00aaff : 0x444444);
          g.drawRoundedRect(-cellSize/2, -cellSize/2, cellSize, cellSize, 4);
        }}
      />
      
      {/* Sprite with mobile optimization */}
      <Sprite
        texture={(() => {
          const texture = PIXI.Texture.from(currentSymbol);
          if (isSpinning && Math.random() < 0.1) { // Occasional debug log during spinning
            console.log(`Getting texture for ${currentSymbol}:`, texture);
          }
          return texture;
        })()}
        anchor={0.5}
        scale={Math.max(0.2, (cellSize - 4) / 256)} // Minimal padding for mobile
        alpha={isSpinning ? 0.85 : 1.0}
      />
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
  const [isSpinning, setIsSpinning] = useState(false);
  const [finalGrid, setFinalGrid] = useState<string[][]>([
    ['ukrainian1', 'ukrainian2', 'ukrainian3'],
    ['ukrainian4', 'ukrainian5', 'ukrainian6'],
    ['ukrainian1', 'ukrainian2', 'ukrainian3']
  ]);
  const completedCells = useRef(0);
  
  // Calculate responsive cell size based on container with no padding
  const cellSize = Math.min(containerWidth / 3, containerHeight / 3);
  const actualWidth = containerWidth;
  const actualHeight = containerHeight;
  
  console.log('MobileSpinningGrid: cellSize =', cellSize, 'containerWidth =', containerWidth);

  // Handle spin promise
  useEffect(() => {
    if (spinPromise) {
      setIsSpinning(true);
      completedCells.current = 0;
      
      spinPromise.then(result => {
        console.log('MobileSpinningGrid: Promise resolved with:', result);
        setFinalGrid(result);
      }).catch(error => {
        console.error('MobileSpinningGrid: Promise rejected:', error);
      });
    }
  }, [spinPromise]);

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

  // No loading check needed - textures are managed globally by Assets

  // Position grid at origin with no padding
  const gridX = 0;
  const gridY = 0;
  
  console.log('MobileSpinningGrid positioning:', { gridX, gridY, actualWidth, actualHeight, containerWidth, containerHeight });

  return (
    <Container x={gridX} y={gridY}>
      {/* Debug background to see if container is positioned correctly */}
      <Graphics
        draw={(g: any) => {
          g.clear();
          g.beginFill(0xff0000, 0.3); // Semi-transparent red for debugging
          g.drawRect(0, 0, actualWidth, actualHeight);
          g.endFill();
        }}
      />
      {/* Mobile-optimized grid background - full size, no padding */}
      <Graphics
        draw={(g: any) => {
          g.clear();
          // Gradient-like effect with multiple fills
          g.beginFill(isSpinning ? 0x1a1a2a : 0x1a1a1a);
          g.drawRoundedRect(0, 0, actualWidth, actualHeight, 12);
          g.endFill();
          g.lineStyle(3, isSpinning ? 0x0066cc : 0x333333);
          g.drawRoundedRect(0, 0, actualWidth, actualHeight, 12);
          
          // Add border glow effect when spinning
          if (isSpinning) {
            g.lineStyle(6, 0x00aaff, 0.3);
            g.drawRoundedRect(3, 3, actualWidth - 6, actualHeight - 6, 15);
          }
        }}
      />

      {/* Spinning indicator text */}
      {isSpinning && (
        <Text
          text="SPINNING..."
          style={new PIXI.TextStyle({
            fontSize: 14,
            fill: 0x00aaff,
            fontWeight: 'bold',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            dropShadow: true,
            // dropShadowColor: 0x00aaff,
            // dropShadowBlur: 10,
            // dropShadowDistance: 0
          })}
          anchor={0.5}
          x={actualWidth / 2}
          y={10}
        />
      )}

      {/* 3x3 Grid of Mobile-Optimized Spinning Cells */}
      {finalGrid.map((row, rowIndex) =>
        row.map((spriteName, colIndex) => {
          const x = colIndex * cellSize + cellSize / 2;
          const y = rowIndex * cellSize + cellSize / 2;
          
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
  );
};

export default MobileSpinningGrid;