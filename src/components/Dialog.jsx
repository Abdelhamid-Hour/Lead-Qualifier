import React from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function Dialog({ isOpen, onClose, onCancel, title, message, onConfirm, confirmText, cancelText, type = 'confirm', extraActionText, onExtraAction }) {
  if (!isOpen) return null;

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <div className="dialog-title">
            {type === 'alert' && <AlertCircle className="dialog-icon text-danger" size={20} />}
            <h3>{title}</h3>
          </div>
          <button className="dialog-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        <div className="dialog-body">
          <p style={{ whiteSpace: 'pre-wrap' }}>{message}</p>
        </div>
        
        <div className="dialog-footer">
          {type === 'confirm' && (
            <button className="btn btn-secondary" onClick={handleCancel}>
              {cancelText || 'Cancel'}
            </button>
          )}
          {extraActionText && (
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                if (onExtraAction) onExtraAction();
                onClose();
              }}
              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }}
            >
              {extraActionText}
            </button>
          )}
          <button 
            className={`btn ${type === 'alert' ? 'btn-primary' : 'btn-primary'}`} 
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
          >
            {confirmText || 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}
