import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Application, extend, useTick } from '@pixi/react';
import * as PIXI from 'pixi.js';
import spriteUrl from './sprites/sprite.png';
console.log(spriteUrl);

// Extend tells @pixi/react what Pixi.js components are available
extend({
  Container: PIXI.Container,
  Graphics: PIXI.Graphics,
  Text: PIXI.Text,
  Sprite: PIXI.Sprite,
});

// Now we can use these as JSX components
const Container = 'Container' as any;
const Graphics = 'Graphics' as any;
const Text = 'Text' as any;
const Sprite = 'Sprite' as any;

// Slot symbols - now using sprite names instead of emoji
const SYMBOLS = ['cherry', 'lemon', 'bell', 'bar', 'star', 'diamond', 'seven', 'dragon_red'];
const SYMBOL_VALUES = {
  'cherry': 2,
  'lemon': 3,
  'bell': 4,
  'bar': 5,
  'star': 10,
  'diamond': 15,
  'seven': 20,
  'dragon_red': 50
};

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
  symbols: string[];
  isSpinning: boolean;
  onSpinComplete: (finalSymbol: string) => void;
  spinDuration: number;
}

const Reel: React.FC<ReelProps> = ({ x, symbols, isSpinning, onSpinComplete, spinDuration }) => {
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

  return (
    <Container x={x} y={200}>
      {/* Reel background */}
      <Graphics
        draw={(g: any) => {
          g.clear();
          g.beginFill(0x333333);
          g.drawRoundedRect(-64, -64, 128, 128, 10);
          g.endFill();
          g.lineStyle(2, 0x666666);
          g.drawRoundedRect(-64, -64, 128, 128, 10);
        }}
      />
      
      {/* Symbol sprite */}
      {loadedTextures && loadedTextures[currentSymbol] && (
        <Sprite
          texture={loadedTextures[currentSymbol]}
          anchor={0.5}
          scale={0.5}
        />
      )}
    </Container>
  );
};

interface SlotMachineProps {
  balance: number;
  bet: number;
  onBalanceChange: (newBalance: number) => void;
  onWin: (amount: number) => void;
}

const SlotMachine: React.FC<SlotMachineProps> = ({ balance, bet, onBalanceChange, onWin }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [reelResults, setReelResults] = useState<string[]>(['cherry', 'cherry', 'cherry']);
  const [lastWin, setLastWin] = useState(0);
  const [texturesLoaded, setTexturesLoaded] = useState(false);
  const completedReels = useRef(0);
  const spinButtonRef = useRef<any>(null);

  // Load textures when component mounts
  useEffect(() => {
    const loadTextures = async () => {
      try {
        const baseTexture = await PIXI.Assets.load(spriteUrl); // Texture

        const names = [
          'dragon_red','dragon_green','dragon_gold','dragon_blue',
          'star','diamond','seven','bar',
          'cherry','lemon','bell','spin'
        ];

        loadedTextures = sliceGrid256(baseTexture, names);
        setTexturesLoaded(true);
      } catch (error) {
        console.error('Failed to load textures:', error);
      }
    };

    loadTextures();
  }, []);

  const handleReelComplete = useCallback((symbol: string, reelIndex: number) => {
    setReelResults(prev => {
      const newResults = [...prev];
      newResults[reelIndex] = symbol;
      return newResults;
    });

    completedReels.current++;
    
    if (completedReels.current === 3) {
      // All reels completed, check for wins
      setTimeout(() => {
        setIsSpinning(false);
        completedReels.current = 0;
        checkWin();
      }, 100);
    }
  }, []);

  const checkWin = useCallback(() => {
    const [reel1, reel2, reel3] = reelResults;
    let winAmount = 0;

    // Check for three of a kind
    if (reel1 === reel2 && reel2 === reel3) {
      winAmount = SYMBOL_VALUES[reel1 as keyof typeof SYMBOL_VALUES] * bet;
    }
    // Check for two of a kind
    else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
      const matchingSymbol = reel1 === reel2 ? reel1 : (reel2 === reel3 ? reel2 : reel1);
      winAmount = Math.floor(SYMBOL_VALUES[matchingSymbol as keyof typeof SYMBOL_VALUES] * bet * 0.3);
    }

    setLastWin(winAmount);
    if (winAmount > 0) {
      onWin(winAmount);
      onBalanceChange(balance + winAmount);
    }
  }, [reelResults, bet, balance, onBalanceChange, onWin]);

  const handleSpin = useCallback(() => {
    console.log('Spin button clicked!', { isSpinning, balance, bet });
    if (isSpinning || balance < bet || !texturesLoaded) {
      console.log('Spin blocked:', { isSpinning, balance, bet, texturesLoaded });
      return;
    }
    
    console.log('Starting spin...');
    setIsSpinning(true);
    setLastWin(0);
    onBalanceChange(balance - bet);
  }, [isSpinning, balance, bet, onBalanceChange, texturesLoaded]);

  // Set up event listener for spin button
  useEffect(() => {
    if (spinButtonRef.current) {
      const button = spinButtonRef.current;
      button.on('pointerdown', handleSpin);
      button.on('click', handleSpin);
      button.on('tap', handleSpin);
      
      return () => {
        button.off('pointerdown', handleSpin);
        button.off('click', handleSpin);
        button.off('tap', handleSpin);
      };
    }
  }, [handleSpin]);

  return (
    <Container>
      {/* Machine background */}
      <Graphics
        draw={(g: any) => {
          g.clear();
          g.beginFill(0x1a1a1a);
          g.drawRoundedRect(50, 50, 500, 350, 20);
          g.endFill();
          g.lineStyle(4, 0x444444);
          g.drawRoundedRect(50, 50, 500, 350, 20);
        }}
      />

      {/* Title */}
      <Text
        text="🎰 SLOT MACHINE 🎰"
        style={new PIXI.TextStyle({
          fontSize: 32,
          fill: 0xFFD700,
          fontWeight: 'bold',
          align: 'center'
        })}
        x={300}
        y={80}
        anchor={0.5}
      />

      {/* Loading indicator */}
      {!texturesLoaded && (
        <Text
          text="Loading sprites..."
          style={new PIXI.TextStyle({
            fontSize: 18,
            fill: 0xFFFFFF,
            align: 'center'
          })}
          x={300}
          y={200}
          anchor={0.5}
        />
      )}

      {/* Reels */}
      {texturesLoaded && (
        <>
          <Reel
            x={150}
            symbols={SYMBOLS}
            isSpinning={isSpinning}
            onSpinComplete={(symbol) => handleReelComplete(symbol, 0)}
            spinDuration={60 + Math.random() * 30}
          />
          <Reel
            x={300}
            symbols={SYMBOLS}
            isSpinning={isSpinning}
            onSpinComplete={(symbol) => handleReelComplete(symbol, 1)}
            spinDuration={80 + Math.random() * 30}
          />
          <Reel
            x={450}
            symbols={SYMBOLS}
            isSpinning={isSpinning}
            onSpinComplete={(symbol) => handleReelComplete(symbol, 2)}
            spinDuration={100 + Math.random() * 30}
          />
        </>
      )}

      {/* Win display */}
      {lastWin > 0 && (
        <Text
          text={`WIN: $${lastWin}`}
          style={new PIXI.TextStyle({
            fontSize: 24,
            fill: 0x00FF00,
            fontWeight: 'bold',
            align: 'center'
          })}
          x={300}
          y={340}
          anchor={0.5}
        />
      )}

      {/* Spin button */}
      <Container
        ref={spinButtonRef}
        x={300}
        y={380}
        interactive={true}
        cursor="pointer"
      >
        <Graphics
          draw={(g: any) => {
            g.clear();
            if (isSpinning || balance < bet || !texturesLoaded) {
              g.beginFill(0x666666);
            } else {
              g.beginFill(0xFF4444);
            }
            g.drawCircle(0, 0, 40);
            g.endFill();
            g.lineStyle(3, 0xFFFFFF);
            g.drawCircle(0, 0, 40);
          }}
        />
        
        <Text
          text={isSpinning ? "SPINNING..." : !texturesLoaded ? "LOADING..." : "SPIN"}
          style={new PIXI.TextStyle({
            fontSize: 16,
            fill: 0xFFFFFF,
            fontWeight: 'bold',
            align: 'center'
          })}
          anchor={0.5}
        />
      </Container>
    </Container>
  );
};

