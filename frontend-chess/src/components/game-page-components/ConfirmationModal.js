import React from 'react';
import '../component-styles/BotSetupModal.css'; // Reuse existing modal styles

const ConfirmationModal = ({ title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel" }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ textAlign: 'center', padding: '30px', maxWidth: '400px' }}>
                <h2 style={{ color: '#fff', marginBottom: '15px' }}>{title}</h2>
                <p style={{ color: '#ccc', marginBottom: '30px', fontSize: '16px' }}>
                    {message}
                </p>

                <div className="modal-actions" style={{ justifyContent: 'center', gap: '15px' }}>
                    <button
                        className="btn-primary"
                        onClick={onCancel}
                        style={{ padding: '10px 20px', fontSize: '14px', backgroundColor: '#333' }}
                    >
                        {cancelText}
                    </button>
                    <button
                        className="btn-primary"
                        onClick={onConfirm}
                        style={{ padding: '10px 20px', fontSize: '14px', backgroundColor: '#d9534f' }} // Red for warning vibe
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
