import React, { useState, useRef, useEffect } from 'react';
import { DiagramController, DiagramState, DiagramNode, GesturePrediction, HandShape } from '../types';
import { NodeComponent } from './NodeComponent';
import { ConnectionComponent } from './ConnectionComponent';
import { GestureService } from '../services/gestureBackend';

const LERP_FACTOR = 0.2; // Smoothness factor

const lerp = (start: number, end: number, factor: number) => {
  return start + (end - start) * factor;
};

interface CanvasProps {
  controller: DiagramController;
  state: DiagramState;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Canvas: React.FC<CanvasProps> = ({ controller, state, onShowToast }) => {
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [gestureCursor, setGestureCursor] = useState<{x: number, y: number, shape: HandShape} | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const stateRef = useRef(state);
  const controllerRef = useRef(controller);
  const lastActionTimeRef = useRef(0);
  const viewOffsetRef = useRef(viewOffset); 
  const scaleRef = useRef(scale);
  const cursorSmoothRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const onShowToastRef = useRef(onShowToast);

  // Sync refs
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { controllerRef.current = controller; }, [controller]);
  useEffect(() => { viewOffsetRef.current = viewOffset; }, [viewOffset]);
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { onShowToastRef.current = onShowToast; }, [onShowToast]);

  useEffect(() => {
    let intervalId: any;
    let cameraStream: MediaStream | null = null;

    const startCamera = async () => {
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ 
               video: { width: 640, height: 480 } 
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = cameraStream;
                
                GestureService.connect(
                    (data: GesturePrediction) => {
                        if (data.gesture === 'no_hand' || !data.wrist) return;

                        // Normalize based on backend camera resolution (640x480)
                        const normX = data.wrist.x / 640;
                        const normY = data.wrist.y / 480;

                        // Mirror X for intuitive control
                        const targetX = (1 - normX) * window.innerWidth;
                        const targetY = normY * window.innerHeight;

                        // Apply Smoothing
                        cursorSmoothRef.current.x = lerp(cursorSmoothRef.current.x, targetX, LERP_FACTOR);
                        cursorSmoothRef.current.y = lerp(cursorSmoothRef.current.y, targetY, LERP_FACTOR);

                        setGestureCursor({ 
                            x: cursorSmoothRef.current.x, 
                            y: cursorSmoothRef.current.y, 
                            shape: data.gesture 
                        });

                        handleGestureMechanics(data.gesture, cursorSmoothRef.current.x, cursorSmoothRef.current.y);
                    },
                    () => onShowToastRef.current("Gesture control active", "success"),
                    (err) => onShowToastRef.current("Connection error", "error")
                );

                // Use a stable interval for sending frames (approx 10 FPS)
                intervalId = setInterval(() => {
                    if (videoRef.current?.readyState === 4) {
                        GestureService.sendFrame(videoRef.current);
                    }
                }, 100);
            }
        } catch (err) {
            setIsCameraActive(false);
            onShowToastRef.current("Camera blocked", "error");
        }
    };

    if (isCameraActive) {
      startCamera();
    } else {
      GestureService.disconnect();
      setGestureCursor(null);
    }

    return () => {
        clearInterval(intervalId);
        GestureService.disconnect();
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
        }
    };
  }, [isCameraActive]);

  const handleGestureMechanics = (shape: HandShape, screenX: number, screenY: number) => {
      const now = Date.now();
      const COOLDOWN = 600;

      const svgEl = document.getElementById('diagram-canvas-svg');
      if (!svgEl) return;
      const rect = svgEl.getBoundingClientRect();

      // Project screen coordinates to world coordinates
      const worldX = (screenX - rect.left - viewOffsetRef.current.x) / scaleRef.current;
      const worldY = (screenY - rect.top - viewOffsetRef.current.y) / scaleRef.current;

      const target = stateRef.current.nodes.find(n => 
          worldX >= n.x && worldX <= n.x + 120 &&
          worldY >= n.y && worldY <= n.y + 60
      );

      setHoveredNodeId(target ? target.id : null);

      switch(shape) {
          case 'thumbs_up':
              if (now - lastActionTimeRef.current > COOLDOWN) {
                  controllerRef.current.addNode(worldX - 60, worldY - 30);
                  lastActionTimeRef.current = now;
              }
              break;
          case 'thumbs_down':
              if (now - lastActionTimeRef.current > COOLDOWN) {
                  const sel = stateRef.current.selectedNodeId;
                  if (sel) controllerRef.current.deleteNode(sel);
                  lastActionTimeRef.current = now;
              }
              break;
          case 'rock':
              if (now - lastActionTimeRef.current > COOLDOWN && target) {
                  const start = stateRef.current.pendingConnectionStartId;
                  if (!start) controllerRef.current.startConnection(target.id);
                  else if (start !== target.id) controllerRef.current.completeConnection(target.id);
                  lastActionTimeRef.current = now;
              }
              break;
          case 'fist':
              const selectedId = stateRef.current.selectedNodeId;
              if (!selectedId && target) {
                  controllerRef.current.selectNode(target.id);
              } else if (selectedId) {
                  controllerRef.current.updateNodePosition(selectedId, worldX - 60, worldY - 30);
              }
              break;
          case 'pointing':
              if (now - lastActionTimeRef.current > 400 && target) {
                  controllerRef.current.selectNode(target.id);
                  lastActionTimeRef.current = now;
              }
              break;
          default:
              break;
      }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    const worldX = (localX - viewOffset.x) / scale;
    const worldY = (localY - viewOffset.y) / scale;
    
    const zoom = -e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.1, scale + zoom), 5);
    
    setViewOffset({ 
        x: localX - worldX * newScale, 
        y: localY - worldY * newScale 
    });
    setScale(newScale);
  };

  return (
    <div className="flex-grow bg-gray-50 dark:bg-gray-950 overflow-hidden relative select-none transition-colors duration-300">
      <svg
        id="diagram-canvas-svg"
        className={`w-full h-full ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onWheel={handleWheel}
        onMouseDown={e => {
            if (e.button === 0 && (e.target as Element).tagName === 'svg') {
                setIsPanning(true);
                setPanStart({ x: e.clientX, y: e.clientY });
            }
        }}
        onMouseMove={e => {
            if (isPanning) {
                setViewOffset(prev => ({ x: prev.x + (e.clientX - panStart.x), y: prev.y + (e.clientY - panStart.y) }));
                setPanStart({ x: e.clientX, y: e.clientY });
            }
        }}
        onMouseUp={() => setIsPanning(false)}
      >
        <defs>
          <pattern id="grid" x={viewOffset.x} y={viewOffset.y} width="40" height="40" patternUnits="userSpaceOnUse" patternTransform={`scale(${scale})`}>
            <path d="M 40 0 L 0 0 0 40" fill="none" className="stroke-gray-200 dark:stroke-gray-800" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        <g transform={`translate(${viewOffset.x}, ${viewOffset.y}) scale(${scale})`}>
            {state.connections.map(conn => (
                <ConnectionComponent
                    key={conn.id}
                    id={conn.id}
                    fromNode={state.nodes.find(n => n.id === conn.from)}
                    toNode={state.nodes.find(n => n.id === conn.to)}
                    isSelected={state.selectedConnectionId === conn.id}
                    onSelect={controller.selectConnection}
                />
            ))}

            {state.pendingConnectionStartId && gestureCursor && (
                 <line 
                    stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" pointerEvents="none"
                    x1={state.nodes.find(n => n.id === state.pendingConnectionStartId)!.x + 60}
                    y1={state.nodes.find(n => n.id === state.pendingConnectionStartId)!.y + 30}
                    x2={(gestureCursor.x - (document.getElementById('diagram-canvas-svg')?.getBoundingClientRect().left || 0) - viewOffset.x) / scale}
                    y2={(gestureCursor.y - (document.getElementById('diagram-canvas-svg')?.getBoundingClientRect().top || 0) - viewOffset.y) / scale}
                />
            )}

            {state.nodes.map(node => (
                <NodeComponent
                    key={node.id}
                    node={node}
                    isSelected={state.selectedNodeId === node.id || hoveredNodeId === node.id}
                    isConnectionStart={state.pendingConnectionStartId === node.id}
                    onMouseDown={() => controller.selectNode(node.id)}
                    onClick={() => {}}
                    onUpdateLabel={controller.updateNodeLabel}
                />
            ))}
        </g>
      </svg>

      {isCameraActive && gestureCursor && (
        <div 
            className="absolute pointer-events-none z-50 flex flex-col items-center transition-all duration-75 ease-linear"
            style={{ left: gestureCursor.x, top: gestureCursor.y, transform: 'translate(-50%, -50%)' }}
        >
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl shadow-2xl backdrop-blur-md transition-all
                ${gestureCursor.shape === 'fist' ? 'bg-blue-600 border-white scale-110' : 
                  gestureCursor.shape === 'thumbs_up' ? 'bg-green-500 border-white' : 
                  gestureCursor.shape === 'thumbs_down' ? 'bg-red-500 border-white' :
                  gestureCursor.shape === 'rock' ? 'bg-purple-500 border-white' :
                  'bg-white/50 border-blue-500'}
            `}>
               {gestureCursor.shape === 'thumbs_up' && '👍'}
               {gestureCursor.shape === 'thumbs_down' && '👎'}
               {gestureCursor.shape === 'rock' && '🤘'}
               {gestureCursor.shape === 'fist' && '✊'}
               {gestureCursor.shape === 'pointing' && '☝️'} 
               {gestureCursor.shape === 'palm_open' && '✋'}
            </div>
            <div className="mt-1 bg-black/80 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                {gestureCursor.shape.toUpperCase().replace('_', ' ')}
            </div>
        </div>
      )}

      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-3 z-50">
        <div className={`transition-all duration-300 overflow-hidden bg-black rounded-xl border-2 border-green-500 shadow-2xl ${isCameraActive ? 'w-48 h-36 mb-2' : 'w-0 h-0'}`}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
            <div className="absolute top-1 left-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        </div>
        <button 
            onClick={() => setIsCameraActive(!isCameraActive)} 
            className={`w-12 h-12 rounded-full shadow-lg border flex items-center justify-center transition-all active:scale-95
                ${isCameraActive ? 'bg-red-500 text-white border-transparent' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200'}
            `}
        >
            {isCameraActive ? '✕' : '📷'}
        </button>
      </div>
    </div>
  );
};
