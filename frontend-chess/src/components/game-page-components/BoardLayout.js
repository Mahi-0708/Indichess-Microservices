import React from "react";
import Player from "./Player";
import Board from "./Board";
import "../component-styles/BoardLayout.css";

const BoardLayout = ({
  addMove,
  sendMove,
  opponentMove,
  playerColor,
  isMyTurn,
  matchId,
  isConnected,
  gameData,
  isBotMode,
  // NEW PROPS
  board,
  onPieceDrop,
  lastMove,
  game,
  isOfflineFriendMode,
  whiteTime,
  blackTime
}) => {
  const opponent = playerColor === 'white' ? gameData?.player2 : gameData?.player1;
  const self = playerColor === 'white' ? gameData?.player1 : gameData?.player2;

  const currentTurn = game?.turn(); // 'w' or 'b'
  const isOpponentTurn = (playerColor === 'white' && currentTurn === 'b') || (playerColor === 'black' && currentTurn === 'w');
  const isSelfTurn = !isOpponentTurn;

  const opponentColor = playerColor === 'white' ? 'black' : 'white';
  const opponentTime = playerColor === 'white' ? blackTime : whiteTime;
  const selfTime = playerColor === 'white' ? whiteTime : blackTime;

  return (
    <div className="board-layout-main" style={{ width: '100%', maxWidth: '600px' }}>
      <Player
        player={opponent}
        isOpponent={true}
        isBot={isBotMode}
        color={opponentColor}
        isActive={isOpponentTurn}
        timeLeft={opponentTime}
      />
      <div style={{ margin: '20px 0' }}>
        <Board
          // Legacy props (some might be unused now but acceptable to keep for safety)
          addMove={addMove}
          sendMove={sendMove}
          opponentMove={opponentMove}
          isConnected={isConnected}
          matchId={matchId}
          // Essential props for new logic
          board={board}
          onPieceDrop={onPieceDrop}
          playerColor={playerColor}
          isMyTurn={isMyTurn}
          lastMove={lastMove}
          game={game}
          isOfflineFriendMode={isOfflineFriendMode}
        />
      </div>
      <Player
        player={self}
        isOpponent={false}
        isBot={false}
        color={playerColor}
        isActive={isSelfTurn}
        timeLeft={selfTime}
      />
    </div>
  );
};

export default BoardLayout;