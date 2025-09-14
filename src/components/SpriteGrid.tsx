import React from 'react';
import SpriteImage from './SpriteImage';

interface SpriteGridProps {
  spriteUrl: string;
  scale?: number;
}

const SpriteGrid: React.FC<SpriteGridProps> = ({ spriteUrl, scale = 0.5 }) => {
  const sprites = [
    // Row 1: Dragons
    { name: 'Dragon Red', x: 0, y: 0 },
    { name: 'Dragon Green', x: 256, y: 0 },
    { name: 'Dragon Gold', x: 512, y: 0 },
    { name: 'Dragon Blue', x: 768, y: 0 },
    
    // Row 2: Symbols
    { name: 'Star', x: 0, y: 256 },
    { name: 'Diamond', x: 256, y: 256 },
    { name: 'Seven', x: 512, y: 256 },
    { name: 'Bar', x: 768, y: 256 },
    
    // Row 3: Fruits
    { name: 'Cherry', x: 0, y: 512 },
    { name: 'Lemon', x: 256, y: 512 },
    { name: 'Bell', x: 512, y: 512 },
    { name: 'Spin', x: 768, y: 512 }
  ];

  return (
    <div>
      <h2 style={{ color: 'white' }}>Sprites with correct coordinates (256x256)</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
        {sprites.map((sprite, index) => (
          <div key={index}>
            <h3 style={{ color: 'white' }}>{sprite.name}</h3>
            <SpriteImage 
              spriteUrl={spriteUrl}
              section={{ x: sprite.x, y: sprite.y, width: 256, height: 256 }}
              scale={scale}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpriteGrid;