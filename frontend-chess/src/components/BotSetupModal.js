import React from "react";
import { FaTimes, FaChessPawn } from "react-icons/fa";
import "./component-styles/BotSetupModal.css";

const BotSetupModal = ({ onClose, onSelect }) => {
    return (
        <div className="modal-overlay">
            <div className="bot-setup-modal">
                <div className="modal-header">
                    <h3>Choose Your Side</h3>
                    <button className="close-btn" onClick={onClose}><FaTimes /></button>
                </div>

                <div className="color-options">
                    <div className="color-option white" onClick={() => onSelect('white')}>
                        <div className="pawn-preview">
                            <FaChessPawn size={60} color="#fff" />
                        </div>
                        <span>Play as White</span>
                    </div>

                    <div className="color-option black" onClick={() => onSelect('black')}>
                        <div className="pawn-preview">
                            <FaChessPawn size={60} color="#444" />
                        </div>
                        <span>Play as Black</span>
                    </div>
                </div>

                <div className="modal-footer">
                    <p>The computer will play as the opposite color.</p>
                </div>
            </div>
        </div>
    );
};

export default BotSetupModal;
