import { GesturePrediction, HandShape } from '../types';

let socket: WebSocket | null = null;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

const WS_URL = 'https://mindgrasp.online:8000/ws/gesture/'; 

// Gestures that trigger specific actions
const ACTION_GESTURES: HandShape[] = ['add', 'delete', 'connecting', 'hover', 'grabbing', 'select'];

export const GestureService = {
  connect: (
    onPrediction: (data: GesturePrediction) => void,
    onConnected: () => void,
    onError: (err: Event) => void
  ) => {
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (socket) socket.close();
    
    try {
        socket = new WebSocket(WS_URL);
        
        socket.onopen = () => {
            console.log('Gesture WebSocket Connected');
            onConnected();
        };
        
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data && data.wrist) {
                    const rawGesture = data.gesture;
                    
                    let sanitizedGesture: HandShape = 'no_hand';
                    
                    if (rawGesture === 'no_hand') {
                      sanitizedGesture = 'no_hand';
                    } else if (rawGesture === '' || !ACTION_GESTURES.includes(rawGesture as HandShape)) {
                      // Hand is detected, but gesture is unknown or empty
                      sanitizedGesture = '';
                    } else {
                      sanitizedGesture = rawGesture as HandShape;
                    }
                        
                    onPrediction({
                        gesture: sanitizedGesture,
                        wrist: data.wrist
                    });
                }
            } catch (e) {
                console.error('Failed to parse backend response', e);
            }
        };

        socket.onerror = (e) => onError(e);
        socket.onclose = () => console.log('Gesture WebSocket Closed');
    } catch (e) {
        console.error("Failed to initialize WebSocket", e);
    }
  },

  disconnect: () => {
    if (socket) {
        if (socket.readyState !== WebSocket.CLOSED) socket.close();
        socket = null;
    }
  },

  sendFrame: (video: HTMLVideoElement) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;

    if (!canvas) {
        canvas = document.createElement('canvas');
        ctx = canvas.getContext('2d', { willReadFrequently: true });
    }

    if (canvas && ctx) {
        if (canvas.width !== 640) {
            canvas.width = 640;
            canvas.height = 480;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Reduced quality to 0.3 for significantly faster transmission and lower latency
        const dataUrl = canvas.toDataURL('image/jpeg', 0.3);
        
        try {
          socket.send(JSON.stringify({ frame: dataUrl }));
        } catch (err) {
          console.error("Socket send error", err);
        }
    }
  }
};