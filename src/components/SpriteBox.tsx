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

interface SpriteBoxProps {
  currentSprite: string;
  size?: number;
}

const SpriteBox: React.FC<SpriteBoxProps> = ({ currentSprite, size = 128 }) => {
  const [texturesLoaded, setTexturesLoaded] = useState(false);

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
        console.log('SpriteBox: Textures loaded:', Object.keys(loadedTextures));
        setTexturesLoaded(true);
      } catch (error) {
        console.error('SpriteBox: Failed to load textures:', error);
      }
    };

    if (!loadedTextures) {
      loadTextures();
    } else {
      setTexturesLoaded(true);
    }
  }, []);

  // Debug logging
  useEffect(() => {
    console.log(`SpriteBox: currentSprite=${currentSprite}, texturesLoaded=${texturesLoaded}, hasTexture=${!!(loadedTextures && loadedTextures[currentSprite])}`);
  }, [currentSprite, texturesLoaded]);

  if (!texturesLoaded) {
    return (
      <div style={{ 
        width: size, 
        height: size, 
        backgroundColor: '#333', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'white',
        borderRadius: '8px',
        border: '2px solid #666'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ borderRadius: '8px', overflow: 'hidden', border: '2px solid #666' }}>
      <Application 
        width={size} 
        height={size} 
        backgroundColor={0x222222}
        antialias={true}
      >
        <Container>
          {/* Box background */}
          <Graphics
            draw={(g: any) => {
              g.clear();
              g.beginFill(0x333333);
              g.drawRoundedRect(4, 4, size - 8, size - 8, 8);
              g.endFill();
              g.lineStyle(2, 0x666666);
              g.drawRoundedRect(4, 4, size - 8, size - 8, 8);
            }}
          />
          
          {/* Sprite */}
          {loadedTextures && loadedTextures[currentSprite] ? (
            <Sprite
              texture={loadedTextures[currentSprite]}
              anchor={0.5}
              x={size / 2}
              y={size / 2}
              scale={(size - 16) / 256} // Scale to fit in the box with some padding
            />
          ) : (
            <Graphics
              draw={(g: any) => {
                g.clear();
                g.beginFill(0xff0000);
                g.drawCircle(size / 2, size / 2, 20);
                g.endFill();
              }}
            />
          )}
        </Container>
      </Application>
    </div>
  );
};

export default SpriteBox;