import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function LoginCard({ handleToggleSignup, onLoginSuccess }) {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:8080/auth/login",
        { username, password },
        { withCredentials: true } // 🔥 REQUIRED
      );

      console.log("Login success:", response.data);

      // ✅ Check status properly
      if (response.status === 200) {
        if (onLoginSuccess) onLoginSuccess();
        navigate("/home");
      }
    } catch (err) {
      console.error("Login error:", err);

      if (err.response) {
        setError(
          typeof err.response.data === "string"
            ? err.response.data
            : err.response.data?.message || "Invalid username or password"
        );
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card">
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <div className="input-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <button
          type="submit"
          className="simple-auth-btn"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="oauth-buttons">
        <a href="http://localhost:8080/oauth2/authorization/google">
          <button className="btn-google">Login with Google</button>
        </a>
        <a href="http://localhost:8080/oauth2/authorization/github">
          <button className="btn-github">Login with GitHub</button>
        </a>
      </div>

      <div className="signup-link">
        Not an existing user?
        <button
          className="simple-auth-btn"
          onClick={handleToggleSignup}
          disabled={loading}
        >
          Sign up here
        </button>
      </div>
    </div>
  );
}

export default LoginCard;
