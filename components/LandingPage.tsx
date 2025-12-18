import React, { useRef, useState } from 'react';
import { FileManager, SavedFile } from '../types';
import { ConfirmationModal } from './Feedback';

interface LandingPageProps {
  fileManager: FileManager;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ fileManager, onShowToast }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modal State
  const [fileToDelete, setFileToDelete] = useState<SavedFile | null>(null);

  const handleOpenClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      fileManager.openFile(file);
    }
    e.target.value = '';
  };

  const filteredFiles = fileManager.savedFiles.filter(file => 
    file.info.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const confirmDelete = async () => {
      if (fileToDelete) {
          try {
              await fileManager.deleteSavedFile(fileToDelete.id);
              onShowToast('File deleted successfully', 'success');
          } catch (error) {
              onShowToast('Failed to delete file', 'error');
          }
          setFileToDelete(null);
      }
  };

  return (
    <div className="h-full w-full flex text-gray-800 dark:text-gray-100 font-sans bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      
      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={!!fileToDelete}
        title="Delete Diagram?"
        message={`Are you sure you want to delete "${fileToDelete?.info.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setFileToDelete(null)}
      />

      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col flex-shrink-0 transition-colors duration-300">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-black dark:bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">G</div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-blue-400 dark:to-purple-500">
              GestureFlow
            </h1>
          </div>

          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-md text-sm font-medium border border-transparent dark:border-white/5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
                All Files
            </button>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-gray-200 dark:border-gray-800">
           <div className="text-xs text-gray-400 font-medium mb-2">STORAGE</div>
           <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
             <div className="h-full bg-gray-800 dark:bg-blue-500 w-[10%] rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
           </div>
           <div className="mt-2 text-xs text-gray-500">{fileManager.savedFiles.length} files saved</div>
           
           <button 
             onClick={fileManager.toggleTheme}
             className="mt-6 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
           >
              {fileManager.theme === 'dark' ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Light Mode
                  </>
              ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    Dark Mode
                  </>
              )}
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Futuristic Background Element for Dark Mode */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 dark:opacity-100 transition-opacity duration-500">
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[128px]"></div>
            <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[128px]"></div>
        </div>

        {/* Top Header */}
        <div className="h-16 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-8 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md flex-shrink-0 z-10 transition-colors duration-300">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-full max-w-md group">
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input 
                        type="text" 
                        placeholder="Search files..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-900 border-none rounded-lg text-sm focus:ring-2 focus:ring-gray-200 dark:focus:ring-blue-500/50 outline-none transition-all dark:text-white dark:placeholder-gray-600"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                <button 
                    onClick={handleOpenClick}
                    className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg transition-colors"
                >
                    Import
                </button>
                <button 
                    onClick={fileManager.createNewFile}
                    className="px-4 py-2 text-sm font-medium text-white bg-black dark:bg-blue-600 hover:bg-gray-800 dark:hover:bg-blue-500 rounded-lg shadow-sm transition-all hover:shadow-md active:scale-95 dark:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                >
                    + New Diagram
                </button>
            </div>
        </div>

        {/* File Grid/List */}
        <div className="flex-1 overflow-y-auto p-8 z-10">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
                <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm' : 'text-gray-400'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm' : 'text-gray-400'}`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                </div>
            </div>

            {filteredFiles.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <h3 className="text-gray-900 dark:text-white font-medium">No diagrams found</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Create a new diagram to get started.</p>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" : "space-y-3"}>
                    {filteredFiles.map((file) => (
                        <FileCard 
                            key={file.id} 
                            file={file} 
                            viewMode={viewMode}
                            onOpen={() => fileManager.loadSavedFile(file)}
                            onDelete={() => setFileToDelete(file)}
                            dateStr={formatDate(file.info.lastModified)}
                        />
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

interface FileCardProps {
    file: SavedFile;
    viewMode: 'grid' | 'list';
    onOpen: () => void;
    onDelete: () => void;
    dateStr: string;
}

const FileCard: React.FC<FileCardProps> = ({ file, viewMode, onOpen, onDelete, dateStr }) => {
    const nodeCount = file.data.nodes.length;
    
    if (viewMode === 'list') {
        return (
            <div 
                onClick={onOpen}
                className="group flex items-center justify-between p-4 bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800 rounded-lg hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-sm transition-all cursor-pointer backdrop-blur-sm"
            >
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{file.info.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{dateStr} • {nodeCount} nodes</p>
                    </div>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>
        );
    }

    // Grid View Card (Futuristic Look)
    return (
        <div 
            className="group relative bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] hover:border-blue-300 dark:hover:border-blue-500/50 transition-all duration-300 cursor-pointer flex flex-col backdrop-blur-sm"
            onClick={onOpen}
        >
            {/* Thumbnail Placeholder */}
            <div className="h-32 bg-gray-50 dark:bg-gray-950/50 flex items-center justify-center relative overflow-hidden group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/10 transition-colors">
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-10" style={{backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)', backgroundSize: '10px 10px', color: 'gray'}}></div>
                {nodeCount > 0 ? (
                    <div className="scale-50 opacity-40 dark:opacity-60 grayscale group-hover:grayscale-0 transition-all dark:text-blue-300">
                        <div className="flex gap-4 items-center">
                            <div className="w-12 h-8 border-2 border-current rounded bg-white dark:bg-gray-900"></div>
                            <div className="w-8 h-0.5 bg-current"></div>
                            <div className="w-12 h-8 border-2 border-current rounded bg-white dark:bg-gray-900"></div>
                        </div>
                    </div>
                ) : (
                    <span className="text-gray-300 dark:text-gray-600 text-xs font-medium">Empty</span>
                )}
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{file.info.name}</h3>
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider">{dateStr}</span>
                    <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">{nodeCount} Nodes</span>
                </div>
            </div>

            {/* Delete Action Overlay */}
            <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-800 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 border border-gray-100 dark:border-gray-700 shadow-sm rounded-md opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100"
                title="Delete File"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
        </div>
    );
};