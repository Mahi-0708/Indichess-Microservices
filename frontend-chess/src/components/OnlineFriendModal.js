import React, { useState, useEffect, useRef } from "react";
import { FaTimes, FaChessPawn, FaCopy, FaCheck } from "react-icons/fa";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./component-styles/BotSetupModal.css";

const OnlineFriendModal = ({ onClose, user }) => {
    const [view, setView] = useState("choice"); // 'choice' | 'create' | 'join'
    const [roomCode, setRoomCode] = useState("");
    const [guestJoined, setGuestJoined] = useState(false);
    const [guestName, setGuestName] = useState("");
    const [copied, setCopied] = useState(false);
    const [joinCode, setJoinCode] = useState("");
    const [error, setError] = useState("");
    const [isTimed, setIsTimed] = useState(false);
    const [timeMinutes, setTimeMinutes] = useState(10);
    const navigate = useNavigate();
    const pollingRef = useRef(null);

    useEffect(() => {
        console.log("🛠️ OnlineFriendModal: Received user prop:", user);
        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [user]);

    const handleCreateRoom = async () => {
        try {
            setError("");
            const timeLimitSeconds = isTimed ? timeMinutes * 60 : null;
            const response = await axios.post("http://localhost:8080/game/online/create", {
                timeLimit: timeLimitSeconds
            }, { withCredentials: true });
            setRoomCode(response.data.roomCode);
            setView("create");
            startPolling(response.data.roomCode, "host");
        } catch (err) {
            console.error("Create Room Error:", err);
            let msg = "Failed to create room";
            if (!err.response) {
                msg = "Connection error: Backend not reachable";
            } else if (err.response.status === 401) {
                msg = "Please login to create a room";
            } else if (typeof err.response.data === 'string') {
                msg = err.response.data;
            } else if (err.response.data?.message) {
                msg = err.response.data.message;
            } else {
                msg = `Error: ${err.response.status} ${err.response.statusText}`;
            }
            setError(msg);
        }
    };

    const handleJoinRoom = async () => {
        if (!joinCode.trim()) {
            setError("Please enter a code");
            return;
        }
        try {
            setError("");
            const response = await axios.post("http://localhost:8080/game/online/join", { code: joinCode.trim() }, { withCredentials: true });
            setRoomCode(joinCode.trim());
            setView("join");
            startPolling(joinCode.trim(), "guest");
        } catch (err) {
            let msg = "Unable to join room. Check code.";
            if (err.response?.status === 401) {
                msg = "Please login to join a room";
            } else if (typeof err.response?.data === 'string') {
                msg = err.response.data;
            } else if (err.response?.data?.message) {
                msg = err.response.data.message;
            }
            setError(msg);
        }
    };

    const startPolling = (code, role) => {
        if (pollingRef.current) clearInterval(pollingRef.current);

        pollingRef.current = setInterval(async () => {
            try {
                const res = await axios.get(`http://localhost:8080/game/online/status/${code}`, { withCredentials: true });
                const data = res.data;

                if (role === "host") {
                    if (data.guest) {
                        setGuestJoined(true);
                        setGuestName(data.guest.username);
                    }
                } else if (role === "guest") {
                    if (data.match) {
                        clearInterval(pollingRef.current);
                        navigate(`/game/${data.match.id}`);
                    }
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 2000);
    };

    const handleStartMatch = async (color) => {
        try {
            const response = await axios.post("http://localhost:8080/game/online/setup", {
                code: roomCode,
                color: color
            }, { withCredentials: true });

            if (response.data.matchId) {
                navigate(`/game/${response.data.matchId}`);
            }
        } catch (err) {
            setError("Failed to start match");
        }
    };

    const copyCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="modal-overlay">
            <div className="bot-setup-modal" style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <h3>Online Friend Match</h3>
                    <button className="close-btn" onClick={onClose}><FaTimes /></button>
                </div>

                <div className="modal-body" style={{ padding: '24px' }}>
                    {view === "choice" && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <button className="option-item primary" onClick={handleCreateRoom} style={{ padding: '20px' }}>
                                <div style={{ marginBottom: '8px', fontSize: '18px', fontWeight: 'bold' }}>Create a Room</div>
                                <div style={{ fontSize: '13px', opacity: 0.8 }}>Get a code to share with your friend</div>
                            </button>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
                                <div style={{ height: '1px', flex: 1, backgroundColor: '#333' }}></div>
                                <span style={{ color: '#666', fontSize: '12px' }}>OR</span>
                                <div style={{ height: '1px', flex: 1, backgroundColor: '#333' }}></div>
                            </div>

                            <div className="time-setup-section" style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', color: '#666', marginBottom: '10px', fontSize: '13px' }}>
                                    Time Control for Match
                                </label>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                                    <button
                                        onClick={() => setIsTimed(false)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            backgroundColor: !isTimed ? '#81b64c' : '#1a1a1a',
                                            color: !isTimed ? 'white' : '#bababa',
                                            border: '1px solid ' + (!isTimed ? '#81b64c' : '#333'),
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            transition: 'all 0.2s',
                                            outline: 'none',
                                            fontSize: '13px'
                                        }}
                                    >
                                        Free Time
                                    </button>
                                    <button
                                        onClick={() => setIsTimed(true)}
                                        style={{
                                            flex: 1,
                                            padding: '8px',
                                            backgroundColor: isTimed ? '#81b64c' : '#1a1a1a',
                                            color: isTimed ? 'white' : '#bababa',
                                            border: '1px solid ' + (isTimed ? '#81b64c' : '#333'),
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            transition: 'all 0.2s',
                                            outline: 'none',
                                            fontSize: '13px'
                                        }}
                                    >
                                        Timed Match
                                    </button>
                                </div>

                                {isTimed && (
                                    <div className="custom-time-input">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#111', padding: '10px', borderRadius: '8px', border: '1px solid #333' }}>
                                            <span style={{ color: '#888', fontSize: '13px' }}>Minutes per side:</span>
                                            <input
                                                type="number"
                                                min="1"
                                                max="180"
                                                value={timeMinutes}
                                                onChange={(e) => setTimeMinutes(parseInt(e.target.value) || 0)}
                                                style={{
                                                    width: '55px',
                                                    backgroundColor: '#000',
                                                    border: '1px solid #444',
                                                    color: '#81b64c',
                                                    padding: '3px 6px',
                                                    borderRadius: '4px',
                                                    fontWeight: 'bold',
                                                    fontSize: '15px',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '8px 0' }}>
                                <div style={{ height: '1px', flex: 1, backgroundColor: '#333' }}></div>
                                <span style={{ color: '#666', fontSize: '12px' }}>THEN</span>
                                <div style={{ height: '1px', flex: 1, backgroundColor: '#333' }}></div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ color: '#bababa', fontSize: '14px' }}>Enter Room Code</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="text"
                                        placeholder="E.g. AX79ZB"
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            backgroundColor: '#1a1a1a',
                                            border: '1px solid #333',
                                            borderRadius: '8px',
                                            color: 'white',
                                            textTransform: 'uppercase'
                                        }}
                                    />
                                    <button className="option-item" onClick={handleJoinRoom} style={{ padding: '0 24px', margin: 0, height: 'auto' }}>
                                        Join
                                    </button>
                                </div>
                                {error && <div style={{ color: '#ff4444', fontSize: '13px', marginTop: '4px' }}>{error}</div>}
                            </div>
                        </div>
                    )}

                    {view === "create" && (
                        <div style={{ textAlign: 'center' }}>
                            {!guestJoined ? (
                                <>
                                    <div style={{ color: '#666', marginBottom: '16px' }}>Share this code with your friend</div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '12px',
                                        backgroundColor: '#111',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: '2px dashed #444',
                                        marginBottom: '24px'
                                    }}>
                                        <span style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '4px', color: '#81b64c' }}>{roomCode}</span>
                                        <button onClick={copyCode} style={{ background: 'none', border: 'none', color: '#81b64c', cursor: 'pointer', padding: '8px' }}>
                                            {copied ? <FaCheck /> : <FaCopy size={20} />}
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#888' }}>
                                        <div className="spinner-small" style={{ width: '16px', height: '16px', border: '2px solid #333', borderTopColor: '#81b64c', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                                        <span>Waiting for friend to join...</span>
                                    </div>
                                    <div style={{ marginTop: '12px', fontSize: '13px', color: '#666' }}>
                                        Time Control: {isTimed ? `${timeMinutes} min` : "Free Time"}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ marginBottom: '24px' }}>
                                        <div style={{ color: '#81b64c', fontWeight: 'bold', fontSize: '18px', marginBottom: '4px' }}>Friend Joined!</div>
                                        <div style={{ color: '#bababa' }}>{guestName} is ready to play.</div>
                                    </div>

                                    <p style={{ color: '#888', marginBottom: '16px' }}>Choose Your Side</p>

                                    <div className="color-options">
                                        <div className="color-option white" onClick={() => handleStartMatch('white')}>
                                            <div className="pawn-preview">
                                                <FaChessPawn size={50} color="#fff" />
                                            </div>
                                            <span>Play as White</span>
                                        </div>

                                        <div className="color-option black" onClick={() => handleStartMatch('black')}>
                                            <div className="pawn-preview">
                                                <FaChessPawn size={50} color="#444" />
                                            </div>
                                            <span>Play as Black</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {view === "join" && (
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ color: '#81b64c', fontWeight: 'bold', fontSize: '18px', marginBottom: '8px' }}>Joined Room {roomCode}</div>
                                <div style={{ color: '#bababa' }}>Waiting for host to choose colors and start the game...</div>
                            </div>
                            <div className="spinner-large" style={{
                                width: '40px',
                                height: '40px',
                                margin: '0 auto',
                                border: '4px solid #333',
                                borderTopColor: '#81b64c',
                                borderRadius: '50%',
                                animation: 'spin 1.2s linear infinite'
                            }}></div>
                        </div>
                    )}
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                        @keyframes spin { to { transform: rotate(360deg); } }
                        .option-item.primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(129, 182, 76, 0.2); }
                    ` }} />
            </div>
        </div>
    );
};

export default OnlineFriendModal;
