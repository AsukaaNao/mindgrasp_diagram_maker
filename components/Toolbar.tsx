import React, { useRef, useState, useEffect } from 'react';
import { FileManager, DiagramState, DiagramController } from '../types';

interface ToolbarProps {
  fileManager: FileManager;
  diagramState?: DiagramState;
  diagramController?: DiagramController;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ fileManager, diagramState, diagramController, onShowToast }) => {
  const { currentFile, saveToBrowser, downloadJson, closeFile, renameFile, openFile, toggleTheme, theme } = fileManager;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentFile) {
        setTempName(currentFile.name);
    }
  }, [currentFile]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleNameBlur = () => {
    setIsEditingName(false);
    if (tempName.trim()) {
        renameFile(tempName.trim());
    } else {
        setTempName(currentFile?.name || '');
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleNameBlur();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) openFile(file);
    e.target.value = ''; 
  };

  const handleDelete = () => {
      if (!diagramState || !diagramController) return;
      if (diagramState.selectedNodeId) {
          diagramController.deleteNode(diagramState.selectedNodeId);
          onShowToast('Node deleted', 'info');
      } else if (diagramState.selectedConnectionId) {
          diagramController.deleteConnection(diagramState.selectedConnectionId);
          onShowToast('Connection removed', 'info');
      }
  };

  const handleSave = async () => {
      if (!currentFile) return;
      setIsSaving(true);
      try {
          await saveToBrowser();
          onShowToast('Diagram saved successfully', 'success');
      } catch (err) {
          console.error(err);
          onShowToast('Failed to save diagram', 'error');
      } finally {
          setIsSaving(false);
      }
  };

  const handleDownloadJson = () => {
      try {
          downloadJson();
          onShowToast('JSON downloaded', 'success');
      } catch (e) {
          onShowToast('Download failed', 'error');
      }
  };

  const handleExportSvg = () => {
    const svgElement = document.getElementById('diagram-canvas-svg');
    if (!svgElement) return;

    try {
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svgElement);
        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
          source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = currentFile ? `${currentFile.name}.svg` : 'diagram.svg';
        a.click();
        URL.revokeObjectURL(url);
        onShowToast('SVG Exported', 'success');
    } catch (e) {
        onShowToast('Export failed', 'error');
    }
  };

  const hasSelection = diagramState?.selectedNodeId || diagramState?.selectedConnectionId;

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between shadow-sm z-50 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button 
            onClick={closeFile}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium text-sm flex items-center gap-1 transition-colors"
        >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Dashboard
        </button>
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
        
        <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider leading-none mb-0.5">
                Editing
            </span>
            {isEditingName ? (
                <input 
                    ref={nameInputRef}
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={handleNameBlur}
                    onKeyDown={handleNameKeyDown}
                    className="text-sm font-bold text-gray-900 dark:text-white border-b border-black dark:border-white outline-none p-0 bg-transparent min-w-[200px]"
                />
            ) : (
                <div 
                    onClick={() => setIsEditingName(true)}
                    className="text-sm font-bold text-gray-900 dark:text-white cursor-text hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-1 -ml-1 transition-colors"
                >
                    {currentFile?.name || 'Untitled'}
                </div>
            )}
        </div>
      </div>

      <div className="flex gap-2 items-center">
        
        {/* Theme Toggle */}
        <button 
            onClick={toggleTheme}
            className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white mr-2 transition-colors"
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
            {theme === 'dark' ? (
                // Sun Icon
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ) : (
                // Moon Icon
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
            )}
        </button>

        <button
            onClick={handleDelete}
            disabled={!hasSelection}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition flex items-center gap-2 mr-2 uppercase tracking-wide
                ${hasSelection 
                    ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900' 
                    : 'text-gray-300 dark:text-gray-600 border border-transparent cursor-not-allowed'}`}
        >
            Delete Item
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-4 py-2 bg-black dark:bg-blue-600 text-white hover:bg-gray-800 dark:hover:bg-blue-500 rounded-lg text-sm font-medium transition shadow-sm hover:shadow flex items-center gap-2
            ${isSaving ? 'opacity-75 cursor-wait' : ''}
          `}
        >
          {isSaving && <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <div className="flex gap-1">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
            
            <button
                onClick={handleDownloadJson}
                className="px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium transition"
                title="Download JSON"
            >
                JSON
            </button>
            <button
                onClick={handleExportSvg}
                className="px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium transition"
                title="Export SVG"
            >
                SVG
            </button>
        </div>
      </div>
    </div>
  );
};