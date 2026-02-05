import React from "react";
import { FaUser, FaRobot } from "react-icons/fa";
import "../component-styles/Player.css";

const Player = ({ player, isOpponent, isBot, color, isActive, timeLeft }) => {
  const username = player?.username || player?.user_name || (isOpponent ? (isBot ? "Computer" : "Opponent") : "Player");
  const rating = player?.elo || player?.rating || "---";

  if (!player && !isBot) {
    console.warn(`⚠️ Player component: 'player' prop is null for ${isOpponent ? 'Opponent' : 'Self'}`);
  }

  return (
    <div className={`player ${isOpponent ? 'opponent' : 'self'} ${isActive ? 'active-turn' : ''}`}
      style={{
        border: isActive ? '2px solid #81b64c' : '2px solid transparent',
        borderRadius: '8px',
        transition: 'all 0.3s ease',
        backgroundColor: isActive ? 'rgba(129, 182, 76, 0.1)' : 'transparent'
      }}>
      <div className="player-info" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0' }}>
        <div className="player-avatar" style={{
          width: 40,
          height: 40,
          backgroundColor: '#262626',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isOpponent ? '#81b64c' : '#bababa'
        }}>
          {isBot ? <FaRobot size={24} /> : <FaUser size={20} />}
        </div>
        <div className="player-details">
          <div className="player-name" style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>
            {username}
          </div>
          <div className="player-rating" style={{ color: '#666', fontSize: '12px' }}>
            Rating: {rating}
          </div>
          <div style={{ marginTop: '4px' }}>
            <span style={{
              backgroundColor: color === 'white' ? '#fff' : '#333',
              color: color === 'white' ? '#000' : '#fff',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              border: color === 'white' ? 'none' : '1px solid #555',
              display: 'inline-block'
            }}>
              {color}
            </span>
          </div>
        </div>

        {timeLeft !== null && timeLeft !== undefined && (
          <div className={`player-timer ${isActive ? 'timer-active' : ''}`} style={{
            marginLeft: 'auto',
            padding: '8px 16px',
            backgroundColor: isActive ? '#fff' : '#262626',
            color: isActive ? '#000' : '#888',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '18px',
            fontFamily: 'monospace',
            minWidth: '70px',
            textAlign: 'center',
            boxShadow: isActive ? '0 0 10px rgba(255,255,255,0.2)' : 'none',
            transition: 'all 0.3s ease'
          }}>
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>

    </div>
  );
};

export default Player;
