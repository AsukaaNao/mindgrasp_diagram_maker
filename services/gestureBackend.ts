import { GesturePrediction } from '../types';

let socket: WebSocket | null = null;
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

const WS_URL = 'ws://103.253.145.149:8000/ws/gesture/'; 

export const GestureService = {
  connect: (
    onPrediction: (data: GesturePrediction) => void,
    onConnected: () => void,
    onError: (err: Event) => void
  ) => {
    // If we are already connected or connecting to the SAME URL, don't restart
    if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
      console.log('Gesture WebSocket already active or connecting');
      return;
    }

    if (socket) {
      socket.close();
    }
    
    try {
        socket = new WebSocket(WS_URL);
        
        socket.onopen = () => {
            console.log('Gesture WebSocket Connected');
            onConnected();
        };
        
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data && data.wrist && typeof data.wrist.x === 'number') {
                    onPrediction(data as GesturePrediction);
                }
            } catch (e) {
                console.error('Failed to parse backend response', e);
            }
        };

        socket.onerror = (e) => {
          console.error('WebSocket Error:', e);
          onError(e);
        };
        
        socket.onclose = (e) => {
          console.log('Gesture WebSocket Closed:', e.code, e.reason);
        };
    } catch (e) {
        console.error("Failed to initialize WebSocket", e);
    }
  },

  disconnect: () => {
    if (socket) {
        // Only close if it's not already closed
        if (socket.readyState !== WebSocket.CLOSED && socket.readyState !== WebSocket.CLOSING) {
          socket.close();
        }
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
        
        // JPEG compression helps significantly with throughput
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        
        try {
          socket.send(JSON.stringify({ 
              frame: dataUrl
          }));
        } catch (err) {
          console.error("Failed to send socket frame:", err);
        }
    }
  }
};
