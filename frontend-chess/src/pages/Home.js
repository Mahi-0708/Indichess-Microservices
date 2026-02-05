import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SideNav from "../components/SideNav";
import Header from "../components/Header";
import GameInfo from "../components/game-page-components/GameInfo";
import ProfileModal from "../components/ProfileModal";
import BotSetupModal from "../components/BotSetupModal";
import FriendSetupModal from "../components/FriendSetupModal";
import OnlineFriendModal from "../components/OnlineFriendModal";
import {
  FaGamepad, FaTrophy, FaTimes,
  FaHeart, FaChartBar, FaRobot, FaBolt, FaClock
} from "react-icons/fa";

function HomePage({ user, theme, toggleTheme, onUpdateSuccess }) {
  const [showProfile, setShowProfile] = useState(false);
  const [showNewGameDropdown, setShowNewGameDropdown] = useState(false);
  const [showPlayFriendDropdown, setShowPlayFriendDropdown] = useState(false);
  const [showBotSetup, setShowBotSetup] = useState(false);
  const [showFriendSetup, setShowFriendSetup] = useState(false);
  const [showOnlineFriendModal, setShowOnlineFriendModal] = useState(false);
  const [selectedTimeLimit, setSelectedTimeLimit] = useState(null);
  const navigate = useNavigate();

  const handleOpenProfile = () => {
    setShowProfile(true);
  };

  const handleNewGameClick = () => {
    setShowNewGameDropdown(!showNewGameDropdown);
  };

  const handlePlayMode = (mode) => {
    console.log(`Starting ${mode} game...`);
    if (mode === 'rapid') {
      setSelectedTimeLimit(600); // 10 minutes
      setShowBotSetup(true);
    } else if (mode === 'blitz') {
      setSelectedTimeLimit(300); // 5 minutes
      setShowBotSetup(true);
    } else if (mode === 'stopwatch') {
      setSelectedTimeLimit('stopwatch');
      setShowBotSetup(true);
    } else {
      // Default behavior if any other mode added
      navigate("/game");
    }
    setShowNewGameDropdown(false);
  };

  const handlePlayFriendClick = () => {
    setShowPlayFriendDropdown(!showPlayFriendDropdown);
  };

  const handlePlayFriendMode = (mode) => {
    console.log(`Starting ${mode} friend game...`);
    if (mode === 'offline') {
      setShowFriendSetup(true);
    } else if (mode === 'online') {
      setShowOnlineFriendModal(true);
    }
    setShowPlayFriendDropdown(false);
  };

  const handleFriendStart = (color, opponentName, timeLimit) => {
    setShowFriendSetup(false);
    const timeParam = timeLimit ? `&time=${timeLimit}` : "";
    navigate(`/game?mode=offline&color=${color}&opponent=${encodeURIComponent(opponentName)}${timeParam}`);
  };

  const handlePlayBotClick = () => {
    setShowBotSetup(true);
  };

  const handleBotStart = (color) => {
    setShowBotSetup(false);
    const timeParam = selectedTimeLimit ? `&time=${selectedTimeLimit}` : "";
    navigate(`/game?mode=bot&color=${color}${timeParam}`);
    // Reset time limit after navigation
    setSelectedTimeLimit(null);
  };

  const statCards = [
    // ... existing statCards ...
    { icon: <div style={{ width: 40, height: 40, backgroundColor: '#1a1a1a', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaGamepad /></div>, label: "GAMES PLAYED", value: user?.gamesPlayed || "222" },
    { icon: <div style={{ width: 40, height: 40, backgroundColor: '#1a1a1a', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaTrophy /></div>, label: "WIN RATE", value: user?.winRate || "54%" },
    { icon: <div style={{ width: 40, height: 40, backgroundColor: '#1a1a1a', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaChartBar /></div>, label: "ELO RATING", value: user?.elo || "250" },
  ];

  const recentGames = [
    { opponent: "GrandMaster_X", result: "+12", time: "2 hours ago", win: true },
  ];

  return (
    <div className="app-container">
      <SideNav theme={theme} toggleTheme={toggleTheme} onOpenProfile={handleOpenProfile} />

      <div className="main-container">
        <Header user={user} onOpenProfile={handleOpenProfile} />

        <div className="dashboard-content">
          <div className="dashboard-main-area">
            {/* Hero Section */}
            <div className="hero-section">
              <h1>Ready to Play?</h1>
              <p>Join thousands of players online and improve your chess skills today.</p>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'flex', gap: '24px', marginBottom: '32px' }}>
              {statCards.map((stat, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-icon">{stat.icon}</div>
                  <div>
                    <div className="stat-label">{stat.label}</div>
                    <div className="stat-value">{stat.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Games */}
            <div className="recent-games-container">
              <div className="recent-games-header">Recent Games</div>
              <div className="recent-games-list">
                {recentGames.map((game, i) => (
                  <div key={i} className="recent-game-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: 32, height: 32, backgroundColor: '#81b64c', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>W</div>
                      <div>
                        <div style={{ color: 'white', fontWeight: 'bold' }}>vs {game.opponent}</div>
                        <div style={{ color: '#666', fontSize: '12px' }}>{game.time}</div>
                      </div>
                    </div>
                    <div className="game-result-win">{game.result}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="options-sidebar">
            <div className="option-item" style={{ backgroundColor: '#121212', cursor: 'default' }}>
              <div style={{ color: '#f57c00', fontSize: '24px' }}><FaBolt /></div>
              <div>
                <div style={{ fontSize: '12px', color: '#666' }}>Streak</div>
                <div style={{ fontWeight: 'bold', color: 'white' }}>{user?.streak || 1} {user?.streak === 1 ? 'Day' : 'Days'}</div>
              </div>
            </div>

            <div className="option-item" onClick={() => handlePlayMode('stopwatch')}>
              <FaClock />
              <span>Play 1 | 1</span>
            </div>

            <div className="dropdown-container">
              <button className="option-item primary" onClick={handleNewGameClick}>
                <FaGamepad style={{ marginRight: '8px' }} />
                New Game
              </button>

              {showNewGameDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={() => handlePlayMode('rapid')}>
                    <FaClock size={16} />
                    <span>Rapid (10 min)</span>
                  </div>
                  <div className="dropdown-item" onClick={() => handlePlayMode('blitz')}>
                    <FaBolt size={16} />
                    <span>Blitz (5 min)</span>
                  </div>
                </div>
              )}
            </div>

            <div className="option-item" onClick={handlePlayBotClick}>
              <FaRobot />
              <span>Play Bots</span>
            </div>

            <div className="dropdown-container">
              <div className="option-item" onClick={handlePlayFriendClick}>
                <FaGamepad />
                <span>Play a Friend</span>
              </div>

              {showPlayFriendDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={() => handlePlayFriendMode('online')}>
                    <FaGamepad size={16} />
                    <span>Online Friend</span>
                  </div>
                  <div className="dropdown-item" onClick={() => handlePlayFriendMode('offline')}>
                    <FaRobot size={16} />
                    <span>Offline Friend</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showBotSetup && (
        <BotSetupModal
          onClose={() => setShowBotSetup(false)}
          onSelect={handleBotStart}
        />
      )}

      {showFriendSetup && (
        <FriendSetupModal
          onClose={() => setShowFriendSetup(false)}
          onSelect={handleFriendStart}
        />
      )}

      {showOnlineFriendModal && (
        <OnlineFriendModal
          user={user}
          onClose={() => setShowOnlineFriendModal(false)}
        />
      )}

      {showProfile && user && (
        <ProfileModal
          key={user.username}
          user={user}
          onClose={() => setShowProfile(false)}
          onUpdateSuccess={onUpdateSuccess}
        />
      )}
    </div>
  );
}

export default HomePage;
