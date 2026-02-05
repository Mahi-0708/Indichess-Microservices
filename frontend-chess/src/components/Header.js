import React, { useEffect } from "react";
import { FaUser, FaRegEnvelope, FaCog, FaSignOutAlt } from "react-icons/fa";
import "./component-styles/Header.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Header = ({ user, onUpdateSuccess, onOpenProfile }) => {
  const navigate = useNavigate();

  useEffect(() => {
    console.log("Header component mounted. User:", user?.username || "Guest");
  }, [user]);

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:8080/auth/logout",
        {},
        { withCredentials: true }
      );
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/");
    }
  };

  const username = user ? user.username : "Player";

  const handleToggleProfile = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOpenProfile) onOpenProfile();
  };

  return (
    <div className="header" style={{ position: "relative", zIndex: 9999 }}>
      <div className="left">
        <p>
          Hello,{" "}
          <span style={{ color: "var(--primary-green)" }}>
            {username}
          </span>
        </p>
      </div>

      <div className="right">
        <div
          onClick={handleToggleProfile}
          style={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            transition: "all 0.2s",
          }}
          title="Profile"
        >
          <FaUser size={20} />
        </div>
        <FaRegEnvelope size={20} title="Messages" style={{ cursor: "pointer" }} />
        <FaCog size={20} title="Settings" style={{ cursor: "pointer" }} />
        <FaSignOutAlt
          size={20}
          title="Logout"
          onClick={handleLogout}
          style={{ cursor: "pointer" }}
        />
      </div>
    </div>
  );
};

export default Header;
