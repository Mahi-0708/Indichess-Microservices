import Header from "../components/Header";
import SideNav from "../components/SideNav";
import GameContainer from "../components/game-page-components/GameContainer";
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

const Game = ({ user }) => {
  const { matchId } = useParams();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const opponentFromUrl = searchParams.get("opponent");
  const selectedColor = searchParams.get("color") || "white";
  const gameTime = searchParams.get("time"); // In seconds

  const isBotMode = mode === "bot";
  const isOfflineFriendMode = mode === "offline";
  const isLocalMode = isBotMode || isOfflineFriendMode || !matchId;

  const [stompClient, setStompClient] = useState(null);
  const [isConnected, setIsConnected] = useState(isLocalMode);
  const [error, setError] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [playerColor, setPlayerColor] = useState(selectedColor);

  // Sync player names if user loads late
  useEffect(() => {
    if (gameData && isLocalMode && user && user.username) {
      const pUser = user;
      const pComp = { username: "Computer (Stockfish)" };
      const pFriend = { username: opponentFromUrl || "Friend" };

      const p1 = selectedColor === "white" ? pUser : (isBotMode ? pComp : pFriend);
      const p2 = selectedColor === "white" ? (isBotMode ? pComp : pFriend) : pUser;

      // Only update if actually different to avoid render loops
      if (gameData.player1.username !== p1.username || gameData.player2.username !== p2.username) {
        console.log("👤 Syncing user identity into game data:", pUser.username);
        setGameData(prev => ({
          ...prev,
          player1: p1,
          player2: p2,
        }));
      }
    }
  }, [user, gameData, isLocalMode, selectedColor, isBotMode, opponentFromUrl]);

  useEffect(() => {
    console.log("Game.js Context - User:", user?.username, "Mode:", mode, "Color:", selectedColor);

    if (isLocalMode) {
      if (gameData) return; // Don't re-initialize if already set

      // Initialize local game for bot or offline mode
      console.log(`🎮 Initializing Local Mode (Type: ${mode}, Player1: ${selectedColor})`);

      const pUser = user || { username: "Player" };
      const pComp = { username: "Computer (Stockfish)" };
      const pFriend = { username: opponentFromUrl || "Friend" };

      const initialGame = {
        matchId: isBotMode ? "bot-match" : "offline-match",
        status: (isBotMode && selectedColor === "black") ? "Computer is thinking..." : "Your turn!",
        player1: selectedColor === "white" ? pUser : (isBotMode ? pComp : pFriend),
        player2: selectedColor === "white" ? (isBotMode ? pComp : pFriend) : pUser,
        playerColor: selectedColor,
        isMyTurn: selectedColor === "white",
        fenCurrent: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        opponent: opponentFromUrl || "Friend",
        board: [
          ["r", "n", "b", "q", "k", "b", "n", "r"],
          ["p", "p", "p", "p", "p", "p", "p", "p"],
          ["", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", ""],
          ["", "", "", "", "", "", "", ""],
          ["P", "P", "P", "P", "P", "P", "P", "P"],
          ["R", "N", "B", "Q", "K", "B", "N", "R"]
        ]
      };
      setGameData(initialGame);
      setPlayerColor(selectedColor);
      setIsConnected(true);
      return;
    }

    if (!matchId) return;

    // Online game logic
    fetch(`http://localhost:8080/game/${matchId}`, {
      method: 'GET',
      credentials: 'include'
    })
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch game data');
        return response.json();
      })
      .then(data => {
        setPlayerColor(data.playerColor || "white");
        setGameData(data);
        console.log("Game data loaded:", data);
      })
      .catch(error => {
        console.error('Error fetching game details:', error);
        setError("Failed to load game details");
      });

    // WebSocket connection
    const socket = new SockJS('http://localhost:8080/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: (frame) => {
        console.log("Connected to WebSocket");
        setIsConnected(true);

        client.subscribe(`/topic/game/${matchId}`, (message) => {
          const update = JSON.parse(message.body);
          setGameData(prev => ({ ...prev, ...update }));
        });

        client.publish({
          destination: `/app/game/${matchId}/join`,
          body: JSON.stringify({ type: 'PLAYER_JOINED', playerColor })
        });
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame);
        setError("Connection error");
        setIsConnected(false);
      }
    });

    client.activate();
    setStompClient(client);

    return () => {
      if (client) client.deactivate();
    };
  }, [matchId, isBotMode, isLocalMode, mode, selectedColor, opponentFromUrl, user]);

  if (error) {
    return (
      <div className="app-container">
        <SideNav />
        <div className="main-container">
          <Header user={user} />
          <div className="error-container" style={{ padding: '40px', textAlign: 'center', color: 'white' }}>
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => window.location.href = '/home'} className="option-item primary">Return to Home</button>
          </div>
        </div>
      </div>
    );
  }

  if (!gameData) {
    return (
      <div className="app-container" style={{ background: '#000', color: 'white', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Initializing {isBotMode ? 'Bot' : 'Online'} Game...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <SideNav />
      <div className="main-container">
        <Header user={user} />
        <div style={{ background: '#1a1a1a', padding: '10px 24px', fontSize: '12px', color: '#666' }}>
          DEBUG: {isBotMode ? 'Bot Mode' : 'Online Mode'}
        </div>
        <GameContainer
          matchId={matchId || (isBotMode ? "bot-match" : "offline-match")}
          stompClient={stompClient}
          isConnected={isConnected}
          playerColor={playerColor}
          initialGameData={gameData}
          isBotMode={isBotMode}
          isOfflineFriendMode={isOfflineFriendMode}
          user={user}
          timeLimit={gameTime === 'stopwatch' ? 'stopwatch' : (gameTime ? parseInt(gameTime) : null)}
        />
      </div>
    </div>
  );
};

export default Game;