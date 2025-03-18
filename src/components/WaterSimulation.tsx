import React, { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { addNode, addEdge, toggleSimulation, updateNodePressure, updateFlowRates, updatePressures, toggleValve, updateEdgeDiameter } from '../store/simulationSlice';
import CanvasRenderer from '../renderers/CanvasRenderer';
import PressureDialog from './PressureDialog';
import { NodeType, Position, Node, Edge } from '../types';
import DiameterDialog from './DiameterDialog';

// Simple implementation of fluid dynamics calculation
const calculateFluidDynamics = (nodes: Node[], edges: Edge[]): { 
  flowRates: Record<string, number>; 
  pressures: Record<string, number>;
} => {
  const flowRates: Record<string, number> = {};
  const pressures: Record<string, number> = {};
  
  // Step 1: Initialize pressures from reservoirs only
  nodes.forEach(node => {
    if (node.type === 'reservoir') {
      pressures[node.id] = node.pressure;
    } else {
      pressures[node.id] = 0;
    }
  });
  
  // Step 2: Use multiple iterations to propagate pressure through the network
  // This ensures pressure changes from valve states propagate correctly
  const MAX_ITERATIONS = 10;
  
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    // Make a copy of pressures to check for convergence
    const previousPressures = { ...pressures };
    
    // Create a graph representation for pressure propagation
    const nodeConnections: Record<string, string[]> = {};
    
    // Initialize the node connections
    nodes.forEach(node => {
      nodeConnections[node.id] = [];
    });
    
    // Build connection graph while considering valve states
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.sourceId);
      const targetNode = nodes.find(n => n.id === edge.targetId);
      
      if (!sourceNode || !targetNode) return;
      
      // If either node is a closed valve, don't add the connection
      if ((sourceNode.type === 'valve' && !sourceNode.isOpen) || 
          (targetNode.type === 'valve' && !targetNode.isOpen)) {
        return;
      }
      
      // Add bidirectional connections for valid paths
      nodeConnections[sourceNode.id].push(targetNode.id);
      nodeConnections[targetNode.id].push(sourceNode.id);
    });
    
    // Propagate pressures through open connections
    nodes.forEach(node => {
      // Skip reservoirs as they maintain constant pressure
      if (node.type === 'reservoir') return;
      
      const connections = nodeConnections[node.id];
      if (connections.length === 0) return;
      
      // Calculate average pressure from connected nodes (excluding zero pressures)
      let totalPressure = 0;
      let pressureCount = 0;
      let maxPressure = 0;
      
      connections.forEach(connectedId => {
        const connectedPressure = pressures[connectedId];
        if (connectedPressure > 0) {
          totalPressure += connectedPressure;
          pressureCount++;
          maxPressure = Math.max(maxPressure, connectedPressure);
        }
      });
      
      // Update node pressure based on connected nodes
      if (pressureCount > 0) {
        // Apply some pressure drop
        const avgPressure = totalPressure / pressureCount;
        const pressureDrop = 0.05; // 5% pressure drop
        
        // For valves, use the highest upstream pressure with a drop
        if (node.type === 'valve' && node.isOpen) {
          pressures[node.id] = maxPressure * (1 - pressureDrop);
        } else {
          // For junctions, use average with a smaller drop
          pressures[node.id] = avgPressure * (1 - pressureDrop/2);
        }
      }
    });
    
    // Calculate flow rates based on pressure differences
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.sourceId);
      const targetNode = nodes.find(n => n.id === edge.targetId);
      
      if (!sourceNode || !targetNode) {
        flowRates[edge.id] = 0;
        return;
      }
      
      // If valve is closed, no flow
      if ((sourceNode.type === 'valve' && !sourceNode.isOpen) || 
          (targetNode.type === 'valve' && !targetNode.isOpen)) {
        flowRates[edge.id] = 0;
        return;
      }
      
      // Calculate flow based on pressure difference and pipe diameter
      const pressureDiff = pressures[sourceNode.id] - pressures[targetNode.id];
      const resistance = 8 / (Math.PI * Math.pow(edge.diameter, 4));
      const flowRate = pressureDiff / resistance;
      
      flowRates[edge.id] = flowRate;
    });
    
    // Check for convergence (if pressures stop changing significantly)
    let maxChange = 0;
    Object.keys(pressures).forEach(nodeId => {
      const change = Math.abs(pressures[nodeId] - previousPressures[nodeId]);
      maxChange = Math.max(maxChange, change);
    });
    
    if (maxChange < 0.01) break; // Converged
  }
  
  return { flowRates, pressures };
};

