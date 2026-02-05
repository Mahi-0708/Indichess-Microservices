import React, { useState } from "react";
import ReactDOM from "react-dom";
import {
    FaUserCircle, FaTrophy, FaEnvelope, FaTimes,
    FaChessKing, FaBolt, FaStopwatch, FaSave, FaEdit,
    FaGamepad, FaHeart, FaChartBar
} from "react-icons/fa";
import axios from "axios";

const ProfileModal = ({ user, onClose, onUpdateSuccess }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedUsername, setEditedUsername] = useState(user?.username || "");
    const [editedEmail, setEditedEmail] = useState(user?.emailId || "");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setError("");
        setLoading(true);
        try {
            const response = await axios.put("http://localhost:8080/auth/update", {
                username: editedUsername,
                emailId: editedEmail
            }, { withCredentials: true });

            if (response.status === 200) {
                setIsEditing(false);
                if (onUpdateSuccess) onUpdateSuccess();
            }
        } catch (err) {
            setError(err.response?.data || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    const initial = user?.username ? user.username.charAt(0).toUpperCase() : "?";

    const statCards = [
        { icon: <FaGamepad color="#8a56ff" size={24} />, label: "Games Played", value: user?.gamesPlayed || "0" },
        { icon: <FaTrophy color="#ffce31" size={24} />, label: "Wins", value: user?.wins || "0" },
        { icon: <FaTimes color="#ff5f5f" size={24} />, label: "Losses", value: user?.losses || "0" },
        { icon: <FaHeart color="#ffce31" size={24} />, label: "Draws", value: user?.draws || "0" },
        { icon: <FaChartBar color="#4da6ff" size={24} />, label: "Win Rate", value: user?.winRate || "0%" },
    ];

    const modalContent = (
        <div className="profile-overlay" style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.95)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999999,
            backdropFilter: "blur(5px)",
        }} onClick={onClose}>
            <div className="profile-container" style={{
                backgroundColor: "#000000",
                borderRadius: "12px",
                width: "90%",
                maxWidth: "800px",
                maxHeight: "90vh",
                position: "relative",
                boxShadow: "0 0 40px rgba(129, 182, 76, 0.2)",
                border: "1px solid #1a1a1a",
                color: "#ffffff",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                padding: "32px",
                animation: "modalFadeIn 0.3s ease-out"
            }} onClick={(e) => e.stopPropagation()}>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: "20px",
                        right: "20px",
                        background: "none",
                        border: "none",
                        color: "#bababa",
                        cursor: "pointer",
                        fontSize: "24px",
                    }}
                >
                    <FaTimes />
                </button>

                {!user ? (
                    <div style={{ textAlign: "center", padding: "60px 40px" }}>
                        <FaUserCircle size={100} color="#3d3b38" style={{ marginBottom: "24px" }} />
                        <h2 style={{ color: "#ffffff", marginBottom: "16px", fontSize: "28px" }}>Profile Unavailable</h2>
                        <p style={{ color: "#bababa", fontSize: "16px", maxWidth: "400px", margin: "0 auto", lineHeight: "1.6" }}>
                            We couldn't fetch your profile data.
                        </p>
                        <button
                            onClick={onClose}
                            style={{
                                marginTop: "32px",
                                backgroundColor: "#81b64c",
                                color: "white",
                                border: "none",
                                padding: "12px 40px",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "800",
                                fontSize: "16px",
                            }}
                        >
                            CLOSE
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Profile Header Card */}
                        <div style={{
                            border: "2px solid #2d5a27",
                            borderRadius: "16px",
                            padding: "32px",
                            backgroundColor: "#121212",
                            display: "flex",
                            alignItems: "center",
                            gap: "24px",
                            marginBottom: "40px"
                        }}>
                            <div style={{
                                width: "120px",
                                height: "120px",
                                borderRadius: "50%",
                                backgroundColor: "#81b64c",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                fontSize: "60px",
                                fontWeight: "bold",
                                color: "black",
                                position: "relative"
                            }}>
                                {initial}
                                <div style={{
                                    position: "absolute",
                                    bottom: "5px",
                                    right: "5px",
                                    width: "24px",
                                    height: "24px",
                                    backgroundColor: "#81b64c",
                                    border: "4px solid #121212",
                                    borderRadius: "50%"
                                }}></div>
                            </div>

                            <div style={{ flex: 1 }}>
                                {isEditing ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <input
                                            value={editedUsername}
                                            onChange={(e) => setEditedUsername(e.target.value)}
                                            style={{
                                                backgroundColor: "#000",
                                                border: "1px solid #81b64c",
                                                color: "#81b64c",
                                                fontSize: "28px",
                                                fontWeight: "bold",
                                                padding: "4px 8px",
                                                borderRadius: "4px"
                                            }}
                                        />
                                        <input
                                            value={editedEmail}
                                            onChange={(e) => setEditedEmail(e.target.value)}
                                            style={{
                                                backgroundColor: "#000",
                                                border: "1px solid #333",
                                                color: "#bababa",
                                                fontSize: "16px",
                                                padding: "4px 8px",
                                                borderRadius: "4px"
                                            }}
                                        />
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                            <button onClick={handleSave} style={{ backgroundColor: '#81b64c', border: 'none', color: 'black', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
                                            <button onClick={() => setIsEditing(false)} style={{ backgroundColor: 'transparent', border: '1px solid #333', color: 'white', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h1 style={{ margin: 0, color: "#81b64c", fontSize: "42px", fontWeight: "bold" }}>{user.username}</h1>
                                        <p style={{ margin: "4px 0 0", color: "#666", fontSize: "18px" }}>{user.emailId}</p>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            style={{ background: 'none', border: 'none', color: '#81b64c', cursor: 'pointer', padding: 0, marginTop: '8px', fontSize: '14px' }}
                                        >
                                            <FaEdit /> Edit Profile
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Statistics Section */}
                        <div>
                            <h2 style={{ color: "#81b64c", fontSize: "28px", marginBottom: "24px", fontWeight: "normal" }}>Statistics</h2>

                            <div style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                                gap: "20px"
                            }}>
                                {statCards.map((stat, index) => (
                                    <div key={index} style={{
                                        backgroundColor: "#121212",
                                        borderRadius: "12px",
                                        padding: "32px 24px",
                                        textAlign: "center",
                                        border: "1px solid #1a1a1a",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        gap: "16px",
                                        transition: "all 0.2s"
                                    }} onMouseOver={(e) => e.currentTarget.style.borderColor = "#2d5a27"}
                                        onMouseOut={(e) => e.currentTarget.style.borderColor = "#1a1a1a"}>
                                        <div style={{ marginBottom: "8px" }}>{stat.icon}</div>
                                        <div style={{ color: "#81b64c", fontSize: "44px", fontWeight: "bold" }}>{stat.value}</div>
                                        <div style={{ color: "#bababa", fontSize: "16px" }}>{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {error && <div style={{ color: '#ff5f5f', marginTop: '20px', textAlign: 'center' }}>{error}</div>}
            </div>
            <style>{`
                @keyframes modalFadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default ProfileModal;
