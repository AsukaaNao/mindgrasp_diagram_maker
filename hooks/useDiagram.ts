
import { useState, useCallback, useRef, useMemo } from 'react';
import { DiagramNode, DiagramConnection, DiagramState, DiagramController } from '../types';
import { generateId } from '../utils/idUtils';

export const useDiagram = (): { state: DiagramState; controller: DiagramController } => {
  const [nodes, setNodes] = useState<DiagramNode[]>([]);
  const [connections, setConnections] = useState<DiagramConnection[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [pendingConnectionStartId, setPendingConnectionStartId] = useState<string | null>(null);

  const stateRef = useRef<DiagramState>({ 
    nodes: [], 
    connections: [], 
    selectedNodeId: null, 
    selectedConnectionId: null, 
    pendingConnectionStartId: null 
  });

  stateRef.current = { nodes, connections, selectedNodeId, selectedConnectionId, pendingConnectionStartId };

  // --- COMMANDS ---

  const addNode = useCallback((x: number, y: number, label: string = 'New Node') => {
    const newNode: DiagramNode = {
      id: generateId(),
      x,
      y,
      label,
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
    setSelectedConnectionId(null);
  }, []);

  const deleteNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setConnections((prev) => prev.filter((c) => c.from !== id && c.to !== id));
    
    if (stateRef.current.selectedNodeId === id) setSelectedNodeId(null);
    if (stateRef.current.pendingConnectionStartId === id) setPendingConnectionStartId(null);
    setSelectedConnectionId(null);
  }, []);

  const deleteConnection = useCallback((id: string) => {
    setConnections((prev) => prev.filter((c) => c.id !== id));
    if (stateRef.current.selectedConnectionId === id) setSelectedConnectionId(null);
  }, []);

  const updateNodePosition = useCallback((id: string, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y } : n)));
  }, []);

  const updateNodeLabel = useCallback((id: string, label: string) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, label } : n)));
  }, []);

  const selectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
    setSelectedConnectionId(null); // Mutually exclusive
    if (id === null) {
      setPendingConnectionStartId(null);
    }
  }, []);

  const selectConnection = useCallback((id: string | null) => {
    setSelectedConnectionId(id);
    setSelectedNodeId(null); // Mutually exclusive
    setPendingConnectionStartId(null);
  }, []);

  const startConnection = useCallback((nodeId: string) => {
    setPendingConnectionStartId(nodeId);
    setSelectedNodeId(nodeId);
    setSelectedConnectionId(null);
  }, []);

  const completeConnection = useCallback((targetNodeId: string) => {
    const startNodeId = stateRef.current.pendingConnectionStartId;
    
    if (!startNodeId) return;
    if (startNodeId === targetNodeId) return;

    const exists = stateRef.current.connections.some(
      (c) => (c.from === startNodeId && c.to === targetNodeId) || 
             (c.from === targetNodeId && c.to === startNodeId)
    );

    if (!exists) {
      const newConn: DiagramConnection = {
        id: generateId(),
        from: startNodeId,
        to: targetNodeId,
      };
      setConnections((prev) => [...prev, newConn]);
    }

    setPendingConnectionStartId(null);
  }, []);

  const loadDiagram = useCallback((data: { nodes: DiagramNode[]; connections: DiagramConnection[] }) => {
    setNodes(data.nodes || []);
    setConnections(data.connections || []);
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
    setPendingConnectionStartId(null);
  }, []);

  const clearDiagram = useCallback(() => {
    setNodes([]);
    setConnections([]);
    setSelectedNodeId(null);
    setSelectedConnectionId(null);
    setPendingConnectionStartId(null);
  }, []);

  const getState = useCallback(() => stateRef.current, []);

  const controller = useMemo<DiagramController>(() => ({
    addNode,
    deleteNode,
    deleteConnection,
    updateNodePosition,
    updateNodeLabel,
    startConnection,
    completeConnection,
    selectNode,
    selectConnection,
    loadDiagram,
    clearDiagram,
    getState
  }), [addNode, deleteNode, deleteConnection, updateNodePosition, updateNodeLabel, startConnection, completeConnection, selectNode, selectConnection, loadDiagram, clearDiagram, getState]);

  return {
    state: { nodes, connections, selectedNodeId, selectedConnectionId, pendingConnectionStartId },
    controller,
  };
};
