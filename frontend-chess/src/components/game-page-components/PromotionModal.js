import React, { useState } from 'react';
import "../component-styles/PromotionModal.css";

const PromotionModal = ({ color, onClose, onSelect }) => {
  const getPieceImage = (type) => {
    const c = color || 'w';
    const piece = c === 'w' ? type.toUpperCase() : type.toLowerCase();
    const url = `https://upload.wikimedia.org/wikipedia/commons/${c === 'w' ?
      (type === 'q' ? '1/15/Chess_qlt45' : type === 'r' ? '7/72/Chess_rlt45' : type === 'n' ? '7/70/Chess_nlt45' : 'b/b1/Chess_blt45')
      :
      (type === 'q' ? '4/47/Chess_qdt45' : type === 'r' ? 'f/ff/Chess_rdt45' : type === 'n' ? 'e/ef/Chess_ndt45' : '9/98/Chess_bdt45')
      }.svg`;
    return <img src={url} alt={type} />;
  };

  const handleSelect = (piece) => {
    onSelect(piece);
    onClose();
  };

  return (
    <div className="promotion-modal-overlay">
      <div className="promotion-modal">
        <h3>Promote Your Pawn</h3>
        <p>Choose a piece to promote to:</p>
        <div className="promotion-options">
          <div className="promotion-option" onClick={() => handleSelect('q')}>
            <div className="piece-icon">{getPieceImage('q')}</div>
            <span>Queen</span>
          </div>
          <div className="promotion-option" onClick={() => handleSelect('r')}>
            <div className="piece-icon">{getPieceImage('r')}</div>
            <span>Rook</span>
          </div>
          <div className="promotion-option" onClick={() => handleSelect('b')}>
            <div className="piece-icon">{getPieceImage('b')}</div>
            <span>Bishop</span>
          </div>
          <div className="promotion-option" onClick={() => handleSelect('n')}>
            <div className="piece-icon">{getPieceImage('n')}</div>
            <span>Knight</span>
          </div>
        </div>
        <button className="close-modal-btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default PromotionModal;
