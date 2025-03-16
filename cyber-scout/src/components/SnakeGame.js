import React, { useState, useEffect, useCallback, useRef } from 'react';

const SnakeGame = ({ onClose }) => {
  const [snake, setSnake] = useState([[8, 8], [7, 8]]);
  const [food, setFood] = useState([3, 3]);
  const [foodType, setFoodType] = useState('apple'); // 'apple' or 'orange'
  const [direction, setDirection] = useState('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(150);
  const [difficulty, setDifficulty] = useState('easy'); // 'baby', 'easy', or 'hard'
  const [speedBoostTiles, setSpeedBoostTiles] = useState(0);
  const [baseSpeed, setBaseSpeed] = useState(150);
  const [gridSize, setGridSize] = useState(16); // Default to 16x16 grid
  const [snakeColor, setSnakeColor] = useState('#00ff00');
  const [colorMode, setColorMode] = useState('preset');
  const [rgbValues, setRgbValues] = useState({ r: 0, g: 255, b: 0 });
  const nextDirectionRef = useRef(direction);

  const presetColors = {
    'BERT/"Bear"ly': '#00ff00',
    'Blue Crew': '#0000ff',
    'Outliers/Riot Crew': '#ff0000',
    'Triple Helix': '#ffff00',
    'Code Purple': '#800080',
    'Orange Chaos': '#ffa500',
    'Northern Force 172': '#ff69b4',
    'Cyan!': '#00ffff'
  };

  // Generate random food position and type
  const generateFood = useCallback(() => {
    const newFood = [
      Math.floor(Math.random() * gridSize),
      Math.floor(Math.random() * gridSize)
    ];
    // Check if the position is occupied by snake
    if (!snake.some(segment => segment[0] === newFood[0] && segment[1] === newFood[1])) {
      setFood(newFood);
      // 30% chance for orange
      setFoodType(Math.random() < 0.3 ? 'orange' : 'apple');
    } else {
      generateFood(); // Try again if position is occupied
    }
  }, [snake, gridSize]);

  // Check for win condition
  useEffect(() => {
    if (difficulty === 'baby' && snake.length === gridSize * gridSize) {
      setGameWon(true);
      setGameOver(true);
    }
  }, [snake, gridSize, difficulty]);

  // Speed boost effect
  useEffect(() => {
    if (speedBoostTiles > 0) {
      setSpeed(baseSpeed / 1.5);
    } else {
      setSpeed(baseSpeed);
    }
  }, [speedBoostTiles, baseSpeed]);

  // Game loop
  useEffect(() => {
    if (!gameOver && !gameWon) {
      const interval = setInterval(moveSnake, speed);
      return () => clearInterval(interval);
    }
  }, [snake, gameOver, gameWon, speed]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      const currentDirection = nextDirectionRef.current;
      switch (e.key) {
        case 'ArrowUp':
          if (currentDirection !== 'DOWN') {
            nextDirectionRef.current = 'UP';
            setDirection('UP');
          }
          break;
        case 'ArrowDown':
          if (currentDirection !== 'UP') {
            nextDirectionRef.current = 'DOWN';
            setDirection('DOWN');
          }
          break;
        case 'ArrowLeft':
          if (currentDirection !== 'RIGHT') {
            nextDirectionRef.current = 'LEFT';
            setDirection('LEFT');
          }
          break;
        case 'ArrowRight':
          if (currentDirection !== 'LEFT') {
            nextDirectionRef.current = 'RIGHT';
            setDirection('RIGHT');
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Handle grid click/tap for direction
  const handleGridClick = (e, gridDiv) => {
    if (gameOver || gameWon) return;
    
    const gridRect = gridDiv.getBoundingClientRect();
    const x = e.clientX - gridRect.left;
    const y = e.clientY - gridRect.top;
    
    // Get snake head position in pixels
    const cellSize = 20;
    const headX = (snake[0][0] * cellSize) + (cellSize / 2);
    const headY = (snake[0][1] * cellSize) + (cellSize / 2);
    
    // Calculate angle between head and click
    const deltaX = x - headX;
    const deltaY = y - headY;
    let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    
    // Convert angle to direction based on which quadrant was clicked
    const currentDirection = nextDirectionRef.current;
    if (angle <= 45 || angle > 315) { // Right
      if (currentDirection !== 'LEFT') {
        nextDirectionRef.current = 'RIGHT';
        setDirection('RIGHT');
      }
    } else if (angle > 45 && angle <= 135) { // Down
      if (currentDirection !== 'UP') {
        nextDirectionRef.current = 'DOWN';
        setDirection('DOWN');
      }
    } else if (angle > 135 && angle <= 225) { // Left
      if (currentDirection !== 'RIGHT') {
        nextDirectionRef.current = 'LEFT';
        setDirection('LEFT');
      }
    } else { // Up
      if (currentDirection !== 'DOWN') {
        nextDirectionRef.current = 'UP';
        setDirection('UP');
      }
    }
  };

  // Move snake
  const moveSnake = () => {
    const newSnake = [...snake];
    let head = [...newSnake[0]];

    // Use the nextDirectionRef for movement
    switch (nextDirectionRef.current) {
      case 'RIGHT':
        head[0] = head[0] + 1;
        break;
      case 'LEFT':
        head[0] = head[0] - 1;
        break;
      case 'UP':
        head[1] = head[1] - 1;
        break;
      case 'DOWN':
        head[1] = head[1] + 1;
        break;
      default:
        break;
    }

    // Check for wall collision in hard mode
    if (difficulty === 'hard' && (head[0] < 0 || head[0] >= gridSize || head[1] < 0 || head[1] >= gridSize)) {
      setGameOver(true);
      return;
    }

    // Wrap around in easy/baby mode
    head[0] = (head[0] + gridSize) % gridSize;
    head[1] = (head[1] + gridSize) % gridSize;

    // Check if snake hits itself (except in baby mode)
    if (difficulty !== 'baby' && newSnake.some(segment => segment[0] === head[0] && segment[1] === head[1])) {
      setGameOver(true);
      return;
    }

    newSnake.unshift(head);

    // Update speed boost counter
    if (speedBoostTiles > 0) {
      setSpeedBoostTiles(prev => prev - 1);
    }

    // Check if snake eats food
    if (head[0] === food[0] && head[1] === food[1]) {
      setScore(score + 1);
      if (foodType === 'orange') {
        setSpeedBoostTiles(30); // Increased to 30 tiles
      }
      generateFood();
      if (baseSpeed > 50) setBaseSpeed(prev => prev - 5);
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  };

  // Handle mobile controls
  const handleMobileControl = (newDirection) => {
    const currentDirection = nextDirectionRef.current;
    switch (newDirection) {
      case 'UP':
        if (currentDirection !== 'DOWN') {
          nextDirectionRef.current = 'UP';
          setDirection('UP');
        }
        break;
      case 'DOWN':
        if (currentDirection !== 'UP') {
          nextDirectionRef.current = 'DOWN';
          setDirection('DOWN');
        }
        break;
      case 'LEFT':
        if (currentDirection !== 'RIGHT') {
          nextDirectionRef.current = 'LEFT';
          setDirection('LEFT');
        }
        break;
      case 'RIGHT':
        if (currentDirection !== 'LEFT') {
          nextDirectionRef.current = 'RIGHT';
          setDirection('RIGHT');
        }
        break;
      default:
        break;
    }
  };

  // Restart game with new grid size
  const restartGame = (newGridSize = gridSize) => {
    // Calculate middle position for new grid size
    const middlePos = Math.floor(newGridSize / 2);
    setSnake([[middlePos, middlePos], [middlePos - 1, middlePos]]);
    setDirection('RIGHT');
    nextDirectionRef.current = 'RIGHT';
    setGameOver(false);
    setGameWon(false);
    setScore(0);
    setBaseSpeed(150);
    setSpeed(150);
    setSpeedBoostTiles(0);
    setGridSize(newGridSize);
    // Generate food after grid size is set
    setTimeout(() => generateFood(), 0);
  };

  // Handle RGB input change
  const handleRGBChange = (color, value) => {
    const newValue = Math.min(255, Math.max(0, parseInt(value) || 0));
    const newRgbValues = { ...rgbValues, [color]: newValue };
    setRgbValues(newRgbValues);
    setSnakeColor(`rgb(${newRgbValues.r}, ${newRgbValues.g}, ${newRgbValues.b})`);
  };

  // Render food with stem
  const renderFood = (x, y) => {
    const baseStyle = {
      width: '20px',
      height: '20px',
      position: 'relative',
      backgroundColor: foodType === 'apple' ? '#dc3545' : '#ffa500',
      borderRadius: '50%'
    };

    const stemStyle = {
      position: 'absolute',
      width: '2px',
      height: '6px',
      backgroundColor: '#28a745',
      top: '-4px',
      left: '9px'
    };

    const leafStyle = {
      position: 'absolute',
      width: '4px',
      height: '4px',
      backgroundColor: '#28a745',
      borderRadius: '50% 0',
      transform: 'rotate(-45deg)',
      top: '-4px',
      left: '10px'
    };

    return (
      <div style={baseStyle}>
        <div style={stemStyle} />
        <div style={leafStyle} />
      </div>
    );
  };

  // Helper function to render snake segment with eyes and tongue
  const renderSnakeSegment = (x, y, isHead) => {
    const baseStyle = {
      width: '20px',
      height: '20px',
      backgroundColor: snakeColor,
      borderRadius: '4px',
      position: 'relative'
    };

    if (!isHead) return <div style={baseStyle} />;

    // Add eyes and tongue based on direction
    const eyeStyle = {
      position: 'absolute',
      width: '4px',
      height: '4px',
      backgroundColor: 'white',
      borderRadius: '50%'
    };

    const tongueStyle = {
      position: 'absolute',
      width: '8px',
      height: '4px',
      backgroundColor: 'red',
      borderRadius: '2px'
    };

    let eyePositions;
    let tonguePosition;

    switch (direction) {
      case 'RIGHT':
        eyePositions = [
          { top: '3px', right: '3px' },
          { bottom: '3px', right: '3px' }
        ];
        tonguePosition = { top: '8px', right: '-4px' };
        break;
      case 'LEFT':
        eyePositions = [
          { top: '3px', left: '3px' },
          { bottom: '3px', left: '3px' }
        ];
        tonguePosition = { top: '8px', left: '-4px' };
        break;
      case 'UP':
        eyePositions = [
          { top: '3px', left: '3px' },
          { top: '3px', right: '3px' }
        ];
        tonguePosition = { top: '-4px', left: '8px' };
        break;
      case 'DOWN':
        eyePositions = [
          { bottom: '3px', left: '3px' },
          { bottom: '3px', right: '3px' }
        ];
        tonguePosition = { bottom: '-4px', left: '8px' };
        break;
      default:
        break;
    }

    return (
      <div style={baseStyle}>
        <div style={{ ...eyeStyle, ...eyePositions[0] }} />
        <div style={{ ...eyeStyle, ...eyePositions[1] }} />
        <div style={{ ...tongueStyle, ...tonguePosition }} />
      </div>
    );
  };

  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">🐍 Snake Game 🐍</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body text-center">
            {/* Grid Size Slider */}
            <div className="mb-3">
              <label className="form-label">Grid Size: {gridSize}x{gridSize}</label>
              <input
                type="range"
                className="form-range"
                min="5"
                max="20"
                value={gridSize}
                onChange={(e) => {
                  const newSize = parseInt(e.target.value);
                  restartGame(newSize);
                }}
              />
              <div className="d-flex justify-content-between">
                <small>5x5</small>
                <small>16x16</small>
                <small>20x20</small>
              </div>
            </div>

            {/* Difficulty Slider */}
            <div className="mb-3">
              <label className="form-label">Difficulty</label>
              <input
                type="range"
                className="form-range"
                min="0"
                max="2"
                value={difficulty === 'baby' ? 0 : difficulty === 'easy' ? 1 : 2}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setDifficulty(value === 0 ? 'baby' : value === 1 ? 'easy' : 'hard');
                  restartGame();
                }}
              />
              <div className="d-flex justify-content-between">
                <small>Baby</small>
                <small>Easy</small>
                <small>Hard</small>
              </div>
            </div>

            {/* Snake Color Selection */}
            <div className="mb-3">
              <label className="form-label">Snake Color</label>
              <div className="d-flex gap-2 align-items-center justify-content-center">
                <select
                  className="form-select"
                  style={{ width: '120px' }}
                  value={colorMode}
                  onChange={(e) => setColorMode(e.target.value)}
                >
                  <option value="preset">Preset Colors</option>
                  <option value="rgb">RGB Values</option>
                </select>
                
                {colorMode === 'preset' ? (
                  <select
                    className="form-select"
                    style={{ width: '100px' }}
                    value={snakeColor}
                    onChange={(e) => setSnakeColor(e.target.value)}
                  >
                    {Object.entries(presetColors).map(([name, color]) => (
                      <option key={color} value={color}>{name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="d-flex" style={{ gap: '4px' }}>
                    <div style={{ width: '60px' }}>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text px-1" style={{ width: '24px', justifyContent: 'center' }}>R</span>
                        <input
                          type="number"
                          className="form-control px-1"
                          min="0"
                          max="255"
                          value={rgbValues.r}
                          onChange={(e) => handleRGBChange('r', e.target.value)}
                          style={{ width: '36px' }}
                        />
                      </div>
                    </div>
                    <div style={{ width: '60px' }}>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text px-1" style={{ width: '24px', justifyContent: 'center' }}>G</span>
                        <input
                          type="number"
                          className="form-control px-1"
                          min="0"
                          max="255"
                          value={rgbValues.g}
                          onChange={(e) => handleRGBChange('g', e.target.value)}
                          style={{ width: '36px' }}
                        />
                      </div>
                    </div>
                    <div style={{ width: '60px' }}>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text px-1" style={{ width: '24px', justifyContent: 'center' }}>B</span>
                        <input
                          type="number"
                          className="form-control px-1"
                          min="0"
                          max="255"
                          value={rgbValues.b}
                          onChange={(e) => handleRGBChange('b', e.target.value)}
                          style={{ width: '36px' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Game Grid */}
            <div 
              style={{ 
                display: 'grid',
                gridTemplateColumns: `repeat(${gridSize}, 20px)`,
                gap: '1px',
                backgroundColor: '#e9ecef',
                padding: '10px',
                margin: '0 auto',
                width: 'fit-content',
                cursor: 'pointer'
              }}
              onClick={(e) => handleGridClick(e, e.currentTarget)}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                handleGridClick({
                  clientX: touch.clientX,
                  clientY: touch.clientY
                }, e.currentTarget);
              }}
            >
              {Array.from({ length: gridSize * gridSize }).map((_, index) => {
                const x = index % gridSize;
                const y = Math.floor(index / gridSize);
                const isSnake = snake.some(segment => segment[0] === x && segment[1] === y);
                const isHead = snake[0][0] === x && snake[0][1] === y;
                const isFood = food[0] === x && food[1] === y;

                return (
                  <div
                    key={index}
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: isSnake ? snakeColor : 'white',
                      border: '1px solid #dee2e6',
                      position: 'relative',
                      borderRadius: isHead ? '8px' : isSnake ? '4px' : '0'
                    }}
                  >
                    {isHead && (
                      <>
                        <div style={{
                          position: 'absolute',
                          width: '4px',
                          height: '4px',
                          backgroundColor: 'black',
                          borderRadius: '50%',
                          top: direction === 'UP' ? '2px' : direction === 'DOWN' ? '12px' : '4px',
                          left: direction === 'LEFT' ? '2px' : direction === 'RIGHT' ? '12px' : '4px'
                        }} />
                        <div style={{
                          position: 'absolute',
                          width: '4px',
                          height: '4px',
                          backgroundColor: 'black',
                          borderRadius: '50%',
                          top: direction === 'UP' ? '2px' : direction === 'DOWN' ? '12px' : '10px',
                          left: direction === 'LEFT' ? '2px' : direction === 'RIGHT' ? '12px' : '10px'
                        }} />
                      </>
                    )}
                    {isFood && renderFood(x, y)}
                  </div>
                );
              })}
            </div>
            <div className="mt-3">
              <p className="mb-2">
                Score: {score}
                {speedBoostTiles > 0 && <span className="ms-2">🔥 Speed Boost: {speedBoostTiles}</span>}
              </p>
            </div>
            
            {/* Game Over/Won Message */}
            {(gameOver || gameWon) && (
              <div className="position-absolute top-50 start-50 translate-middle">
                <div className="bg-dark bg-opacity-75 text-white p-3 rounded">
                  <h2>{gameWon ? "You Win!" : "Game Over!"}</h2>
                  <p>Score: {score}</p>
                  <button className="btn btn-primary" onClick={() => restartGame()}>
                    Play Again
                  </button>
                </div>
              </div>
            )}
            
            {/* Controls Container */}
            <div className="d-flex justify-content-center mt-4">
              {/* Arrow Controls */}
              <div className="d-flex flex-column align-items-center" style={{ width: '150px' }}>
                <button 
                  className="btn btn-outline-secondary mb-2" 
                  onClick={() => handleMobileControl('UP')}
                >
                  ↑
                </button>
                <div className="d-flex justify-content-between w-100">
                  <button 
                    className="btn btn-outline-secondary" 
                    onClick={() => handleMobileControl('LEFT')}
                  >
                    ←
                  </button>
                  <button 
                    className="btn btn-outline-secondary" 
                    onClick={() => handleMobileControl('RIGHT')}
                  >
                    →
                  </button>
                </div>
                <button 
                  className="btn btn-outline-secondary mt-2" 
                  onClick={() => handleMobileControl('DOWN')}
                >
                  ↓
                </button>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <small className="text-muted">
              {difficulty === 'baby' ? "Baby Mode: Can't die, fill the map to win!" :
               difficulty === 'easy' ? "Easy Mode: Wrap around walls" :
               "Hard Mode: Die on wall collision"} 
              <br />
              Use arrow keys or tap/click the game area to control the snake
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnakeGame;
