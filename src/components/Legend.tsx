import React from 'react';

/**
 * Legend component that displays information about the simulation elements
 */
const Legend: React.FC = () => {
  return (
    <div className="legend">
      <h4>Legend</h4>
      <div className="legend-items">
        <div className="legend-item">
          <div className="legend-symbol reservoir"></div>
          <span>Reservoir - Water source with constant pressure</span>
        </div>
        <div className="legend-item">
          <div className="legend-symbol valve open"></div>
          <span>Valve (Open) - Controls flow direction</span>
        </div>
        <div className="legend-item">
          <div className="legend-symbol valve closed"></div>
          <span>Valve (Closed) - Blocks flow</span>
        </div>
        <div className="legend-item">
          <div className="legend-symbol junction"></div>
          <span>Junction - Connects multiple pipes</span>
        </div>
        <div className="legend-item">
          <div className="legend-symbol pipe flow-positive"></div>
          <span>Pipe with flow (Blue) - Shows flow direction and rate</span>
        </div>
        <div className="legend-item">
          <div className="legend-symbol pipe flow-negative"></div>
          <span>Reverse flow (Red) - Flow in opposite direction</span>
        </div>
      </div>
      <style>{`
        .legend {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background-color: rgba(255, 255, 255, 0.9);
          border: 1px solid #ccc;
          border-radius: 4px;
          padding: 10px;
          font-size: 12px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          max-width: 250px;
          z-index: 10;
        }
        
        .legend h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #2C3E50;
          border-bottom: 1px solid #eee;
          padding-bottom: 5px;
        }
        
        .legend-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .legend-symbol {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .legend-symbol.reservoir {
          background-color: #2980B9;
        }
        
        .legend-symbol.valve {
          position: relative;
          transform: rotate(45deg);
        }
        
        .legend-symbol.valve.open {
          background-color: #2ECC71;
        }
        
        .legend-symbol.valve.open::after {
          content: "";
          position: absolute;
          width: 2px;
          height: 12px;
          background-color: white;
          transform: rotate(45deg);
        }
        
        .legend-symbol.valve.closed {
          background-color: #E74C3C;
        }
        
        .legend-symbol.valve.closed::after {
          content: "";
          position: absolute;
          width: 12px;
          height: 2px;
          background-color: white;
        }
        
        .legend-symbol.valve.closed::before {
          content: "";
          position: absolute;
          width: 12px;
          height: 2px;
          background-color: white;
          transform: rotate(90deg);
        }
        
        .legend-symbol.junction {
          border-radius: 50%;
          background-color: #95A5A6;
        }
        
        .legend-symbol.pipe {
          width: 40px;
          height: 10px;
          position: relative;
        }
        
        .legend-symbol.pipe.flow-positive {
          background-color: rgba(41, 128, 185, 0.8);
        }
        
        .legend-symbol.pipe.flow-positive::after {
          content: "";
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid white;
          border-top: 4px solid transparent;
          border-bottom: 4px solid transparent;
        }
        
        .legend-symbol.pipe.flow-negative {
          background-color: rgba(231, 76, 60, 0.8);
        }
        
        .legend-symbol.pipe.flow-negative::after {
          content: "";
          position: absolute;
          left: 5px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-right: 6px solid white;
          border-top: 4px solid transparent;
          border-bottom: 4px solid transparent;
        }
      `}</style>
    </div>
  );
};

export default Legend; 