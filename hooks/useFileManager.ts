
import { useState, useCallback, useEffect } from 'react';
import { useDiagram } from './useDiagram';
import { DiagramController, DiagramState, FileManager, FileInfo, DiagramNode, DiagramConnection, SavedFile, ThemeMode } from '../types';
import { generateId } from '../utils/idUtils';
import { firebaseService } from '../services/firebaseService';

const THEME_KEY = 'gestureflow_theme';

export const useFileManager = (): {
  diagramState: DiagramState;
  diagramController: DiagramController;
  fileManager: FileManager;
} => {
  const { state: diagramState, controller: diagramController } = useDiagram();
  const [currentFile, setCurrentFile] = useState<FileInfo | null>(null);
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>([]);
  const [theme, setTheme] = useState<ThemeMode>('light');

  // Load files from Firebase and theme from LocalStorage on mount
  useEffect(() => {
    const loadBackendFiles = async () => {
        const files = await firebaseService.getAllFiles();
        setSavedFiles(files);
    };
    loadBackendFiles();

    // Theme
    try {
      const storedTheme = localStorage.getItem(THEME_KEY) as ThemeMode;
      if (storedTheme === 'dark' || storedTheme === 'light') {
        setTheme(storedTheme);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
    } catch (e) {
      console.warn("Theme load failed", e);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
        const newTheme = prev === 'light' ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, newTheme);
        return newTheme;
    });
  }, []);

  const createNewFile = useCallback(() => {
    diagramController.clearDiagram();
    // We don't save to backend immediately, only when user clicks Save.
    setCurrentFile({
      id: generateId(),
      name: 'Untitled Diagram',
      lastModified: Date.now(),
    });
  }, [diagramController]);

  const openFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json.nodes) && Array.isArray(json.connections)) {
          diagramController.loadDiagram(json);
          setCurrentFile({
            id: generateId(), // New ID for imported file
            name: file.name.replace('.json', ''),
            lastModified: file.lastModified,
          });
        } else {
          alert('Invalid file format: Missing nodes or connections array.');
        }
      } catch (err) {
        alert('Error parsing JSON file.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  }, [diagramController]);

  const loadSavedFile = useCallback((savedFile: SavedFile) => {
    diagramController.loadDiagram(savedFile.data);
    setCurrentFile(savedFile.info);
  }, [diagramController]);

  const saveToBrowser = useCallback(async () => {
    if (!currentFile) return;

    const currentState = diagramController.getState();
    const data = {
      nodes: currentState.nodes,
      connections: currentState.connections,
    };

    const updatedInfo = {
        ...currentFile,
        lastModified: Date.now()
    };
    setCurrentFile(updatedInfo);

    const newSavedFile: SavedFile = {
        id: currentFile.id,
        info: updatedInfo,
        data: data
    };

    // Optimistic Update
    const existingIndex = savedFiles.findIndex(f => f.id === currentFile.id);
    let newFilesList;
    if (existingIndex >= 0) {
        newFilesList = [...savedFiles];
        newFilesList[existingIndex] = newSavedFile;
    } else {
        newFilesList = [newSavedFile, ...savedFiles];
    }
    setSavedFiles(newFilesList);

    // Save to Firebase
    // Let the component handle errors
    await firebaseService.saveFile(newSavedFile);
  }, [currentFile, diagramController, savedFiles]);

  const downloadJson = useCallback(() => {
    if (!currentFile) return;
    
    const currentState = diagramController.getState();
    const data = {
      nodes: currentState.nodes,
      connections: currentState.connections,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentFile.name}.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentFile, diagramController]);

  const renameFile = useCallback((newName: string) => {
    setCurrentFile((prev) => (prev ? { ...prev, name: newName } : null));
  }, []);

  const closeFile = useCallback(() => {
    diagramController.clearDiagram();
    setCurrentFile(null);
  }, [diagramController]);

  const deleteSavedFile = useCallback(async (id: string) => {
      // Optimistic delete
      setSavedFiles(prev => prev.filter(f => f.id !== id));
      
      // Let component handle error
      await firebaseService.deleteFile(id);
  }, []);

  return {
    diagramState,
    diagramController,
    fileManager: {
      currentFile,
      savedFiles,
      theme,
      createNewFile,
      openFile,
      saveToBrowser,
      downloadJson,
      renameFile,
      closeFile,
      loadSavedFile,
      deleteSavedFile,
      toggleTheme
    },
  };
};
