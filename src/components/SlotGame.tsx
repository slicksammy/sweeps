import React, { useCallback, useState } from 'react';
import SlotReels from './SlotReels';

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

interface SlotGameProps {}

const SlotGame: React.FC<SlotGameProps> = () => {
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(10);
  const [totalWins, setTotalWins] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState(0);

  const handleWin = useCallback((amount: number) => {
    setTotalWins(prev => prev + amount);
  }, []);

  const checkWin = useCallback((results: string[][]) => {
    let totalWinAmount = 0;
    
    // Check horizontal lines (3 rows)
    for (let row = 0; row < 3; row++) {
      const line = [results[0][row], results[1][row], results[2][row]];
      if (line[0] === line[1] && line[1] === line[2]) {
        totalWinAmount += SYMBOL_VALUES[line[0] as keyof typeof SYMBOL_VALUES] * bet;
      }
    }
    
    // Check vertical lines (3 columns)
    for (let col = 0; col < 3; col++) {
      const line = [results[col][0], results[col][1], results[col][2]];
      if (line[0] === line[1] && line[1] === line[2]) {
        totalWinAmount += SYMBOL_VALUES[line[0] as keyof typeof SYMBOL_VALUES] * bet;
      }
    }
    
    // Check diagonal lines
    const diag1 = [results[0][0], results[1][1], results[2][2]];
    if (diag1[0] === diag1[1] && diag1[1] === diag1[2]) {
      totalWinAmount += SYMBOL_VALUES[diag1[0] as keyof typeof SYMBOL_VALUES] * bet;
    }
    
    const diag2 = [results[0][2], results[1][1], results[2][0]];
    if (diag2[0] === diag2[1] && diag2[1] === diag2[2]) {
      totalWinAmount += SYMBOL_VALUES[diag2[0] as keyof typeof SYMBOL_VALUES] * bet;
    }

    setLastWin(totalWinAmount);
    if (totalWinAmount > 0) {
      handleWin(totalWinAmount);
      setBalance(prev => prev + totalWinAmount);
    }
  }, [bet, handleWin]);

  const handleSpinComplete = useCallback((results: string[][]) => {
    setIsSpinning(false);
    checkWin(results);
  }, [checkWin]);

  const handleSpin = useCallback(() => {
    if (isSpinning || balance < bet) {
      return;
    }
    
    setIsSpinning(true);
    setLastWin(0);
    setBalance(prev => prev - bet);
  }, [isSpinning, balance, bet]);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      backgroundColor: '#0a0a0a',
      minHeight: '100vh',
      padding: '20px',
      gap: '20px'
    }}>
      {/* Game stats */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
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
        gap: '10px'
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

      {/* Slot Reels */}
      <SlotReels 
        isSpinning={isSpinning}
        onSpinComplete={handleSpinComplete}
      />

      {/* Spin button */}
      <button
        onClick={handleSpin}
        disabled={isSpinning || balance < bet}
        style={{
          padding: '15px 30px',
          fontSize: '20px',
          fontWeight: 'bold',
          backgroundColor: isSpinning || balance < bet ? '#666' : '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          cursor: isSpinning || balance < bet ? 'not-allowed' : 'pointer',
          minWidth: '120px'
        }}
      >
        {isSpinning ? 'SPINNING...' : 'SPIN'}
      </button>

      {/* Win display */}
      {lastWin > 0 && (
        <div style={{
          fontSize: '24px',
          color: '#00ff00',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          WIN: ${lastWin}
        </div>
      )}

      {/* Paytable */}
      <div style={{ 
        marginTop: '20px',
        color: 'white',
        textAlign: 'center'
      }}>
        <h3>Paytable (3 in a line)</h3>
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
          Horizontal, vertical, and diagonal lines win!
        </div>
      </div>
    </div>
  );
};

export default SlotGame;