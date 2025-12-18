
import React, { useState } from 'react';
import { useFileManager } from './hooks/useFileManager';
import { LandingPage } from './components/LandingPage';
import { Toolbar } from './components/Toolbar';
import { Canvas } from './components/Canvas';
import { ToastContainer, Toast } from './components/Feedback';

const App: React.FC = () => {
  const { diagramState, diagramController, fileManager } = useFileManager();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className={`${fileManager.theme === 'dark' ? 'dark' : ''} h-full w-full`}>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <div className="flex flex-col h-full w-full bg-white dark:bg-gray-950 transition-colors duration-300">
        
        {!fileManager.currentFile ? (
          <LandingPage fileManager={fileManager} onShowToast={addToast} />
        ) : (
          <>
            <Toolbar 
              fileManager={fileManager} 
              diagramState={diagramState} 
              diagramController={diagramController} 
              onShowToast={addToast}
            />
            <Canvas 
              controller={diagramController} 
              state={diagramState} 
              onShowToast={addToast}
            />
          </>
        )}

      </div>
    </div>
  );
};

export default App;
