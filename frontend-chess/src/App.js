import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import React, { useState, useEffect } from "react";
import axios from "axios";
import HomeCard from "./pages/HomeCard";
import HomePage from "./pages/Home";
import Game from "./pages/Game";
import './App.css';

// Layout component to maintain theme and user state
const Layout = ({ theme, user, toggleTheme, fetchUser }) => {
  return (
    <div className={theme === "light" ? "light-theme" : ""}>
      <Outlet context={{ theme, user, toggleTheme, fetchUser }} />
    </div>
  );
};

function App() {
  const [theme, setTheme] = useState("dark");
  const [user, setUser] = useState(null);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const fetchUser = async () => {
    console.log("🛠️ App: Starting fetchUser request...");
    try {
      const response = await axios.get("http://localhost:8080/auth/user", {
        withCredentials: true,
      });
      console.log("🛠️ App: fetchUser response status:", response.status);
      if (response.status === 200) {
        console.log("🛠️ App: fetchUser success, data:", response.data);
        setUser(response.data);
      } else {
        console.warn("🛠️ App: fetchUser non-200 status:", response.status);
        setUser(null);
      }
    } catch (error) {
      console.error("🛠️ App: fetchUser error:", error.response || error);
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const router = createBrowserRouter([
    {
      element: <Layout theme={theme} user={user} toggleTheme={toggleTheme} fetchUser={fetchUser} />,
      children: [
        {
          path: "/",
          element: <HomeCard onLoginSuccess={fetchUser} />,
        },
        {
          path: "/home",
          element: <HomePage user={user} toggleTheme={toggleTheme} theme={theme} onUpdateSuccess={fetchUser} />,
        },
        {
          path: "/game",
          element: <Game user={user} />,
        },
        {
          path: "/game/:matchId",
          element: <Game user={user} />,
        },
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
