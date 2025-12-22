
export interface DiagramNode {
  id: string;
  x: number;
  y: number;
  label: string;
}

export interface DiagramConnection {
  id: string;
  from: string; // Node ID
  to: string;   // Node ID
}

export interface DiagramState {
  nodes: DiagramNode[];
  connections: DiagramConnection[];
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  pendingConnectionStartId: string | null;
}

export interface FileInfo {
  id: string;
  name: string;
  lastModified: number;
}

export interface SavedFile {
  id: string;
  info: FileInfo;
  data: {
    nodes: DiagramNode[];
    connections: DiagramConnection[];
  };
}

export interface DiagramController {
  addNode: (x: number, y: number, label?: string) => void;
  deleteNode: (id: string) => void;
  deleteConnection: (id: string) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  updateNodeLabel: (id: string, label: string) => void;
  startConnection: (nodeId: string) => void;
  completeConnection: (targetNodeId: string) => void;
  selectNode: (id: string | null) => void;
  selectConnection: (id: string | null) => void;
  loadDiagram: (data: { nodes: DiagramNode[]; connections: DiagramConnection[] }) => void;
  clearDiagram: () => void;
  getState: () => DiagramState;
}

export type ThemeMode = 'light' | 'dark';

export interface FileManager {
  currentFile: FileInfo | null;
  savedFiles: SavedFile[]; 
  theme: ThemeMode;
  createNewFile: () => void;
  openFile: (file: File) => void;
  saveToBrowser: () => void;
  downloadJson: () => void;
  renameFile: (newName: string) => void;
  closeFile: () => void;
  loadSavedFile: (savedFile: SavedFile) => void;
  deleteSavedFile: (id: string) => void;
  toggleTheme: () => void;
}

// --- Computer Vision / Backend Types ---

// Updated to the new gesture name requirements including the empty string ""
export type HandShape = 'add' | 'delete' | 'connecting' | 'hover' | 'grabbing' | 'select' | 'no_hand' | '';

export interface GesturePrediction {
  gesture: HandShape;
  wrist: {
    x: number;
    y: number;
  };
}
