import React from 'react';
import '../component-styles/BotSetupModal.css'; // Reuse existing modal styles

const GameOverModal = ({ status, onRestart, onHome }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ textAlign: 'center', padding: '30px' }}>
                <h2 style={{ color: '#fff', marginBottom: '15px' }}>Game Over</h2>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#81b64c', marginBottom: '30px' }}>
                    {status}
                </div>

                <div className="modal-actions" style={{ justifyContent: 'center', gap: '15px' }}>
                    <button
                        className="btn-primary"
                        onClick={onRestart}
                        style={{ padding: '12px 24px', fontSize: '16px' }}
                    >
                        New Game
                    </button>
                    <button
                        className="btn-primary"
                        onClick={onHome}
                        style={{ padding: '12px 24px', fontSize: '16px', backgroundColor: '#333' }}
                    >
                        Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameOverModal;