interface SlotGameProps {}

const SlotGame: React.FC<SlotGameProps> = () => {
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [totalWins, setTotalWins] = useState(0);

  const handleWin = useCallback((amount: number) => {
    setTotalWins(prev => prev + amount);
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      backgroundColor: '#0a0a0a',
      minHeight: '100vh',
      padding: '20px'
    }}>
      {/* Game stats */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '20px',
        color: 'white',
        fontSize: '18px'
      }}>
        <div>Balance: ${balance}</div>
        <div>Bet: ${bet}</div>
        <div>Total Wins: ${totalWins}</div>
      </div>

      {/* Bet controls */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px'
      }}>
        <button 
          onClick={() => setBet(Math.max(1, bet - 5))}
          style={{
            padding: '10px 20px',
            backgroundColor: '#444',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Bet -$5
        </button>
        <button 
          onClick={() => setBet(bet + 5)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#444',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Bet +$5
        </button>
        <button 
          onClick={() => setBet(Math.min(balance, 50))}
          style={{
            padding: '10px 20px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Max Bet
        </button>
      </div>

      {/* Pixi.js Application */}
      <Application 
        width={600} 
        height={500} 
        backgroundColor={0x222222}
        antialias={true}
      >
        <SlotMachine 
          balance={balance}
          bet={bet}
          onBalanceChange={setBalance}
          onWin={handleWin}
        />
      </Application>

      {/* Paytable */}
      <div style={{ 
        marginTop: '20px',
        color: 'white',
        textAlign: 'center'
      }}>
        <h3>Paytable (3 of a kind)</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '10px',
          maxWidth: '400px'
        }}>
          {Object.entries(SYMBOL_VALUES).map(([symbol, value]) => (
            <div key={symbol} style={{ 
              padding: '5px',
              backgroundColor: '#333',
              borderRadius: '5px',
              textTransform: 'capitalize'
            }}>
              {symbol.replace('_', ' ')} = {value}x
            </div>
          ))}
        </div>
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#ccc' }}>
          Two of a kind pays 30% of three of a kind
        </div>
      </div>
    </div>
  );
};

export default SlotGame;