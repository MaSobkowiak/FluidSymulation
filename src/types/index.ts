export type NodeType = 'reservoir' | 'valve' | 'junction';

export interface Position {
  x: number;
  y: number;
  z: number;
}

export interface Node {
  id: string;
  type: NodeType;
  position: Position;
  pressure: number;
  isOpen: boolean;
}

export interface Edge {
  id: string;
  sourceId: string;
  targetId: string;
  flowRate: number;
  diameter: number;
}

export interface WaterNetwork {
  nodes: Node[];
  edges: Edge[];
}

export interface SimulationState {
  network: WaterNetwork;
  selectedNodeId: string | null;
  renderMode: '2D' | '3D';
  isSimulationRunning: boolean;
} 