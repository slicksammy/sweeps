import React, { useState, useEffect } from 'react';
import { Application, extend } from '@pixi/react';
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

interface SpriteGrid3x3Props {
  sprites: string[][]; // 3x3 array of sprite names
  cellSize?: number;
}

const SpriteGrid3x3: React.FC<SpriteGrid3x3Props> = ({ sprites, cellSize = 96 }) => {
  const [texturesLoaded, setTexturesLoaded] = useState(false);
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
        console.log('SpriteGrid3x3: Textures loaded:', Object.keys(loadedTextures));
        setTexturesLoaded(true);
      } catch (error) {
        console.error('SpriteGrid3x3: Failed to load textures:', error);
      }
    };

    if (!loadedTextures) {
      loadTextures();
    } else {
      setTexturesLoaded(true);
    }
  }, []);

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
    <Container>
          {/* Grid background */}
          <Graphics
            draw={(g: any) => {
              g.clear();
              g.beginFill(0x1a1a1a);
              g.drawRoundedRect(10, 10, totalSize - 20, totalSize - 20, 8);
              g.endFill();
              g.lineStyle(2, 0x333333);
              g.drawRoundedRect(10, 10, totalSize - 20, totalSize - 20, 8);
            }}
          />

          {/* 3x3 Grid of Sprites */}
          {sprites.map((row, rowIndex) =>
            row.map((spriteName, colIndex) => {
              const x = 10 + colIndex * cellSize + cellSize / 2;
              const y = 10 + rowIndex * cellSize + cellSize / 2;
              
              return (
                <Container key={`${rowIndex}-${colIndex}`} x={x} y={y}>
                  {/* Cell background */}
                  <Graphics
                    draw={(g: any) => {
                      g.clear();
                      g.beginFill(0x222222);
                      g.drawRoundedRect(-cellSize/2 + 4, -cellSize/2 + 4, cellSize - 8, cellSize - 8, 6);
                      g.endFill();
                      g.lineStyle(1, 0x444444);
                      g.drawRoundedRect(-cellSize/2 + 4, -cellSize/2 + 4, cellSize - 8, cellSize - 8, 6);
                    }}
                  />
                  
                  {/* Sprite */}
                  {loadedTextures && loadedTextures[spriteName] ? (
                    <Sprite
                      texture={loadedTextures[spriteName]}
                      anchor={0.5}
                      scale={(cellSize - 16) / 256} // Scale to fit in cell with padding
                    />
                  ) : (
                    <Graphics
                      draw={(g: any) => {
                        g.clear();
                        g.beginFill(0xff0000);
                        g.drawCircle(0, 0, 15);
                        g.endFill();
                      }}
                    />
                  )}
                </Container>
              );
            })
        )}
    </Container>
  );
};

export default SpriteGrid3x3;