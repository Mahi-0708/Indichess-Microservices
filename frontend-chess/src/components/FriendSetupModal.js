import React, { useState } from "react";
import { FaTimes, FaChessPawn, FaUser } from "react-icons/fa";
import "./component-styles/BotSetupModal.css"; // Reusing styles

const FriendSetupModal = ({ onClose, onSelect }) => {
    const [opponentName, setOpponentName] = useState("");
    const [isTimed, setIsTimed] = useState(false);
    const [timeMinutes, setTimeMinutes] = useState(10);

    const handleSelect = (color) => {
        if (!opponentName.trim()) {
            alert("Please enter Player 2's name.");
            return;
        }
        const timeLimitForGame = isTimed ? timeMinutes * 60 : null;
        onSelect(color, opponentName.trim(), timeLimitForGame);
    };

    return (
        <div className="modal-overlay">
            <div className="bot-setup-modal">
                <div className="modal-header">
                    <h3>Play with a Friend (Offline)</h3>
                    <button className="close-btn" onClick={onClose}><FaTimes /></button>
                </div>

                <div className="modal-body" style={{ padding: '20px' }}>
                    <div className="input-group" style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', color: '#666', marginBottom: '8px', fontSize: '14px' }}>
                            Player 2 Name
                        </label>
                        <div style={{ position: 'relative' }}>
                            <FaUser style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                            <input
                                type="text"
                                placeholder="Enter friend's name"
                                value={opponentName}
                                onChange={(e) => setOpponentName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 12px 12px 40px',
                                    backgroundColor: '#1a1a1a',
                                    border: '1px solid #333',
                                    borderRadius: '8px',
                                    color: 'white',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    <div className="time-setup-section" style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', color: '#666', marginBottom: '12px', fontSize: '14px' }}>
                            Time Control
                        </label>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                            <button
                                onClick={() => setIsTimed(false)}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: !isTimed ? '#81b64c' : '#1a1a1a',
                                    color: !isTimed ? 'white' : '#bababa',
                                    border: '1px solid ' + (!isTimed ? '#81b64c' : '#333'),
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                            >
                                Free Time
                            </button>
                            <button
                                onClick={() => setIsTimed(true)}
                                style={{
                                    flex: 1,
                                    padding: '10px',
                                    backgroundColor: isTimed ? '#81b64c' : '#1a1a1a',
                                    color: isTimed ? 'white' : '#bababa',
                                    border: '1px solid ' + (isTimed ? '#81b64c' : '#333'),
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                            >
                                Timed Match
                            </button>
                        </div>

                        {isTimed && (
                            <div className="custom-time-input">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#222', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                                    <span style={{ color: '#888', fontSize: '14px' }}>Minutes per side:</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="180"
                                        value={timeMinutes}
                                        onChange={(e) => setTimeMinutes(parseInt(e.target.value) || 0)}
                                        style={{
                                            width: '60px',
                                            backgroundColor: '#111',
                                            border: '1px solid #444',
                                            color: '#81b64c',
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontWeight: 'bold',
                                            fontSize: '16px',
                                            outline: 'none'
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <p style={{ color: '#888', marginBottom: '16px', textAlign: 'center' }}>Choose Player 1's Side</p>

                    <div className="color-options">
                        <div className="color-option white" onClick={() => handleSelect('white')}>
                            <div className="pawn-preview">
                                <FaChessPawn size={60} color="#fff" />
                            </div>
                            <span>Play as White</span>
                        </div>

                        <div className="color-option black" onClick={() => handleSelect('black')}>
                            <div className="pawn-preview">
                                <FaChessPawn size={60} color="#444" />
                            </div>
                            <span>Play as Black</span>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <p>Players will take turns on the same device.</p>
                </div>
            </div>
        </div>
    );
};

export default FriendSetupModal;
