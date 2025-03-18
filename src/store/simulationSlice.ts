import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SimulationState, Node, Edge, Position } from '../types';
import { v4 as uuidv4 } from 'uuid';

const initialState: SimulationState = {
  network: {
    nodes: [
      {
        id: 'reservoir-1',
        type: 'reservoir',
        position: { x: 100, y: 300, z: 0 },
        pressure: 100,
        isOpen: true
      },
      {
        id: 'valve-1',
        type: 'valve',
        position: { x: 300, y: 300, z: 0 },
        pressure: 0,
        isOpen: true
      },
      {
        id: 'junction-1',
        type: 'junction',
        position: { x: 500, y: 300, z: 0 },
        pressure: 0,
        isOpen: true
      },
      {
        id: 'valve-2',
        type: 'valve',
        position: { x: 700, y: 300, z: 0 },
        pressure: 0,
        isOpen: true
      },
      {
        id: 'junction-2',
        type: 'junction',
        position: { x: 500, y: 100, z: 0 },
        pressure: 0,
        isOpen: true
      }
    ],
    edges: [
      {
        id: 'edge-1',
        sourceId: 'reservoir-1',
        targetId: 'valve-1',
        flowRate: 0,
        diameter: 1
      },
      {
        id: 'edge-2',
        sourceId: 'valve-1',
        targetId: 'junction-1',
        flowRate: 0,
        diameter: 1
      },
      {
        id: 'edge-3',
        sourceId: 'junction-1',
        targetId: 'valve-2',
        flowRate: 0,
        diameter: 1
      },
      {
        id: 'edge-4',
        sourceId: 'junction-1',
        targetId: 'junction-2',
        flowRate: 0,
        diameter: 1
      }
    ]
  },
  selectedNodeId: null,
  renderMode: '2D',
  isSimulationRunning: false
};

export const simulationSlice = createSlice({
  name: 'simulation',
  initialState,
  reducers: {
    addNode: (state, action: PayloadAction<{
      type: Node['type'];
      position: Position;
      pressure?: number;
      isOpen?: boolean;
    }>) => {
      const newNode: Node = {
        id: uuidv4(),
        ...action.payload,
        pressure: action.payload.pressure ?? 0,
        isOpen: action.payload.isOpen ?? true
      };
      state.network.nodes.push(newNode);
    },
    removeNode: (state, action: PayloadAction<string>) => {
      state.network.nodes = state.network.nodes.filter(node => node.id !== action.payload);
      state.network.edges = state.network.edges.filter(
        edge => edge.sourceId !== action.payload && edge.targetId !== action.payload
      );
    },
    addEdge: (state, action: PayloadAction<{ sourceId: string, targetId: string }>) => {
      const newEdge: Edge = {
        id: uuidv4(),
        ...action.payload,
        flowRate: 0,
        diameter: 1
      };
      state.network.edges.push(newEdge);
    },
    toggleValve: (state, action: PayloadAction<string>) => {
      const valve = state.network.nodes.find(node => 
        node.id === action.payload && node.type === 'valve'
      );
      if (valve) {
        valve.isOpen = !valve.isOpen;
      }
    },
    setRenderMode: (state, action: PayloadAction<'2D' | '3D'>) => {
      state.renderMode = action.payload;
    },
    toggleSimulation: (state) => {
      state.isSimulationRunning = !state.isSimulationRunning;
    },
    updateFlowRates: (state, action: PayloadAction<Record<string, number>>) => {
      Object.entries(action.payload).forEach(([edgeId, flowRate]) => {
        const edge = state.network.edges.find(e => e.id === edgeId);
        if (edge) {
          edge.flowRate = flowRate;
        }
      });
    },
    updatePressures: (state, action: PayloadAction<Record<string, number>>) => {
      Object.entries(action.payload).forEach(([nodeId, pressure]) => {
        const node = state.network.nodes.find(n => n.id === nodeId);
        if (node) {
          node.pressure = pressure;
        }
      });
    },
    updateNodePressure: (state, action: PayloadAction<{ nodeId: string, pressure: number }>) => {
      const { nodeId, pressure } = action.payload;
      const node = state.network.nodes.find(n => n.id === nodeId);
      if (node) {
        node.pressure = pressure;
      }
    },
    updateEdgeDiameter: (state, action: PayloadAction<{ edgeId: string, diameter: number }>) => {
      const { edgeId, diameter } = action.payload;
      const edge = state.network.edges.find(e => e.id === edgeId);
      if (edge) {
        edge.diameter = diameter;
      }
    }
  }
});

export const {
  addNode,
  removeNode,
  addEdge,
  toggleValve,
  setRenderMode,
  toggleSimulation,
  updateFlowRates,
  updatePressures,
  updateNodePressure,
  updateEdgeDiameter
} = simulationSlice.actions;

export default simulationSlice.reducer; 