const WaterSimulation: React.FC = () => {
  const dispatch = useDispatch();
  const isSimulationRunning = useSelector((state: RootState) => state.simulation.isSimulationRunning);
  const { nodes, edges } = useSelector((state: RootState) => state.simulation.network);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<NodeType | null>(null);
  const [isConnectionMode, setIsConnectionMode] = useState(false);
  const [pressureValue, setPressureValue] = useState<string>('5');
  const [isPressureDialogOpen, setIsPressureDialogOpen] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [diameterValue, setDiameterValue] = useState<string>('1');
  const [isDiameterDialogOpen, setIsDiameterDialogOpen] = useState(false);

  // Simulation logic
  useEffect(() => {
    if (!isSimulationRunning) return;

    const simulationInterval = setInterval(() => {
      const { flowRates, pressures } = calculateFluidDynamics(nodes, edges);
      dispatch(updateFlowRates(flowRates));
      dispatch(updatePressures(pressures));
    }, 100);

    return () => clearInterval(simulationInterval);
  }, [isSimulationRunning, nodes, edges, dispatch]);

  const handleNodeClick = useCallback((nodeId: string) => {
    const clickedNode = nodes.find(n => n.id === nodeId);
    if (!clickedNode) return;
    
    // Handle valve toggling during simulation
    if (clickedNode.type === 'valve' && isSimulationRunning) {
      dispatch(toggleValve(nodeId));
      return;
    }
    
    // Handle nodes in connection mode
    if (isConnectionMode && !isSimulationRunning) {
      if (!selectedNodeId) {
        // First node selection in connection mode
        setSelectedNodeId(nodeId);
      } else if (selectedNodeId !== nodeId) {
        // Second node selection - create connection
        const connectionExists = edges.some(
          edge => 
            (edge.sourceId === selectedNodeId && edge.targetId === nodeId) ||
            (edge.sourceId === nodeId && edge.targetId === selectedNodeId)
        );

        if (!connectionExists) {
          dispatch(addEdge({ sourceId: selectedNodeId, targetId: nodeId }));
        }
        setSelectedNodeId(null); // Reset selection after connection
      }
      return;
    }
    
    // Handle reservoir pressure dialog when not in connection mode
    if (clickedNode.type === 'reservoir' && !isSimulationRunning) {
      setSelectedNodeId(nodeId);
      setIsPressureDialogOpen(true);
    }
  }, [selectedNodeId, isConnectionMode, dispatch, edges, nodes, isSimulationRunning]);

  const handleEdgeClick = useCallback((edgeId: string) => {
    if (!isSimulationRunning) {
      setSelectedEdgeId(edgeId);
      const edge = edges.find(e => e.id === edgeId);
      if (edge) {
        setDiameterValue(edge.diameter.toString());
        setIsDiameterDialogOpen(true);
      }
    }
  }, [edges, isSimulationRunning]);

  const handleDiameterUpdate = (newDiameter: number) => {
    if (selectedEdgeId) {
      dispatch(updateEdgeDiameter({ edgeId: selectedEdgeId, diameter: newDiameter }));
    }
  };

  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedNodeType || isSimulationRunning) return;

    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    dispatch(addNode({
      type: selectedNodeType,
      position: { x, y, z: 0 } as Position,
      pressure: selectedNodeType === 'reservoir' ? parseFloat(pressureValue) : 0,
      isOpen: true
    }));
  }, [selectedNodeType, isSimulationRunning, dispatch, pressureValue]);

  const handleNodeTypeSelect = useCallback((type: NodeType | null) => {
    if (isSimulationRunning) return; // Prevent changing during simulation
    
    // Toggle connection mode if null is passed (Connect Nodes button)
    if (type === null) {
      setIsConnectionMode(prev => !prev);
      setSelectedNodeType(null);
    } else {
      // When selecting a node type, exit connection mode
      setIsConnectionMode(false);
      setSelectedNodeType(type);
    }
    
    setSelectedNodeId(null);
  }, [isSimulationRunning]);

  const handleSimulationToggle = () => {
    dispatch(toggleSimulation());
    setSelectedNodeId(null);
    setSelectedNodeType(null);
    setIsConnectionMode(false);
  };

  const handlePressureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPressureValue(value);
  };

  const handlePressureUpdate = (newPressure: number) => {
    if (!selectedNodeId) return;
    dispatch(updateNodePressure({ nodeId: selectedNodeId, pressure: newPressure }));
  };

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault(); // Prevent default context menu
    if (!isSimulationRunning) {
      setSelectedNodeType(null);
      setSelectedNodeId(null);
      setIsConnectionMode(false);
    }
  }, [isSimulationRunning]);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="water-simulation" onContextMenu={handleContextMenu}>
      <div className="simulation-header">
        <button 
          onClick={handleSimulationToggle}
          className={`simulation-toggle ${isSimulationRunning ? 'running' : ''}`}
          disabled={nodes.length === 0}
        >
          {isSimulationRunning ? 'Stop Simulation' : 'Start Simulation'}
        </button>
      </div>
      
      <div className="simulation-container">
        <div className="node-controls">
          <button 
            className={`node-type-btn ${selectedNodeType === 'reservoir' ? 'selected' : ''}`}
            onClick={() => handleNodeTypeSelect('reservoir')}
            disabled={isSimulationRunning}
          >
            Add Reservoir
          </button>
          <button 
            className={`node-type-btn ${selectedNodeType === 'valve' ? 'selected' : ''}`}
            onClick={() => handleNodeTypeSelect('valve')}
            disabled={isSimulationRunning}
          >
            Add Valve
          </button>
          <button 
            className={`node-type-btn ${selectedNodeType === 'junction' ? 'selected' : ''}`}
            onClick={() => handleNodeTypeSelect('junction')}
            disabled={isSimulationRunning}
          >
            Add Junction
          </button>
          <button 
            className={`node-type-btn ${isConnectionMode ? 'selected' : ''} ${isSimulationRunning ? 'disabled' : ''}`}
            onClick={() => handleNodeTypeSelect(null)}
            disabled={isSimulationRunning}
          >
            Connect Nodes
          </button>

          {selectedEdgeId && !isSimulationRunning && (
            <div className="edge-controls">
              <input
                type="number"
                value={diameterValue}
                onChange={(e) => setDiameterValue(e.target.value)}
                min="0.1"
                step="0.1"
                placeholder="Pipe diameter"
              />
              <button onClick={() => setIsDiameterDialogOpen(true)}>Update Diameter</button>
            </div>
          )}
        </div>

        <CanvasRenderer
          width={800}
          height={600}
          nodes={nodes}
          edges={edges}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          onCanvasClick={handleCanvasClick}
          isSimulationRunning={isSimulationRunning}
          selectedNodeType={selectedNodeType}
          onContextMenu={handleContextMenu}
        />
      </div>

      {selectedNode?.type === 'reservoir' && (
        <PressureDialog
          isOpen={isPressureDialogOpen}
          onClose={() => setIsPressureDialogOpen(false)}
          onUpdate={handlePressureUpdate}
          currentPressure={selectedNode.pressure}
        />
      )}

      {selectedEdgeId && (
        <DiameterDialog
          isOpen={isDiameterDialogOpen}
          onClose={() => setIsDiameterDialogOpen(false)}
          onUpdate={handleDiameterUpdate}
          currentDiameter={parseFloat(diameterValue)}
        />
      )}

      <style>{`
        .water-simulation {
          padding: 20px;
        }

        .simulation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .simulation-toggle {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          background-color: #2ECC71;
          color: white;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .simulation-toggle:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .simulation-toggle.running {
          background-color: #E74C3C;
        }

        .simulation-container {
          display: flex;
          gap: 20px;
        }

        .node-controls {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .edge-controls {
          margin-top: 10px;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .edge-controls input {
          padding: 4px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .edge-controls button {
          padding: 4px 8px;
          background-color: #3498DB;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .edge-controls button:hover {
          background-color: #2980B9;
        }

        .node-type-btn {
          padding: 8px 16px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background-color: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .node-type-btn:disabled {
          background-color: #f5f5f5;
          color: #999;
          cursor: not-allowed;
          border-color: #ddd;
        }

        .node-type-btn.selected {
          background-color: #3498DB;
          color: white;
          border-color: #3498DB;
        }

        .node-type-btn.selected:disabled {
          background-color: #95A5A6;
          border-color: #95A5A6;
        }

        .node-type-btn:hover:not(:disabled) {
          background-color: #f0f0f0;
        }

        .node-type-btn.selected:hover:not(:disabled) {
          background-color: #2980B9;
        }
      `}</style>
    </div>
  );
};

export default WaterSimulation; 