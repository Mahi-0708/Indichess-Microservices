import React from 'react';
import "./component-styles/SideNav.css";
import {
  FaCrown, FaPlay, FaTrophy, FaBook,
  FaHistory, FaUser, FaSun, FaMoon, FaCog,
  FaQuestionCircle, FaSignOutAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const SideNav = ({ theme, toggleTheme, onOpenProfile }) => {
  const navigate = useNavigate();
  return (
    <div className={`side-nav ${theme === "light" ? 'light-mode' : ''}`}>
      <div className="logo-section" onClick={() => navigate("/home")}>
        <h2 className="logo-text">IndiChess</h2>
        <FaCrown className="logo-icon" size={32} />
      </div>

      <div className="menu-group">
        <button className="menu-item active" onClick={() => navigate("/home")}>
          <FaPlay size={18} />
          <span>Play</span>
        </button>
        <button className="menu-item" onClick={() => alert("Puzzles feature is coming soon!")}>
          <FaCrown size={18} />
          <span>Puzzles</span>
        </button>
        <button className="menu-item" onClick={() => alert("Learning modules are coming soon!")}>
          <FaBook size={18} />
          <span>Learn</span>
        </button>
      </div>

      <div className="menu-group bottom">
        <button className="menu-item" onClick={toggleTheme}>
          <FaSun size={18} />
          <span>Light UI</span>
        </button>
        <button className="menu-item">
          <FaCog size={18} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};

export default SideNav;
