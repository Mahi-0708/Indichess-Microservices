import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useBlocker } from "react-router-dom";
import BoardLayout from "./BoardLayout";
import { Chess } from "chess.js";
import GameOverModal from "./GameOverModal";
import ConfirmationModal from "./ConfirmationModal";

const GameContainer = ({ matchId, stompClient, isConnected, playerColor, initialGameData, isBotMode, isOfflineFriendMode, user, timeLimit }) => {
  const navigate = useNavigate();
  const isLocalMode = isBotMode || isOfflineFriendMode;

  // Main Game State
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState("start");
  const [moveHistory, setMoveHistory] = useState([]);
  const [gameStatus, setGameStatus] = useState("Game started");
  const [opponentMove, setOpponentMove] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  // Modal State
  const [activeModal, setActiveModal] = useState(null); // 'resign' | 'draw' | 'draw-incoming' | null
  const [incomingDrawOffer, setIncomingDrawOffer] = useState(null);

  // Timer State (in seconds)
  const effectiveTimeLimit = initialGameData?.timeLimit !== undefined ? initialGameData.timeLimit : (timeLimit === 'stopwatch' ? 'stopwatch' : timeLimit);

  const [whiteTime, setWhiteTime] = useState(effectiveTimeLimit === 'stopwatch' ? 0 : (effectiveTimeLimit || null));
  const [blackTime, setBlackTime] = useState(effectiveTimeLimit === 'stopwatch' ? 0 : (effectiveTimeLimit || null));

  // Refs for Stale Closure Fixes
  const gameRef = useRef(new Chess());
  const engine = useRef(null);
  const hasSaved = useRef(false);

  // Initialize game
  const isInitialized = useRef(false);

  const safeMakeMove = useCallback((move) => {
    try {
      const currentGame = gameRef.current;

      // 1. Create a clone to validate the move safely
      const gameCopy = new Chess(currentGame.fen());
      const result = gameCopy.move(move);

      if (result) {
        // 2. Perform the actual move on the master ref
        currentGame.move(move);

        // 3. UI State Batch Update (Atomic-ish)
        // We use gameCopy (which has the move applied) to derived new states
        const newFen = gameCopy.fen();
        const newHistory = gameCopy.history({ verbose: true });
        let newStatus = "";
        let newIsGameOver = false;
        let nextIsMyTurn = false;

        if (gameCopy.isGameOver()) {
          newIsGameOver = true;
          if (gameCopy.isCheckmate()) newStatus = "Checkmate! " + (gameCopy.turn() === 'w' ? "Black" : "White") + " wins.";
          else if (gameCopy.isDraw()) newStatus = "Draw!";
          else if (gameCopy.isStalemate()) newStatus = "Stalemate!";
          else newStatus = "Game Over";
        } else {
          if (gameCopy.inCheck()) {
            newStatus = "Check!";
          } else {
            const isWhiteTurn = gameCopy.turn() === 'w';
            if (isOfflineFriendMode) {
              newStatus = `${isWhiteTurn ? "White" : "Black"}'s turn`;
            } else {
              const myColorTurnIndicator = playerColor === 'white' ? isWhiteTurn : !isWhiteTurn;
              newStatus = myColorTurnIndicator ? "Your turn!" : (isBotMode ? "Stockfish is thinking..." : "Opponent is thinking...");
            }
          }

          // Determine next turn
          const isWhiteTurn = gameCopy.turn() === 'w';
          nextIsMyTurn = isOfflineFriendMode ? true : (playerColor === 'white' ? isWhiteTurn : !isWhiteTurn);
        }

        // Apply all state updates at once
        setFen(newFen);
        setMoveHistory(prev => [...prev, result]);
        setGameStatus(newStatus);
        setIsGameOver(newIsGameOver);
        setIsMyTurn(nextIsMyTurn);
        setGame(new Chess(newFen)); // Force a new object for React to detect change

        return result;
      }
    } catch (e) {
      console.error("Move error:", e);
      return null;
    }
  }, [playerColor, isOfflineFriendMode, isBotMode]);

  const handleBotMove = (moveStr) => {
    // 1. Guard against moves if game is over
    if (gameRef.current.isGameOver()) return;

    // 2. Guard against move if it's no longer bot's turn
    const turn = gameRef.current.turn();
    const isBotTurn = (playerColor === 'white' && turn === 'b') || (playerColor === 'black' && turn === 'w');
    if (!isBotTurn) {
      console.warn("⚠️ Bot tried to move but it's not its turn.");
      return;
    }

    const from = moveStr.substring(0, 2);
    const to = moveStr.substring(2, 4);
    const promotion = moveStr.length > 4 ? moveStr.substring(4, 5) : undefined;

    console.log(`🤖 Bot Move: ${from} to ${to}${promotion ? ' (promoted to ' + promotion + ')' : ''}`);
    safeMakeMove({ from, to, promotion: promotion || 'q' });
  };
  useEffect(() => {
    // Only initialize ONCE per matchId/mode
    if (isInitialized.current && isLocalMode) return;

    console.log("🎮 GameContainer: Initializing board state");
    const newGame = new Chess();
    if (initialGameData?.fenCurrent && initialGameData.fenCurrent !== "start") {
      try {
        newGame.load(initialGameData.fenCurrent);
      } catch (e) {
        console.error("Invalid FEN:", initialGameData.fenCurrent);
      }
    }
    setGame(newGame);
    gameRef.current = newGame;
    newGame.isOfflineFriendMode = isOfflineFriendMode;

    setFen(newGame.fen());
    setMoveHistory(initialGameData?.moves || newGame.history({ verbose: true }));

    // Initial Turn
    if (isOfflineFriendMode) {
      setIsMyTurn(true);
    } else {
      const isWhiteTurn = newGame.turn() === 'w';
      setIsMyTurn(playerColor === 'white' ? isWhiteTurn : !isWhiteTurn);
    }

    // Handle initial game over state
    if (initialGameData?.status === "FINISHED" || initialGameData?.status === "RESIGNED" || initialGameData?.status === "DRAW") {
      setIsGameOver(true);
      if (initialGameData.status === "RESIGNED") {
        setGameStatus(initialGameData.winner === user?.username ? "Game Over - Opponent Resigned" : "Game Over - You Resigned");
      } else if (initialGameData.status === "DRAW") {
        setGameStatus("Game Over - Draw");
      } else {
        setGameStatus("Game Over");
      }
    }

    isInitialized.current = true;
  }, [matchId, playerColor, isOfflineFriendMode, user?.username]); // Added user?.username

  // Stockfish Engine Setup
  useEffect(() => {
    if (!isBotMode) return;

    const worker = new Worker("/stockfish.js");
    engine.current = worker;

    worker.onmessage = (event) => {
      const message = event.data;
      if (message === "uciok") {
        worker.postMessage("isready");
      } else if (message === "readyok") {
        worker.postMessage("ucinewgame");
      } else if (message.startsWith("bestmove")) {
        const moveStr = message.split(" ")[1];
        if (moveStr && moveStr !== "(none)") {
          // Add delay for realism (1.5 seconds)
          setTimeout(() => handleBotMove(moveStr), 1500);
        }
      }
    };

    worker.postMessage("uci");

    return () => {
      worker.terminate();
    };
  }, [isBotMode]);

  // Timer Effect
  useEffect(() => {
    if (!effectiveTimeLimit || isGameOver) return;

    const timer = setInterval(() => {
      const turn = gameRef.current.turn();
      if (turn === 'w') {
        setWhiteTime(prev => {
          if (effectiveTimeLimit === 'stopwatch') return prev + 1;
          if (prev <= 0) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime(prev => {
          if (effectiveTimeLimit === 'stopwatch') return prev + 1;
          if (prev <= 0) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [effectiveTimeLimit, isGameOver]);

  const handleTimeout = () => {
    if (isGameOver) return;
    console.log("⏰ Time up!");
    setIsGameOver(true);
    setGameStatus("Draw by Timeout"); // User specifically requested to say "game is drawn"
  };

  // Handle Bot Trigger
  useEffect(() => {
    if (!isBotMode || isGameOver) return;

    const currentTurn = gameRef.current.turn();
    const isBotTurn = (playerColor === 'white' && currentTurn === 'b') || (playerColor === 'black' && currentTurn === 'w');

    if (isBotTurn) {
      console.log("🤖 Bot turn detected, triggering engine...");
      const botTimer = setTimeout(() => {
        // Double check it's still bot turn before postMessage
        const checkTurn = gameRef.current.turn();
        const stillBotTurn = (playerColor === 'white' && checkTurn === 'b') || (playerColor === 'black' && checkTurn === 'w');

        if (stillBotTurn && engine.current) {
          setGameStatus("Computer is thinking...");
          engine.current.postMessage(`position fen ${gameRef.current.fen()}`);
          engine.current.postMessage("go depth 10");
        }
      }, 500);
      return () => clearTimeout(botTimer);
    }
  }, [fen, isBotMode, isGameOver, playerColor]);

  // WebSocket Move Subscription (for Online Mode)
  useEffect(() => {
    if (isLocalMode || !stompClient || !isConnected || !matchId) return;

    console.log(`🔌 Subscribing to moves for match: ${matchId}`);
    const subscription = stompClient.subscribe(`/topic/moves/${matchId}`, (message) => {
      const moveData = JSON.parse(message.body);

      // Ignore moves made by self
      if (moveData.playerUsername === user?.username) return;

      console.log("☁️ Received move from opponent:", moveData);

      // Convert row/col to square names
      const from = String.fromCharCode('a'.charCodeAt(0) + moveData.fromCol) + (8 - moveData.fromRow);
      const to = String.fromCharCode('a'.charCodeAt(0) + moveData.toCol) + (8 - moveData.toRow);

      const result = safeMakeMove({
        from,
        to,
        promotion: moveData.promotedTo || 'q'
      });

      if (result) {
        setMoveHistory(prev => [...prev, result]);
      }
    });

    return () => {
      console.log(`🔌 Unsubscribing from moves for match: ${matchId}`);
      subscription.unsubscribe();
    };
  }, [matchId, stompClient, isConnected, isLocalMode, user, safeMakeMove]);

  // WebSocket Game State Subscription (Resign, Draw, etc.)
  useEffect(() => {
    if (isLocalMode || !stompClient || !isConnected || !matchId) return;

    console.log(`🔌 Subscribing to game state for match: ${matchId}`);
    const subscription = stompClient.subscribe(`/topic/game-state/${matchId}`, (message) => {
      const data = JSON.parse(message.body);
      console.log("☁️ Received game state update:", data);

      if (data.type === "RESIGNATION") {
        const resigningPlayer = data.player;
        setIsGameOver(true);
        if (resigningPlayer === user?.username) {
          setGameStatus("Game Over - You Resigned");
        } else {
          setGameStatus(`Game Over - ${resigningPlayer} left the match`);
        }
      } else if (data.type === "DRAW_ACCEPTED") {
        setIsGameOver(true);
        setGameStatus("Game Over - Draw Accepted");
      } else if (data.type === "DRAW_DECLINED") {
        if (data.player !== user?.username) {
          alert(`${data.player} declined the draw offer.`);
        }
      }
    });

    return () => {
      console.log(`🔌 Unsubscribing from game state for match: ${matchId}`);
      subscription.unsubscribe();
    };
  }, [matchId, stompClient, isConnected, isLocalMode, user]);

  // Private Queue Subscription (Draw Offers)
  useEffect(() => {
    if (isLocalMode || !stompClient || !isConnected || !user) return;

    console.log(`🔌 Subscribing to private draw offers for: ${user.username}`);
    const subscription = stompClient.subscribe('/user/queue/draw-offers', (message) => {
      console.log("☁️ WebSocket: Raw private DRAW_OFFER received:", message.body);
      try {
        const data = JSON.parse(message.body);
        console.log("☁️ Parsed draw offer:", data);

        if (data.type === "DRAW_OFFER") {
          const incMatchId = String(data.matchId);
          const currMatchId = String(matchId);
          console.log(`MatchID Check: Incoming=${incMatchId}, Current=${currMatchId}`);

          if (incMatchId === currMatchId) {
            setIncomingDrawOffer(data);
            setActiveModal('draw-incoming');
          } else {
            console.warn("Draw offer is for a different match:", incMatchId);
          }
        }
      } catch (err) {
        console.error("Failed to parse draw offer message:", err);
      }
    });

    return () => {
      console.log("🔌 Unsubscribing from private draw offers");
      subscription.unsubscribe();
    };
  }, [stompClient, isConnected, isLocalMode, user, matchId]);

  // Navigation Protection
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isGameOver && isLocalMode) {
        const message = "A game is currently in progress. Are you sure you want to leave?";
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isGameOver, isLocalMode]);

  // Internal Navigation Blocker
  useBlocker(
    ({ currentLocation, nextLocation }) => {
      // Block if game is in progress and the path is changing
      if (!isGameOver && isLocalMode && currentLocation.pathname !== nextLocation.pathname) {
        const confirmed = window.confirm("A game is currently in progress. Are you sure you want to leave?");
        if (!confirmed) return true; // Stay on the current page
      }
      return false; // Allow navigation
    }
  );

  // Click-based move handler
  const onMove = (sourceSquare, targetSquare, promotionPiece) => {
    // In offline mode, both players click on the same board
    if (isGameOver) return false;
    if (!isOfflineFriendMode && !isMyTurn) return false;

    console.log(`${isOfflineFriendMode ? '👥 Offline' : '👤 Player'} Move: ${sourceSquare} to ${targetSquare}`);
    const move = safeMakeMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: promotionPiece || "q"
    });

    if (move && !isBotMode && !isOfflineFriendMode) {
      // Online logic
      if (stompClient && isConnected) {
        const currentGame = gameRef.current;
        const status = currentGame.isGameOver()
          ? (currentGame.isCheckmate() ? "FINISHED" : "DRAW")
          : "IN_PROGRESS";

        const moveData = {
          fromRow: 8 - parseInt(sourceSquare[1]),
          fromCol: sourceSquare.charCodeAt(0) - 'a'.charCodeAt(0),
          toRow: 8 - parseInt(targetSquare[1]),
          toCol: targetSquare.charCodeAt(0) - 'a'.charCodeAt(0),
          piece: move.piece,
          fenAfter: currentGame.fen(),
          board: getBoard(),
          moveNotation: move.san,
          status: status
        };
        const payload = {
          ...moveData,
          playerColor: playerColor,
          matchId: matchId
        };
        console.log("📤 Publishing move to WebSocket:", payload);
        stompClient.publish({
          destination: `/app/game/${matchId}/move`,
          body: JSON.stringify(payload)
        });
      }
    }
    return move !== null;
  };

  // Resign & Draw Handlers
  const handleResign = () => {
    if (!isLocalMode && stompClient && isConnected) {
      console.log("📤 Publishing resignation to WebSocket");
      stompClient.publish({
        destination: `/app/game/${matchId}/resign`,
        body: JSON.stringify({ matchId })
      });
    } else {
      // Offline/Bot Mode
      setIsGameOver(true);
      setGameStatus("Game Over - You Resigned");
    }
    setActiveModal(null);
  };

  const handleDrawResponse = () => {
    if (!isLocalMode && stompClient && isConnected) {
      console.log("📤 Publishing draw offer to WebSocket");
      stompClient.publish({
        destination: `/app/game/${matchId}/draw`,
        body: JSON.stringify({ matchId })
      });
    } else if (isBotMode) {
      // Bot Logic: Declined
      alert("Stockfish declined the draw.");
    } else if (isOfflineFriendMode) {
      // For offline, just accept the draw if offered
      setIsGameOver(true);
      setGameStatus("Game Over - Draw Accepted");
    }
    setActiveModal(null);
  };

  const handleAcceptDraw = () => {
    if (stompClient && isConnected) {
      stompClient.publish({
        destination: `/app/game/${matchId}/draw/accept`,
        body: JSON.stringify({ matchId })
      });
    }
    setActiveModal(null);
    setIncomingDrawOffer(null);
  };

  const handleDeclineDraw = () => {
    if (stompClient && isConnected) {
      stompClient.publish({
        destination: `/app/game/${matchId}/draw/decline`,
        body: JSON.stringify({ matchId })
      });
    }
    setActiveModal(null);
    setIncomingDrawOffer(null);
  };

  // Handle Game Over persistence
  useEffect(() => {
    if ((isBotMode || isOfflineFriendMode) && isGameOver && !hasSaved.current) {
      hasSaved.current = true;

      const currentGame = gameRef.current;
      let winnerName = null;

      if (currentGame.isCheckmate()) {
        const checkmatedColor = currentGame.turn(); // 'w' or 'b'
        const winningColor = checkmatedColor === 'w' ? 'black' : 'white';

        if (isOfflineFriendMode) {
          // For offline, player1 is whoever started as the color in URL, player2 is opponent name
          const p1Name = (initialGameData.player1.username !== "Computer (Stockfish)" &&
            initialGameData.player1.username !== (initialGameData.opponent || "Friend"))
            ? initialGameData.player1.username
            : initialGameData.player2.username;

          const p2Name = initialGameData.opponent || (initialGameData.player2.username === p1Name ? initialGameData.player1.username : initialGameData.player2.username);

          // Simpler logic: if winning color matches playerColor (URL starting color), it's P1
          winnerName = (winningColor === playerColor) ? p1Name : p2Name;
        } else {
          // Bot Mode
          if (winningColor === playerColor) {
            winnerName = (initialGameData.player1 && initialGameData.player1.username !== "Computer (Stockfish)")
              ? initialGameData.player1.username
              : initialGameData.player2.username;
          } else {
            winnerName = "Computer";
          }
        }
      } else if (gameStatus.toLowerCase().includes("resign")) {
        // Resignation logic
        if (isOfflineFriendMode) {
          // In offline, we need to know WHO resigned. For now assuming Player 1
          winnerName = "Room for improvement";
        } else {
          winnerName = "Computer";
        }
      }

      const resultData = {
        status: gameStatus,
        playerColor: playerColor,
        fen: currentGame.fen(),
        winner: winnerName,
        opponentName: isOfflineFriendMode ? (initialGameData.player1.username === user?.username ? initialGameData.player2.username : initialGameData.player1.username) : "Computer",
        gameType: isOfflineFriendMode ? "OFFLINE FRIEND" : "BOT"
      };

      console.log(`Saving match result (Type: ${resultData.gameType}, Opponent: ${resultData.opponentName}):`, resultData);

      fetch("http://localhost:8081/game/bot/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resultData),
        credentials: "include"
      })
        .then(res => res.json())
        .then(data => console.log("Game result saved successfully. Match ID:", data.matchId))
        .catch(err => {
          console.error("Error saving game result:", err);
          hasSaved.current = false;
        });
    }
  }, [isGameOver, isBotMode, isOfflineFriendMode, gameStatus, playerColor, initialGameData, user]);

  const getBoard = () => {
    const rawBoard = game.board();
    return rawBoard.map(row => row.map(sq => {
      if (!sq) return "";
      return sq.color === 'w' ? sq.type.toUpperCase() : sq.type;
    }));
  };

  return (
    <div className="game-page-layout">
      <div className="game-main-area">
        <BoardLayout
          board={getBoard()}
          onPieceDrop={onMove}
          isMyTurn={isMyTurn}
          playerColor={playerColor}
          lastMove={moveHistory[moveHistory.length - 1]}
          game={game}
          // Legacy
          addMove={() => { }}
          sendMove={() => { }}
          opponentMove={opponentMove}
          isConnected={isConnected}
          gameData={initialGameData}
          isBotMode={isBotMode}
          isOfflineFriendMode={isOfflineFriendMode}
          whiteTime={whiteTime}
          blackTime={blackTime}
        />

        <div className="game-controls-bar">
          <button className="btn-game-control" onClick={() => setActiveModal('draw')}>Offer Draw</button>
          <button className="btn-game-control danger" onClick={() => setActiveModal('resign')}>Resign</button>
        </div>
      </div>

      <div className="game-side-panel">
        <div className="game-status-card">
          <div className="game-status-header">
            <h3>Game Details</h3>
            <div className={`status-badge ${isMyTurn ? 'active' : (gameStatus === 'Check!' ? 'danger' : '')}`}>
              {gameStatus}
            </div>
          </div>
          <div className="game-info-row">
            <span>Opponent</span>
            <span className="game-info-value">{isBotMode ? "Stockfish 17 (Lite)" : "Human"}</span>
          </div>
          <div className="game-info-row">
            <span>Playing as</span>
            <span className="game-info-value">{playerColor}</span>
          </div>
        </div>

        <div className="moves-container-card">
          <div className="moves-header">
            <h4>Move History</h4>
          </div>
          <div className="moves-list">
            {(() => {
              const moves = [];
              for (let i = 0; i < moveHistory.length; i += 2) {
                moves.push(
                  <div key={i} className="move-pair">
                    <span className="move-number">{(i / 2) + 1}.</span>
                    <div className="move-white">{moveHistory[i].san}</div>
                    {moveHistory[i + 1] && <div className="move-black">{moveHistory[i + 1].san}</div>}
                  </div>
                );
              }
              if (moves.length === 0) return <div className="no-moves">Game has not started</div>;
              return moves;
            })()}
          </div>
        </div>
      </div>

      {/* Modals */}
      {isGameOver && (
        <GameOverModal
          status={gameStatus}
          onRestart={() => window.location.reload()}
          onHome={() => navigate('/home')}
        />
      )}

      {activeModal === 'resign' && (
        <ConfirmationModal
          title="Resign Game?"
          message="Are you sure you want to resign? You will lose this game."
          confirmText="Yes, Resign"
          onConfirm={handleResign}
          onCancel={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'draw' && (
        <ConfirmationModal
          title="Offer Draw?"
          message="Do you want to offer a draw to your opponent?"
          confirmText="Offer Draw"
          cancelText="Back"
          onConfirm={handleDrawResponse}
          onCancel={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'draw-incoming' && (
        <ConfirmationModal
          title="Draw Offered"
          message={`${incomingDrawOffer?.from} has offered a draw. Do you accept?`}
          confirmText="Accept"
          cancelText="Decline"
          onConfirm={handleAcceptDraw}
          onCancel={handleDeclineDraw}
        />
      )}
    </div>
  );
};

export default GameContainer;