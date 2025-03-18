import React, { useState, useEffect } from 'react';

interface PressureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (pressure: number) => void;
  currentPressure: number;
}

/**
 * Dialog component for updating reservoir pressure
 */
const PressureDialog: React.FC<PressureDialogProps> = ({
  isOpen,
  onClose,
  onUpdate,
  currentPressure
}) => {
  const [pressure, setPressure] = useState<string>(currentPressure.toString());
  const [error, setError] = useState<string | null>(null);

  // Update local state when current pressure changes
  useEffect(() => {
    setPressure(currentPressure.toString());
    setError(null);
  }, [currentPressure, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPressure = parseFloat(pressure);
    
    if (isNaN(newPressure)) {
      setError('Please enter a valid number');
      return;
    }
    
    if (newPressure < 0) {
      setError('Pressure cannot be negative');
      return;
    }
    
    if (newPressure > 200) {
      setError('Maximum pressure is 200 bar');
      return;
    }
    
    onUpdate(newPressure);
    onClose();
  };

  const handleCancel = () => {
    setPressure(currentPressure.toString());
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h3>Update Reservoir Pressure</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="pressure">Pressure (bar):</label>
            <input
              type="number"
              id="pressure"
              value={pressure}
              onChange={(e) => {
                setPressure(e.target.value);
                setError(null);
              }}
              min="0"
              max="200"
              step="1"
              required
              autoFocus
            />
            {error && <div className="error-message">{error}</div>}
          </div>
          <div className="form-info">
            <p>Reservoir pressure affects the overall flow in the network. Higher pressure creates stronger flows.</p>
            <ul>
              <li>Low pressure (1-20 bar): Minimal flow</li>
              <li>Medium pressure (20-100 bar): Normal operation</li>
              <li>High pressure (100-200 bar): Maximum flow rates</li>
            </ul>
          </div>
          <div className="dialog-buttons">
            <button type="button" onClick={handleCancel}>Cancel</button>
            <button type="submit">Update</button>
          </div>
        </form>
      </div>
      <style>{`
        .dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .dialog-content {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          min-width: 350px;
          max-width: 90%;
        }

        .dialog-content h3 {
          margin-top: 0;
          color: #2C3E50;
          border-bottom: 1px solid #EEE;
          padding-bottom: 10px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          color: #34495E;
        }

        .form-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }

        .error-message {
          color: #E74C3C;
          font-size: 14px;
          margin-top: 5px;
        }

        .form-info {
          background-color: #F8F9FA;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
          font-size: 14px;
          color: #7F8C8D;
        }

        .form-info p {
          margin-top: 0;
          margin-bottom: 8px;
        }

        .form-info ul {
          margin: 0;
          padding-left: 20px;
        }

        .form-info li {
          margin-bottom: 4px;
        }

        .dialog-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }

        .dialog-buttons button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .dialog-buttons button[type="button"] {
          background-color: #E0E0E0;
          color: #333;
        }

        .dialog-buttons button[type="button"]:hover {
          background-color: #D0D0D0;
        }

        .dialog-buttons button[type="submit"] {
          background-color: #3498DB;
          color: white;
        }

        .dialog-buttons button[type="submit"]:hover {
          background-color: #2980B9;
        }
      `}</style>
    </div>
  );
};

export default PressureDialog; 