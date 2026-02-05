import React, { useState, useEffect } from "react";
import "../component-styles/Board.css";
import PromotionModal from "./PromotionModal";

const Board = ({
  board,          // 2D army representing the board
  onPieceDrop,    // Callback when a move is made: (start, end, promotion) => boolean
  playerColor,    // 'white' or 'black'
  isMyTurn,       // Boolean
  lastMove,       // Last move object for highlighting { from, to }
  game,           // Chess.js game instance
  isOfflineFriendMode,
}) => {
  const [boardSize, setBoardSize] = useState(500);

  // Click Interaction State
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]); // Array of move objects from chess.js

  // Promotion State
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [pendingMove, setPendingMove] = useState(null); // { from, to }

  useEffect(() => {
    const updateBoardSize = () => {
      const size = Math.min(window.innerWidth, window.innerHeight) * 0.6;
      setBoardSize(size);
    };
    updateBoardSize();
    window.addEventListener("resize", updateBoardSize);
    return () => window.removeEventListener("resize", updateBoardSize);
  }, []);

  const getSquareName = (row, col) => {
    const file = String.fromCharCode('a'.charCodeAt(0) + col);
    const rank = 8 - row;
    return `${file}${rank}`;
  };

  const handleSquareClick = (row, col, piece) => {
    // In offline mode, we always allow interaction on the board
    if (!isMyTurn && !isOfflineFriendMode) return;

    const squareName = getSquareName(row, col);

    // 1. If we have a selected square, check if this click is a valid move
    if (selectedSquare) {
      const validMove = possibleMoves.find(m => m.to === squareName);

      if (validMove) {
        // It's a valid move!
        // Robust Promotion Check
        const isPromotion = validMove.promotion || (validMove.flags && validMove.flags.includes('p'));
        console.log(`🎯 Move to ${squareName} | isPromotion: ${isPromotion}`, validMove);

        if (isPromotion) {
          console.log("♟️ Promotion detected! Opening modal...");
          setPendingMove({ from: selectedSquare, to: squareName });
          setShowPromotionModal(true);
          return;
        }

        // Execute move
        onPieceDrop(selectedSquare, squareName);
        clearSelection();
        return;
      }

      // If clicking the same square or another own piece, switch selection
      // otherwise, just deselect
    }

    // 2. Select a piece
    if (piece) {
      const isWhitePiece = piece === piece.toUpperCase();
      const currentTurn = game.turn(); // 'w' or 'b'

      let isMyPiece;
      if (isOfflineFriendMode) {
        // In offline mode, "my piece" is whoever's turn it is
        isMyPiece = (currentTurn === 'w' && isWhitePiece) || (currentTurn === 'b' && !isWhitePiece);
      } else {
        isMyPiece = (playerColor === 'white' && isWhitePiece) || (playerColor === 'black' && !isWhitePiece);
      }

      if (isMyPiece) {
        if (selectedSquare === squareName) {
          clearSelection(); // Toggle off
        } else {
          setSelectedSquare(squareName);
          if (game) {
            // Get valid moves for this square
            const moves = game.moves({ square: squareName, verbose: true });
            setPossibleMoves(moves);
          }
        }
        return;
      }
    }

    // 3. Clicked empty or enemy piece without a valid move selected -> Clear
    clearSelection();
  };

  const clearSelection = () => {
    setSelectedSquare(null);
    setPossibleMoves([]);
  };

  const handlePromotionSelect = (pieceType) => {
    if (pendingMove) {
      // Map selection to char
      const p = pieceType.startsWith('q') ? 'q' : pieceType.startsWith('r') ? 'r' : pieceType.startsWith('b') ? 'b' : 'n';
      onPieceDrop(pendingMove.from, pendingMove.to, p);
    }
    setShowPromotionModal(false);
    setPendingMove(null);
    clearSelection();
  };

  // Realistic Piece URLs
  const getPieceImage = (piece) => {
    if (!piece) return null;
    const color = piece === piece.toUpperCase() ? 'w' : 'b';
    const type = piece.toLowerCase();
    const url = `https://upload.wikimedia.org/wikipedia/commons/${color === 'w' ?
      (type === 'p' ? '4/45/Chess_plt45' : type === 'r' ? '7/72/Chess_rlt45' : type === 'n' ? '7/70/Chess_nlt45' : type === 'b' ? 'b/b1/Chess_blt45' : type === 'q' ? '1/15/Chess_qlt45' : '4/42/Chess_klt45')
      :
      (type === 'p' ? 'c/c7/Chess_pdt45' : type === 'r' ? 'f/ff/Chess_rdt45' : type === 'n' ? 'e/ef/Chess_ndt45' : type === 'b' ? '9/98/Chess_bdt45' : type === 'q' ? '4/47/Chess_qdt45' : 'f/f0/Chess_kdt45')
      }.svg`;
    return <img src={url} alt={piece} style={{ width: '90%', height: '90%', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))' }} />;
  };

  // Determine which squares to render based on flip
  const renderIndices = Array.from({ length: 8 }, (_, i) => i);
  const rows = playerColor === 'black' ? [...renderIndices].reverse() : renderIndices;
  const cols = playerColor === 'black' ? [...renderIndices].reverse() : renderIndices;

  return (
    <div
      ref={(node) => { if (node) setBoardSize(node.offsetWidth); }}
      className="board-container"
      style={{
        width: '100%',
        aspectRatio: '1/1',
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(8, 1fr)',
        border: '5px solid #222',
        borderRadius: '4px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.5)',
        position: 'relative'
      }}
    >
      {rows.map((rIndex) => (
        cols.map((cIndex) => {
          const piece = board[rIndex][cIndex];
          const isDark = (rIndex + cIndex) % 2 === 1;
          const squareName = getSquareName(rIndex, cIndex);
          const isSelected = selectedSquare === squareName;
          const isHighlight = lastMove && (lastMove.from === squareName || lastMove.to === squareName);

          // Move Hints
          const moveHint = possibleMoves.find(m => m.to === squareName);
          const isPossibleMove = !!moveHint;
          const isCapture = isPossibleMove && (moveHint.flags.includes('c') || moveHint.flags.includes('e'));

          // King Check Highlight
          const isKing = piece && piece.toLowerCase() === 'k';
          const isTurnKing = isKing && (
            (game.turn() === 'w' && piece === 'K') ||
            (game.turn() === 'b' && piece === 'k')
          );
          const inCheck = isTurnKing && game && game.inCheck();

          // Coordinate visibility logic (always on the bottom and left edges of the VIEW)
          const isLeftEdge = playerColor === 'black' ? cIndex === 7 : cIndex === 0;
          const isBottomEdge = playerColor === 'black' ? rIndex === 0 : rIndex === 7;

          return (
            <div
              key={`${rIndex}-${cIndex}`}
              className={`square ${isDark ? 'dark' : 'light'} ${isSelected ? 'selected-square' : ''} ${isHighlight ? 'highlight' : ''}`}
              onClick={() => handleSquareClick(rIndex, cIndex, piece)}
              style={{
                backgroundColor: isSelected ? 'rgba(255, 255, 0, 0.6)' :
                  (inCheck ? 'rgba(255, 0, 0, 0.7)' :
                    (isHighlight ? 'rgba(255, 255, 0, 0.3)' : undefined))
              }}
            >
              {/* Coordinates */}
              {isLeftEdge && (
                <span className="coordinate rank" style={{
                  position: 'absolute',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: isDark ? '#eeeed2' : '#769656',
                  top: '2px',
                  left: '2px',
                  zIndex: 3
                }}>
                  {8 - rIndex}
                </span>
              )}
              {isBottomEdge && (
                <span className="coordinate file" style={{
                  position: 'absolute',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: isDark ? '#eeeed2' : '#769656',
                  bottom: '2px',
                  right: '2px',
                  zIndex: 3
                }}>
                  {String.fromCharCode('a'.charCodeAt(0) + cIndex)}
                </span>
              )}

              {/* Piece Layer - No more .flipped needed */}
              {piece && (
                <div
                  className="piece"
                  style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                    zIndex: 2,
                    cursor: (isMyTurn || isOfflineFriendMode) ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {getPieceImage(piece)}
                </div>
              )}

              {/* Possible Move Indicator */}
              {isPossibleMove && !isCapture && (
                <div style={{
                  position: 'absolute',
                  width: '30%',
                  height: '30%',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0, 0, 0, 0.25)',
                  zIndex: 1,
                  pointerEvents: 'none'
                }} />
              )}
              {isCapture && (
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  boxSizing: 'border-box',
                  border: '4px solid rgba(0, 0, 0, 0.15)',
                  borderRadius: '50%',
                  zIndex: 1,
                  pointerEvents: 'none'
                }} />
              )}
            </div>
          );
        })
      ))}
      {showPromotionModal && (
        <PromotionModal
          color={game.turn()}
          onSelect={handlePromotionSelect}
          onClose={() => setShowPromotionModal(false)}
        />
      )}
    </div>
  );
};

export default Board;