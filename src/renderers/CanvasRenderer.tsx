import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { Node, Edge, NodeType, Position } from '../types';
import { toggleValve } from '../store/simulationSlice';
import Legend from '../components/Legend';

interface CanvasRendererProps {
  width: number;
  height: number;
  nodes: Node[];
  edges: Edge[];
  onNodeClick: (nodeId: string) => void;
  onEdgeClick: (edgeId: string) => void;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  onCanvasClick: (event: React.MouseEvent<HTMLCanvasElement>) => void;
  isSimulationRunning: boolean;
  selectedNodeType: NodeType | null;
  onContextMenu: (event: React.MouseEvent) => void;
}

/**
 * Renders the water network graph on a canvas
 */
const CanvasRenderer: React.FC<CanvasRendererProps> = ({
  width,
  height,
  nodes,
  edges,
  onNodeClick,
  onEdgeClick,
  selectedNodeId,
  selectedEdgeId,
  onCanvasClick,
  isSimulationRunning,
  selectedNodeType,
  onContextMenu
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dispatch = useDispatch();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState<Position | null>(null);

  // Node visualization constants
  const NODE_RADIUS = 15;
  const VALVE_SIZE = 16;
  const JUNCTION_RADIUS = 10;
  const RESERVOIR_SIZE = 20;

  /**
   * Draw a node on the canvas
   */
  const drawNode = useCallback((ctx: CanvasRenderingContext2D, node: Node) => {
    const isSelected = node.id === selectedNodeId;
    const x = node.position.x + offset.x;
    const y = node.position.y + offset.y;

    ctx.save();
    
    // Draw selection highlight
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, NODE_RADIUS + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
      ctx.fill();
    }
    
    // Draw node based on type
    switch (node.type) {
      case 'reservoir':
        // Draw reservoir as square
        ctx.beginPath();
        ctx.rect(x - RESERVOIR_SIZE/2, y - RESERVOIR_SIZE/2, RESERVOIR_SIZE, RESERVOIR_SIZE);
        ctx.fillStyle = isSelected ? '#3498DB' : '#2980B9';
        ctx.fill();
        ctx.strokeStyle = '#1F618D';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw water level indicator
        ctx.beginPath();
        ctx.rect(x - RESERVOIR_SIZE/2 + 2, y - RESERVOIR_SIZE/2 + 2, RESERVOIR_SIZE - 4, (RESERVOIR_SIZE - 4) * 0.7);
        ctx.fillStyle = '#AED6F1';
        ctx.fill();
        break;
        
      case 'valve':
        // Draw valve as diamond with open/closed indicator
        ctx.beginPath();
        ctx.moveTo(x, y - VALVE_SIZE/2);
        ctx.lineTo(x + VALVE_SIZE/2, y);
        ctx.lineTo(x, y + VALVE_SIZE/2);
        ctx.lineTo(x - VALVE_SIZE/2, y);
        ctx.closePath();
        ctx.fillStyle = node.isOpen ? '#2ECC71' : '#E74C3C';
        ctx.fill();
        ctx.strokeStyle = '#1E8449';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw valve state indicator
        if (node.isOpen) {
          // Open valve - vertical line
          ctx.beginPath();
          ctx.moveTo(x, y - VALVE_SIZE/4);
          ctx.lineTo(x, y + VALVE_SIZE/4);
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          // Closed valve - X
          ctx.beginPath();
          ctx.moveTo(x - VALVE_SIZE/4, y - VALVE_SIZE/4);
          ctx.lineTo(x + VALVE_SIZE/4, y + VALVE_SIZE/4);
          ctx.moveTo(x + VALVE_SIZE/4, y - VALVE_SIZE/4);
          ctx.lineTo(x - VALVE_SIZE/4, y + VALVE_SIZE/4);
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        break;
        
      case 'junction':
        // Draw junction as circle
        ctx.beginPath();
        ctx.arc(x, y, JUNCTION_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#3498DB' : '#95A5A6';
        ctx.fill();
        ctx.strokeStyle = '#7F8C8D';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
    }
    
    // Draw pressure value with units
    ctx.fillStyle = '#34495E';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${node.pressure.toFixed(1)} bar`, x, y + NODE_RADIUS + 5);
    
    ctx.restore();
  }, [selectedNodeId, offset]);

  /**
   * Draw an edge (pipe) on the canvas
   */
  const drawEdge = useCallback((ctx: CanvasRenderingContext2D, edge: Edge, sourceNode: Node, targetNode: Node) => {
    const isSelected = edge.id === selectedEdgeId;
    const x1 = sourceNode.position.x + offset.x;
    const y1 = sourceNode.position.y + offset.y;
    const x2 = targetNode.position.x + offset.x;
    const y2 = targetNode.position.y + offset.y;
    
    // Calculate pipe angle for flow indicator
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    
    // Pipe base width based on diameter
    const baseWidth = 2;
    const maxWidth = 10;
    const lineWidth = Math.min(baseWidth + (edge.diameter * 2), maxWidth);
    
    ctx.save();
    
    // Draw pipe
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    
    // Set edge color based on flow rate, simulation state, and selection
    if (isSelected) {
      ctx.strokeStyle = '#FFD700';
    } else if (isSimulationRunning) {
      // Color based on flow direction and rate
      const flowRate = edge.flowRate || 0;
      const flowMagnitude = Math.abs(flowRate);
      const maxFlow = 10; // Reference for max flow coloring
      
      if (flowRate > 0) {
        // Flow from source to target - blue gradient
        const intensity = Math.min(flowMagnitude / maxFlow, 1);
        ctx.strokeStyle = `rgba(41, 128, 185, ${0.4 + intensity * 0.6})`;
      } else if (flowRate < 0) {
        // Flow from target to source - red gradient
        const intensity = Math.min(flowMagnitude / maxFlow, 1);
        ctx.strokeStyle = `rgba(231, 76, 60, ${0.4 + intensity * 0.6})`;
      } else {
        // No flow - gray
        ctx.strokeStyle = '#95A5A6';
      }
    } else {
      // Simulation not running - gray with diameter visualization
      ctx.strokeStyle = '#95A5A6';
    }
    
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    
    // Draw flow indicators when simulation is running
    if (isSimulationRunning && edge.flowRate !== 0) {
      const flowRate = edge.flowRate;
      const flowDirection = flowRate > 0 ? 1 : -1;
      const flowMagnitude = Math.abs(flowRate);
      const maxFlow = 10;
      const normalizedFlow = Math.min(flowMagnitude / maxFlow, 1);
      
      // Draw flow arrow indicators
      const numArrows = Math.ceil(normalizedFlow * 5) + 1;
      const arrowSpacing = length / (numArrows + 1);
      
      for (let i = 1; i <= numArrows; i++) {
        // Position along the line
        const t = i / (numArrows + 1);
        const arrowX = x1 + (x2 - x1) * t;
        const arrowY = y1 + (y2 - y1) * t;
        
        // Draw arrow
        const arrowSize = 5 + normalizedFlow * 5;
        
        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angle + (flowDirection < 0 ? Math.PI : 0));
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-arrowSize, -arrowSize/2);
        ctx.lineTo(-arrowSize, arrowSize/2);
        ctx.closePath();
        
        ctx.fillStyle = flowRate > 0 ? '#3498DB' : '#E74C3C';
        ctx.fill();
        ctx.restore();
      }
    }
    
    // Draw flow rate text
    if (isSimulationRunning) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      
      // Create background for text
      const flowText = `${Math.abs(edge.flowRate).toFixed(2)} m³/s`;
      const textWidth = ctx.measureText(flowText).width;
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(midX - textWidth/2 - 4, midY - 9, textWidth + 8, 18);
      
      // Draw text
      ctx.fillStyle = '#34495E';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(flowText, midX, midY);
    }
    
    // Draw diameter text near the center if selected or not running simulation
    if (isSelected || !isSimulationRunning) {
      const diameterX = (x1 + x2) / 2 - 20;
      const diameterY = (y1 + y2) / 2 + 15;
      
      ctx.fillStyle = isSelected ? '#FFD700' : '#7F8C8D';
      ctx.font = isSelected ? 'bold 12px Arial' : '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`⌀${edge.diameter.toFixed(1)}m`, diameterX, diameterY);
    }
    
    ctx.restore();
  }, [selectedEdgeId, offset, isSimulationRunning]);

  /**
   * Draw connection preview when in connection mode
   */
  const drawConnectionPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!selectedNodeId || !mousePos || isSimulationRunning) return;
    
    const selectedNode = nodes.find(n => n.id === selectedNodeId);
    if (!selectedNode) return;
    
    const startX = selectedNode.position.x + offset.x;
    const startY = selectedNode.position.y + offset.y;
    const endX = mousePos.x;
    const endY = mousePos.y;
    
    ctx.save();
    
    // Draw dashed line
    ctx.beginPath();
    ctx.setLineDash([5, 3]);
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = '#3498DB';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw arrow at end
    const angle = Math.atan2(endY - startY, endX - startX);
    const arrowSize = 10;
    
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.translate(endX, endY);
    ctx.rotate(angle);
    ctx.moveTo(0, 0);
    ctx.lineTo(-arrowSize, -arrowSize/2);
    ctx.lineTo(-arrowSize, arrowSize/2);
    ctx.closePath();
    ctx.fillStyle = '#3498DB';
    ctx.fill();
    
    ctx.restore();
  }, [selectedNodeId, mousePos, nodes, offset, isSimulationRunning]);

  /**
   * Draw node preview when adding a new node
   */
  const drawNodePreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!mousePos || !selectedNodeType || isSimulationRunning) return;
    
    const x = mousePos.x;
    const y = mousePos.y;
    
    ctx.save();
    
    // Draw ghost node based on selected type
    ctx.globalAlpha = 0.6;
    
    switch (selectedNodeType) {
      case 'reservoir':
        ctx.beginPath();
        ctx.rect(x - RESERVOIR_SIZE/2, y - RESERVOIR_SIZE/2, RESERVOIR_SIZE, RESERVOIR_SIZE);
        ctx.fillStyle = '#2980B9';
        ctx.fill();
        ctx.strokeStyle = '#1F618D';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
        
      case 'valve':
        ctx.beginPath();
        ctx.moveTo(x, y - VALVE_SIZE/2);
        ctx.lineTo(x + VALVE_SIZE/2, y);
        ctx.lineTo(x, y + VALVE_SIZE/2);
        ctx.lineTo(x - VALVE_SIZE/2, y);
        ctx.closePath();
        ctx.fillStyle = '#2ECC71';
        ctx.fill();
        ctx.strokeStyle = '#1E8449';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
        
      case 'junction':
        ctx.beginPath();
        ctx.arc(x, y, JUNCTION_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = '#95A5A6';
        ctx.fill();
        ctx.strokeStyle = '#7F8C8D';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
    }
    
    ctx.restore();
  }, [mousePos, selectedNodeType, isSimulationRunning, RESERVOIR_SIZE, VALVE_SIZE, JUNCTION_RADIUS]);

  /**
   * Handle canvas clicks to detect nodes and edges
   */
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicked on a node
    const clickedNode = nodes.find(node => {
      const nodeX = node.position.x + offset.x;
      const nodeY = node.position.y + offset.y;
      const dx = x - nodeX;
      const dy = y - nodeY;
      return Math.sqrt(dx * dx + dy * dy) < NODE_RADIUS;
    });

    if (clickedNode) {
      onNodeClick(clickedNode.id);
      return;
    }

    // Check if clicked on an edge
    const clickedEdge = edges.find(edge => {
      const sourceNode = nodes.find(n => n.id === edge.sourceId);
      const targetNode = nodes.find(n => n.id === edge.targetId);
      if (!sourceNode || !targetNode) return false;

      const x1 = sourceNode.position.x + offset.x;
      const y1 = sourceNode.position.y + offset.y;
      const x2 = targetNode.position.x + offset.x;
      const y2 = targetNode.position.y + offset.y;
      
      // Calculate distance from point to line segment
      const lineLengthSquared = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
      if (lineLengthSquared === 0) return false;
      
      // Calculate projection of point onto line
      let t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lineLengthSquared;
      t = Math.max(0, Math.min(1, t)); // Constrain to line segment
      
      const projX = x1 + t * (x2 - x1);
      const projY = y1 + t * (y2 - y1);
      
      // Calculate distance from point to projection
      const distance = Math.sqrt(Math.pow(x - projX, 2) + Math.pow(y - projY, 2));
      
      // Use thicker hit area for thicker pipes
      const hitTolerance = 5 + edge.diameter;
      return distance <= hitTolerance;
    });

    if (clickedEdge) {
      onEdgeClick(clickedEdge.id);
      return;
    }

    // If not clicked on a node or edge, handle canvas click
    onCanvasClick(event);
  }, [nodes, edges, offset, onNodeClick, onEdgeClick, onCanvasClick, NODE_RADIUS]);

  /**
   * Track mouse position for node/connection previews
   */
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setMousePos({ x, y, z: 0 });
    
    // Handle panning
    if (isDragging) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      
      setOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setDragStart({ x, y });
    }
  }, [isDragging, dragStart]);

  /**
   * Start panning with middle mouse button
   */
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    // Middle mouse button for panning
    if (event.button === 1) {
      event.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: event.clientX - canvasRef.current!.getBoundingClientRect().left,
        y: event.clientY - canvasRef.current!.getBoundingClientRect().top
      });
    }
  }, []);

  /**
   * Stop panning
   */
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  /**
   * Handle zoom with mouse wheel
   */
  const handleWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const zoomSpeed = 0.1;
    const delta = event.deltaY < 0 ? zoomSpeed : -zoomSpeed;
    const newScale = Math.max(0.5, Math.min(3, scale + delta));
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Adjust offset to zoom toward/away from mouse pointer
    const scaleFactor = newScale / scale;
    setOffset(prev => ({
      x: x - (x - prev.x) * scaleFactor,
      y: y - (y - prev.y) * scaleFactor
    }));
    
    setScale(newScale);
  }, [scale]);

  /**
   * Draw the entire canvas
   */
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply scale transformation
    ctx.save();
    ctx.scale(scale, scale);
    
    // Draw grid
    const gridSize = 20;
    ctx.beginPath();
    ctx.strokeStyle = '#EEEEEE';
    ctx.lineWidth = 0.5;
    
    // Vertical grid lines
    for (let x = offset.x % gridSize; x < canvas.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
    }
    
    // Horizontal grid lines
    for (let y = offset.y % gridSize; y < canvas.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
    }
    
    ctx.stroke();
    
    // Draw edges
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.sourceId);
      const targetNode = nodes.find(n => n.id === edge.targetId);
      if (sourceNode && targetNode) {
        drawEdge(ctx, edge, sourceNode, targetNode);
      }
    });
    
    // Draw connection preview
    drawConnectionPreview(ctx);
    
    // Draw nodes
    nodes.forEach(node => drawNode(ctx, node));
    
    // Draw node preview
    drawNodePreview(ctx);
    
    ctx.restore();
  }, [
    nodes, 
    edges, 
    offset, 
    scale, 
    drawNode, 
    drawEdge, 
    drawConnectionPreview, 
    drawNodePreview
  ]);

  // Main render loop
  useEffect(() => {
    const renderLoop = () => {
      drawCanvas();
      requestAnimationFrame(renderLoop);
    };
    
    const animationId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationId);
  }, [drawCanvas]);

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={onContextMenu}
        style={{
          backgroundColor: 'white',
          border: '1px solid #ccc',
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      />
      <Legend />
    </div>
  );
};

export default CanvasRenderer; 