import { Node, Edge } from '../types';

/**
 * Calculates fluid dynamics in the network including flow rates and pressures
 * @param nodes Array of nodes in the network
 * @param edges Array of edges connecting the nodes
 * @returns Object containing flow rates and pressures for the network
 */
export const calculateFluidDynamics = (nodes: Node[], edges: Edge[]): { 
  flowRates: Record<string, number>; 
  pressures: Record<string, number>;
} => {
  // Initialize return objects
  const flowRates: Record<string, number> = {};
  const pressures: Record<string, number> = {};
  
  // Step 1: Set initial pressures from reservoirs
  nodes.forEach(node => {
    if (node.type === 'reservoir') {
      pressures[node.id] = node.pressure;
    } else {
      pressures[node.id] = 0;
    }
  });
  
  // Step 2: Iteratively calculate pressures through the network
  // For better convergence, we perform multiple iterations
  const MAX_ITERATIONS = 10;
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    // Create a copy of current pressures to check for convergence
    const prevPressures = { ...pressures };
    
    // Calculate flow through each edge
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.sourceId);
      const targetNode = nodes.find(n => n.id === edge.targetId);
      
      if (!sourceNode || !targetNode) return;
      
      // Skip closed valves
      if ((sourceNode.type === 'valve' && !sourceNode.isOpen) || 
          (targetNode.type === 'valve' && !targetNode.isOpen)) {
        flowRates[edge.id] = 0;
        return;
      }
      
      // Calculate flow based on pressure difference and pipe properties
      // Using Darcy-Weisbach equation in simplified form
      const pressureDiff = pressures[sourceNode.id] - pressures[targetNode.id];
      
      // Calculate resistance based on pipe diameter (simplified)
      // In a real application, this would account for length, friction, etc.
      const resistance = 8 / (Math.PI * Math.pow(edge.diameter, 4));
      
      // Calculate flow rate (positive = flow from source to target)
      const flowRate = pressureDiff / resistance;
      flowRates[edge.id] = flowRate;
    });
    
    // Update pressures based on flow
    nodes.forEach(node => {
      if (node.type === 'reservoir') return; // Reservoirs maintain constant pressure
      
      // Find all incoming and outgoing edges for this node
      const incomingEdges = edges.filter(e => e.targetId === node.id);
      const outgoingEdges = edges.filter(e => e.sourceId === node.id);
      
      // Calculate net flow into the node
      const inflow = incomingEdges.reduce((sum, edge) => {
        return sum + (flowRates[edge.id] || 0);
      }, 0);
      
      const outflow = outgoingEdges.reduce((sum, edge) => {
        return sum + (flowRates[edge.id] || 0);
      }, 0);
      
      // Adjust pressure based on net flow
      // In a junction, pressure adjusts to balance incoming and outgoing flows
      if (incomingEdges.length > 0) {
        // Calculate weighted average of incoming pressures
        let weightedPressure = 0;
        let totalWeight = 0;
        
        incomingEdges.forEach(edge => {
          const sourceNode = nodes.find(n => n.id === edge.sourceId);
          if (sourceNode && flowRates[edge.id] > 0) {
            const weight = flowRates[edge.id] * edge.diameter;
            weightedPressure += pressures[sourceNode.id] * weight;
            totalWeight += weight;
          }
        });
        
        if (totalWeight > 0) {
          // Apply some pressure loss proportional to flow
          const pressureLoss = Math.abs(inflow - outflow) * 0.1;
          pressures[node.id] = (weightedPressure / totalWeight) - pressureLoss;
        }
      }
    });
    
    // Check for convergence
    let maxDiff = 0;
    Object.keys(pressures).forEach(nodeId => {
      const diff = Math.abs(pressures[nodeId] - prevPressures[nodeId]);
      maxDiff = Math.max(maxDiff, diff);
    });
    
    if (maxDiff < 0.01) break; // Converged
  }
  
  return { flowRates, pressures };
}; 