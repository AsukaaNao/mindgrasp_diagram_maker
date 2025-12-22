import React, { useState, useRef, useEffect } from 'react';
import { DiagramController, DiagramState, HandShape, GesturePrediction } from '../types';
import { NodeComponent } from './NodeComponent';
import { ConnectionComponent } from './ConnectionComponent';
import { GestureService } from '../services/gestureBackend';

const LERP_FACTOR = 0.2; 
const GESTURE_FPS = 10; 
const HITBOX_PADDING = 25; // Extra pixels around nodes for easier targeting

const lerp = (start: number, end: number, factor: number) => {
  return start + (end - start) * factor;
};

interface CanvasProps {
  controller: DiagramController;
  state: DiagramState;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  isSaving?: boolean;
  onSave?: () => void;
}

export const Canvas: React.FC<CanvasProps> = ({ controller, state, onShowToast, isSaving, onSave }) => {
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [gestureCursor, setGestureCursor] = useState<{x: number, y: number, shape: HandShape} | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [actionPulse, setActionPulse] = useState<{x: number, y: number} | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const stateRef = useRef(state);
  const controllerRef = useRef(controller);
  const lastActionTimeRef = useRef(0);
  const viewOffsetRef = useRef(viewOffset); 
  const scaleRef = useRef(scale);
  const cursorSmoothRef = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const onShowToastRef = useRef(onShowToast);

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
                        if (data.gesture === 'no_hand' || !data.wrist) {
                            setGestureCursor(null);
                            return;
                        }

                        const normX = data.wrist.x / 640;
                        const normY = data.wrist.y / 480;
                        const targetX = (1 - normX) * window.innerWidth;
                        const targetY = normY * window.innerHeight;

                        cursorSmoothRef.current.x = lerp(cursorSmoothRef.current.x, targetX, LERP_FACTOR);
                        cursorSmoothRef.current.y = lerp(cursorSmoothRef.current.y, targetY, LERP_FACTOR);

                        setGestureCursor({ 
                            x: cursorSmoothRef.current.x, 
                            y: cursorSmoothRef.current.y, 
                            shape: data.gesture 
                        });

                        handleGestureMechanics(data.gesture, cursorSmoothRef.current.x, cursorSmoothRef.current.y);
                    },
                    () => onShowToastRef.current("Vision Tracking Enabled", "success"),
                    () => onShowToastRef.current("Vision Link Interrupted", "error")
                );

                intervalId = setInterval(() => {
                    if (videoRef.current?.readyState === 4) {
                        GestureService.sendFrame(videoRef.current);
                    }
                }, 1000 / GESTURE_FPS);
            }
        } catch (err) {
            setIsCameraActive(false);
            onShowToastRef.current("Camera permissions required", "error");
        }
    };

    if (isCameraActive) startCamera();
    else {
      GestureService.disconnect();
      setGestureCursor(null);
    }

    return () => {
        clearInterval(intervalId);
        GestureService.disconnect();
        if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    };
  }, [isCameraActive]);

  const triggerActionPulse = (x: number, y: number) => {
    setActionPulse({ x, y });
    setTimeout(() => setActionPulse(null), 600);
  };

  const handleGestureMechanics = (shape: HandShape, screenX: number, screenY: number) => {
      const now = Date.now();
      const COOLDOWN = 1000; 

      const svgEl = document.getElementById('diagram-canvas-svg');
      if (!svgEl) return;
      const rect = svgEl.getBoundingClientRect();

      const worldX = (screenX - rect.left - viewOffsetRef.current.x) / scaleRef.current;
      const worldY = (screenY - rect.top - viewOffsetRef.current.y) / scaleRef.current;

      // Expanded Node Detection Logic
      const target = stateRef.current.nodes.find(n => 
          worldX >= n.x - HITBOX_PADDING && worldX <= n.x + 120 + HITBOX_PADDING &&
          worldY >= n.y - HITBOX_PADDING && worldY <= n.y + 60 + HITBOX_PADDING
      );

      setHoveredNodeId(target ? target.id : null);

      switch(shape) {
          case 'add':
              if (now - lastActionTimeRef.current > COOLDOWN) {
                  controllerRef.current.addNode(worldX - 60, worldY - 30);
                  triggerActionPulse(screenX, screenY);
                  lastActionTimeRef.current = now;
              }
              break;
          case 'delete':
              if (now - lastActionTimeRef.current > COOLDOWN) {
                  const sel = stateRef.current.selectedNodeId;
                  if (sel) {
                    controllerRef.current.deleteNode(sel);
                    triggerActionPulse(screenX, screenY);
                    lastActionTimeRef.current = now;
                  }
              }
              break;
          case 'connecting':
              if (now - lastActionTimeRef.current > COOLDOWN && target) {
                  const start = stateRef.current.pendingConnectionStartId;
                  if (!start) {
                    controllerRef.current.startConnection(target.id);
                  } else if (start !== target.id) {
                    controllerRef.current.completeConnection(target.id);
                    triggerActionPulse(screenX, screenY);
                  }
                  lastActionTimeRef.current = now;
              }
              break;
          case 'grabbing':
              const selectedId = stateRef.current.selectedNodeId;
              if (!selectedId && target) {
                  controllerRef.current.selectNode(target.id);
              } else if (selectedId) {
                  controllerRef.current.updateNodePosition(selectedId, worldX - 60, worldY - 30);
              }
              break;
          case 'select':
              if (now - lastActionTimeRef.current > 600 && target) {
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
    const zoom = -e.deltaY * 0.0012;
    const newScale = Math.min(Math.max(0.1, scale + zoom), 5);
    setViewOffset({ x: localX - worldX * newScale, y: localY - worldY * newScale });
    setScale(newScale);
  };

  const renderGestureIcon = (shape: HandShape) => {
    switch (shape) {
      case 'add':
        return <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
      case 'delete':
        return <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
      case 'connecting':
        return <div className="w-3.5 h-3.5 rounded-full border-2 border-white/80 animate-[spin_2s_linear_infinite]"></div>;
      case 'grabbing':
        return <div className="w-2.5 h-2.5 bg-white rounded-full"></div>;
      case 'select':
        return <div className="w-1.5 h-1.5 bg-white rounded-full"></div>;
      case '':
        return <div className="w-1.5 h-1.5 bg-white rounded-full"></div>;
      default:
        return null;
    }
  };

  const gestureConfig: Record<string, { color: string, label: string, containerClass?: string }> = {
      add: { color: 'bg-green-500', label: 'CREATE', containerClass: 'border-white scale-110 shadow-lg shadow-green-500/20' },
      delete: { color: 'bg-red-500', label: 'DELETE', containerClass: 'border-white scale-110 shadow-lg shadow-red-500/20' },
      connecting: { color: 'bg-indigo-600', label: 'CONNECT', containerClass: 'border-white/90 scale-105 shadow-lg shadow-indigo-500/20' },
      grabbing: { color: 'bg-blue-600', label: 'MOVE', containerClass: 'border-white scale-110 shadow-lg shadow-blue-500/40' },
      select: { color: 'bg-amber-500', label: 'TARGET', containerClass: 'border-white/90 shadow-lg shadow-amber-500/20' },
      hover: { color: 'bg-white/10', label: 'HOVER', containerClass: 'border-white/20 shadow-md' },
      '': { color: 'bg-black/60 dark:bg-white/20', label: '', containerClass: 'border-white/40 w-5 h-5 ring-1 ring-white/10' }
  };

  const hasSelection = !!(state.selectedNodeId || state.selectedConnectionId);

  return (
    <div className="flex-grow bg-gray-50 dark:bg-gray-950 overflow-hidden relative select-none transition-colors duration-300">
      
      {/* Floating Action Hub */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-1.5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl">
          <button 
            onClick={onSave}
            disabled={isSaving}
            className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest flex items-center gap-2 transition-all
                ${isSaving 
                    ? 'bg-blue-500/20 text-blue-500' 
                    : 'bg-black dark:bg-blue-600 text-white hover:scale-105 hover:shadow-lg'}`}
          >
            {isSaving ? (
                <>
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    SAVING...
                </>
            ) : 'SAVE DIAGRAM'}
          </button>
          
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1"></div>

          <button 
            onClick={() => {
                if(state.selectedNodeId) controller.deleteNode(state.selectedNodeId);
                else if(state.selectedConnectionId) controller.deleteConnection(state.selectedConnectionId);
            }}
            disabled={!hasSelection}
            className={`px-4 py-2 rounded-xl text-xs font-black tracking-widest transition-all
                ${hasSelection 
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white cursor-pointer' 
                    : 'bg-gray-100 dark:bg-gray-800/50 text-gray-300 dark:text-gray-700 cursor-not-allowed'}`}
          >
            DELETE
          </button>
      </div>

      {actionPulse && (
        <div 
          className="absolute z-[60] pointer-events-none w-20 h-20 border-4 border-blue-500 rounded-full animate-ping opacity-75"
          style={{ left: actionPulse.x - 40, top: actionPulse.y - 40 }}
        />
      )}

      <svg
        id="diagram-canvas-svg"
        className={`w-full h-full transition-all duration-300 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'} ${gestureCursor ? 'cursor-none' : ''}`}
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
            <circle cx="1" cy="1" r="1" className="fill-gray-300 dark:fill-gray-800" />
          </pattern>
          <filter id="glow">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
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
                    stroke="#10b981" 
                    strokeWidth="2.5" 
                    strokeDasharray="6,4" 
                    pointerEvents="none"
                    filter="url(#glow)"
                    x1={state.nodes.find(n => n.id === state.pendingConnectionStartId)!.x + 60}
                    y1={state.nodes.find(n => n.id === state.pendingConnectionStartId)!.y + 30}
                    x2={(gestureCursor.x - (document.getElementById('diagram-canvas-svg')?.getBoundingClientRect().left || 0) - viewOffset.x) / scale}
                    y2={(gestureCursor.y - (document.getElementById('diagram-canvas-svg')?.getBoundingClientRect().top || 0) - viewOffset.y) / scale}
                    className="animate-[dash_1s_linear_infinite]"
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

      {/* Modern Vision Cursor HUD */}
      {isCameraActive && gestureCursor && (
        <div 
            className="absolute pointer-events-none z-50 flex flex-col items-center transition-all duration-150 ease-out"
            style={{ left: gestureCursor.x, top: gestureCursor.y, transform: 'translate(-50%, -50%)' }}
        >
            <div className={`
                relative flex items-center justify-center rounded-full border-2 transition-all duration-300
                ${gestureConfig[gestureCursor.shape]?.color || 'bg-white/5'}
                ${gestureConfig[gestureCursor.shape]?.containerClass || 'border-white/10 w-12 h-12'}
            `}>
               {renderGestureIcon(gestureCursor.shape)}
               
               {/* Passive ring decorative elements */}
               {gestureCursor.shape === '' && (
                   <div className="absolute inset-[-4px] border border-white/5 rounded-full animate-pulse"></div>
               )}
            </div>
            
            {gestureConfig[gestureCursor.shape]?.label && (
                <div className="mt-4 px-2 py-0.5 rounded-md bg-black/90 text-white font-black tracking-[0.25em] text-[7px] uppercase border border-white/5 backdrop-blur-md shadow-xl">
                    {gestureConfig[gestureCursor.shape].label}
                </div>
            )}
        </div>
      )}

      {/* HUD Vision Layer */}
      <div className="absolute bottom-6 right-6 flex flex-col items-end gap-4 z-50">
        <div className={`
            transition-all duration-500 ease-in-out overflow-hidden bg-black/95 rounded-3xl border-2 shadow-[0_0_50px_rgba(0,0,0,0.6)] relative
            ${isCameraActive ? 'w-64 h-48 mb-2 scale-100 opacity-100' : 'w-0 h-0 scale-95 opacity-0 translate-y-10'}
            ${gestureCursor?.shape ? 'border-blue-500/40' : 'border-gray-800/50'}
        `}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100 opacity-40 mix-blend-screen" />
            <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 backdrop-blur-md">
                        <div className={`w-2 h-2 rounded-full ${gestureCursor ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-[10px] text-gray-400 font-mono">
                            {gestureCursor ? 'LOCKED' : 'SEARCH'}
                        </span>
                    </div>
                    <div className="text-[9px] text-white/20 font-mono">{GESTURE_FPS}.0 FPS</div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent h-1/2 w-full animate-[scan_3s_linear_infinite]"></div>
            </div>
        </div>

        <button 
            onClick={() => setIsCameraActive(!isCameraActive)} 
            className={`
                group relative w-16 h-16 rounded-full shadow-2xl border flex items-center justify-center transition-all duration-500
                ${isCameraActive 
                    ? 'bg-red-500 text-white border-transparent' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'}
            `}
        >
            {isCameraActive ? (
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            )}
        </button>
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        @keyframes dash {
          to { stroke-dashoffset: -20; }
        }
      `}</style>
    </div>
  );
};