const { useState, useEffect, useCallback } = React;

const ROWS = 9;
const COLS = 9;
const MINES = 10;

const Minesweeper = () => {
  const [board, setBoard] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing');
  const [flagsLeft, setFlagsLeft] = useState(MINES);
  const [firstClick, setFirstClick] = useState(true);

  // Initialize empty board
  const initBoard = useCallback(() => {
    const newBoard = [];
    for (let i = 0; i < ROWS; i++) {
      newBoard[i] = [];
      for (let j = 0; j < COLS; j++) {
        newBoard[i][j] = {
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0
        };
      }
    }
    return newBoard;
  }, []);

  // Place mines randomly, avoiding the first clicked cell
  const placeMines = useCallback((board, firstRow, firstCol) => {
    let minesPlaced = 0;
    while (minesPlaced < MINES) {
      const row = Math.floor(Math.random() * ROWS);
      const col = Math.floor(Math.random() * COLS);
      
      if ((row === firstRow && col === firstCol) || board[row][col].isMine) {
        continue;
      }
      
      board[row][col].isMine = true;
      minesPlaced++;
    }
    return board;
  }, []);

  // Calculate neighbor mine counts
  const calculateNumbers = useCallback((board) => {
    for (let i = 0; i < ROWS; i++) {
      for (let j = 0; j < COLS; j++) {
        if (!board[i][j].isMine) {
          let count = 0;
          for (let di = -1; di <= 1; di++) {
            for (let dj = -1; dj <= 1; dj++) {
              const ni = i + di;
              const nj = j + dj;
              if (ni >= 0 && ni < ROWS && nj >= 0 && nj < COLS && board[ni][nj].isMine) {
                count++;
              }
            }
          }
          board[i][j].neighborMines = count;
        }
      }
    }
    return board;
  }, []);

  // Initialize game
  const initGame = useCallback(() => {
    const newBoard = initBoard();
    setBoard(newBoard);
    setGameStatus('playing');
    setFlagsLeft(MINES);
    setFirstClick(true);
  }, [initBoard]);

  // Flood fill algorithm for revealing empty cells
  const revealEmpty = useCallback((board, row, col) => {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS || 
        board[row][col].isRevealed || board[row][col].isFlagged) {
      return;
    }
    
    board[row][col].isRevealed = true;
    
    if (board[row][col].neighborMines === 0) {
      for (let di = -1; di <= 1; di++) {
        for (let dj = -1; dj <= 1; dj++) {
          revealEmpty(board, row + di, col + dj);
        }
      }
    }
  }, []);

  // Handle left click
  const handleCellClick = useCallback((row, col) => {
    if (gameStatus !== 'playing' || board[row][col].isFlagged || board[row][col].isRevealed) {
      return;
    }

    let newBoard = [...board.map(row => [...row])];

    if (firstClick) {
      newBoard = placeMines(newBoard, row, col);
      newBoard = calculateNumbers(newBoard);
      setFirstClick(false);
    }

    if (newBoard[row][col].isMine) {
      for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
          if (newBoard[i][j].isMine) {
            newBoard[i][j].isRevealed = true;
          }
        }
      }
      setGameStatus('lost');
    } else {
      revealEmpty(newBoard, row, col);
      
      let unrevealedSafeCells = 0;
      for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
          if (!newBoard[i][j].isMine && !newBoard[i][j].isRevealed) {
            unrevealedSafeCells++;
          }
        }
      }
      
      if (unrevealedSafeCells === 0) {
        setGameStatus('won');
      }
    }

    setBoard(newBoard);
  }, [board, gameStatus, firstClick, placeMines, calculateNumbers, revealEmpty]);

  // Handle right click (flag)
  const handleRightClick = useCallback((e, row, col) => {
    e.preventDefault();
    
    if (gameStatus !== 'playing' || board[row][col].isRevealed) {
      return;
    }

    const newBoard = [...board.map(row => [...row])];
    
    if (newBoard[row][col].isFlagged) {
      newBoard[row][col].isFlagged = false;
      setFlagsLeft(flagsLeft + 1);
    } else {
      newBoard[row][col].isFlagged = true;
      setFlagsLeft(flagsLeft - 1);
    }
    
    setBoard(newBoard);
  }, [board, gameStatus, flagsLeft]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const getCellContent = (cell) => {
    if (cell.isFlagged) return '🚩';
    if (!cell.isRevealed) return '';
    if (cell.isMine) return '💣';
    if (cell.neighborMines === 0) return '';
    return cell.neighborMines;
  };

  const getNumberColor = (num) => {
    const colors = {
      1: 'text-blue-600',
      2: 'text-green-600',
      3: 'text-red-600',
      4: 'text-purple-600',
      5: 'text-yellow-600',
      6: 'text-pink-600',
      7: 'text-black',
      8: 'text-gray-600'
    };
    return colors[num] || '';
  };

  return React.createElement('div', { 
    className: 'flex flex-col items-center p-6 bg-gray-100 min-h-screen' 
  }, [
    React.createElement('h1', { 
      key: 'title',
      className: 'text-3xl font-bold mb-4 text-gray-800' 
    }, 'Minesweeper'),
    
    React.createElement('div', { 
      key: 'controls',
      className: 'flex items-center gap-6 mb-4' 
    }, [
      React.createElement('div', { 
        key: 'flags',
        className: 'flex items-center gap-2' 
      }, [
        React.createElement('span', { key: 'flag-icon', className: 'text-lg' }, '🚩'),
        React.createElement('span', { key: 'flag-count', className: 'font-semibold' }, flagsLeft)
      ]),
      
      React.createElement('button', {
        key: 'new-game',
        onClick: initGame,
        className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
      }, 'New Game'),
      
      React.createElement('div', { 
        key: 'status',
        className: 'text-lg font-semibold' 
      }, gameStatus === 'playing' ? '😐' : gameStatus === 'won' ? '😎' : '😵')
    ]),

    gameStatus === 'won' && React.createElement('div', {
      key: 'win-message',
      className: 'mb-4 text-green-600 font-bold text-xl'
    }, 'You Won! 🎉'),
    
    gameStatus === 'lost' && React.createElement('div', {
      key: 'lose-message', 
      className: 'mb-4 text-red-600 font-bold text-xl'
    }, 'Game Over! 💥'),

    React.createElement('div', { 
      key: 'board',
      className: 'grid grid-cols-9 gap-1 bg-gray-400 p-2 rounded' 
    }, board.flatMap((row, i) =>
      row.map((cell, j) =>
        React.createElement('button', {
          key: `${i}-${j}`,
          className: `w-8 h-8 text-sm font-bold border border-gray-600 transition-all ${
            cell.isRevealed 
              ? cell.isMine 
                ? 'bg-red-500' 
                : 'bg-gray-200'
              : 'bg-gray-300 hover:bg-gray-250 active:bg-gray-400'
          } ${cell.neighborMines > 0 ? getNumberColor(cell.neighborMines) : ''}`,
          onClick: () => handleCellClick(i, j),
          onContextMenu: (e) => handleRightClick(e, i, j),
          disabled: gameStatus !== 'playing'
        }, getCellContent(cell))
      )
    )),

    React.createElement('div', { 
      key: 'instructions',
      className: 'mt-4 text-sm text-gray-600 text-center' 
    }, [
      React.createElement('p', { key: 'controls-text' }, 'Left click to reveal • Right click to flag'),
      React.createElement('p', { key: 'objective' }, `Find all ${MINES} mines without clicking on them!`)
    ])
  ]);
};

ReactDOM.render(React.createElement(Minesweeper), document.getElementById('root'));
