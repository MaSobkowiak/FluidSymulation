export interface Position {
  x: number;
  y: number;
  z: number;
}

export type NodeType = 'reservoir' | 'valve' | 'junction';

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

export interface NetworkState {
  nodes: Node[];
  edges: Edge[];
}

export type RenderMode = '2D' | '3D';

export interface SimulationState {
  network: NetworkState;
  isSimulationRunning: boolean;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  renderMode: RenderMode;
} 