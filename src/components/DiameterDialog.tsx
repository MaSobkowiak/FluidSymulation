import React, { useState, useEffect } from 'react';

interface DiameterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (diameter: number) => void;
  currentDiameter: number;
}

/**
 * Dialog component for updating pipe diameters
 */
const DiameterDialog: React.FC<DiameterDialogProps> = ({
  isOpen,
  onClose,
  onUpdate,
  currentDiameter
}) => {
  const [diameter, setDiameter] = useState<string>(currentDiameter.toString());
  const [error, setError] = useState<string | null>(null);

  // Update local state when current diameter changes
  useEffect(() => {
    setDiameter(currentDiameter.toString());
    setError(null);
  }, [currentDiameter, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDiameter = parseFloat(diameter);
    
    if (isNaN(newDiameter)) {
      setError('Please enter a valid number');
      return;
    }
    
    if (newDiameter <= 0) {
      setError('Diameter must be greater than zero');
      return;
    }
    
    if (newDiameter > 5) {
      setError('Maximum diameter is 5 meters');
      return;
    }
    
    onUpdate(newDiameter);
    onClose();
  };

  const handleCancel = () => {
    setDiameter(currentDiameter.toString());
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog-content">
        <h3>Update Pipe Diameter</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="diameter">Diameter (m):</label>
            <input
              type="number"
              id="diameter"
              value={diameter}
              onChange={(e) => {
                setDiameter(e.target.value);
                setError(null);
              }}
              min="0.1"
              max="5"
              step="0.1"
              required
              autoFocus
            />
            {error && <div className="error-message">{error}</div>}
          </div>
          <div className="form-info">
            <p>Pipe diameter affects flow rate. Larger pipes allow more flow with less pressure loss.</p>
            <ul>
              <li>Small pipes (0.1-0.5m): High resistance, low flow</li>
              <li>Medium pipes (0.5-2m): Moderate flow rates</li>
              <li>Large pipes (2-5m): High volume flow with minimal losses</li>
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

export default DiameterDialog; 