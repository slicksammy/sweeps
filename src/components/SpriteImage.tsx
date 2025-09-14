import React, { useEffect, useState } from 'react';
import * as PIXI from 'pixi.js';

interface SpriteImageProps {
  spriteUrl: string;
  section: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scale?: number;
  className?: string;
}

const SpriteImage: React.FC<SpriteImageProps> = ({ 
  spriteUrl, 
  section, 
  scale = 1,
  className 
}) => {
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);
  const [app, setApp] = useState<PIXI.Application | null>(null);

  useEffect(() => {
    if (!canvasRef || !spriteUrl) return;

    let pixiApp: PIXI.Application | null = null;

    const initPixi = async () => {
      try {
        // Create PIXI application
        pixiApp = new PIXI.Application();
        await pixiApp.init({
          width: section.width * scale,
          height: section.height * scale,
          backgroundColor: 0x000000,
          canvas: canvasRef
        });

        // Load the sprite texture
        const baseTexture = await PIXI.Assets.load(spriteUrl);
        
        if (!baseTexture || !baseTexture.source) {
          throw new Error('Failed to load base texture or source is null');
        }
        
        // Create a texture from the specified section
        const sectionTexture = new PIXI.Texture({
          source: baseTexture.source,
          frame: new PIXI.Rectangle(section.x, section.y, section.width, section.height)
        });

        // Create sprite and add to stage
        const sprite = new PIXI.Sprite(sectionTexture);
        sprite.scale.set(scale);
        pixiApp.stage.addChild(sprite);

        setApp(pixiApp);
        console.log('Sprite loaded successfully:', section);
      } catch (error) {
        console.error('Failed to load sprite:', error, { spriteUrl, section });
      }
    };

    initPixi();

    return () => {
      if (pixiApp) {
        pixiApp.destroy(true);
        pixiApp = null;
      }
    };
  }, [canvasRef, spriteUrl, section.x, section.y, section.width, section.height, scale]);

  return (
    <canvas
      ref={setCanvasRef}
      className={className}
      style={{ 
        display: 'block',
        imageRendering: 'pixelated' // For crisp pixel art
      }}
    />
  );
};

export default SpriteImage;