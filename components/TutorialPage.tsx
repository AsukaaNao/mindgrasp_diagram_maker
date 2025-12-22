import React from 'react';

interface TutorialPageProps {
  onBack: () => void;
}

interface GestureItem {
  name: string;
  gestureName: string;
  description: string;
  color: string;
  imageUrl: string;
}

export const TutorialPage: React.FC<TutorialPageProps> = ({ onBack }) => {
  // Generic high-quality tech/hand-tracking placeholder
  const dummyGestureImage = "https://images.unsplash.com/photo-1589149062358-8e96a3466104?auto=format&fit=crop&q=80&w=600";
  const dummySetupImage = "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800";

  const gestures: GestureItem[] = [
    {
      name: 'Create Node',
      gestureName: 'OK Sign',
      description: 'The standard OK sign. Pinch your index and thumb while keeping other fingers up to drop a new node at the cursor.',
      color: 'bg-green-500',
      imageUrl: "https://images.unsplash.com/photo-1516733968668-dbdce39c46ef?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: 'Delete Item',
      gestureName: 'Pinch-Pinky',
      description: 'Precision Pinch. Close your index and thumb (middle finger closed too) with pinky raised to remove selected items.',
      color: 'bg-red-500',
      imageUrl: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: 'Connect Nodes',
      gestureName: 'Horns',
      description: 'The Horns gesture. Raise your index and pinky. Hover over a node to start a connection, then move to a target node.',
      color: 'bg-indigo-600',
      imageUrl: "https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: 'Move Node',
      gestureName: 'Fist',
      description: 'The Fist gesture. Close all fingers tight while hovering over a node to grab it. Move your hand to reposition.',
      color: 'bg-blue-600',
      imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: 'Pick / Select',
      gestureName: 'Point',
      description: 'Point. Use your index finger to target and click nodes or connections on the canvas.',
      color: 'bg-amber-500',
      imageUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=400"
    },
    {
      name: 'Scan / Hover',
      gestureName: 'Open Hand',
      description: 'Open Hand. Keep your hand flat and open to move the cursor freely across the workspace without triggering actions.',
      color: 'bg-gray-400',
      imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=400"
    },
  ];

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gray-950 flex flex-col overflow-y-auto font-sans transition-colors duration-300">
      
      {/* Header */}
      <header className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h1 className="text-xl font-bold dark:text-white uppercase tracking-tighter">MindGrasp Documentation</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-8 py-12">
        
        {/* Intro Section */}
        <section className="mb-16 text-center">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight uppercase">Vision Control Interface</h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
            GestureFlow integrates advanced computer vision to facilitate spatial diagramming. 
            Enable the camera to activate gesture-based manipulation.
          </p>
        </section>

        {/* Setup Steps */}
        <section className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-bold text-xl mb-6">01</div>
            <h3 className="text-xl font-bold dark:text-white mb-3 uppercase tracking-wide">Camera Activation</h3>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              Locate the Camera icon in the workspace footer. Grant access to initialize the neural tracking engine.
            </p>
            <img 
              src={dummySetupImage} 
              alt="Setup Step 1" 
              className="mt-auto aspect-video rounded-2xl object-cover border border-gray-200 dark:border-gray-800 grayscale hover:grayscale-0 transition-all duration-500"
            />
          </div>

          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center font-bold text-xl mb-6">02</div>
            <h3 className="text-xl font-bold dark:text-white mb-3 uppercase tracking-wide">Active Calibration</h3>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              Maintain your hand within the optical frame. The cursor will lock onto your spatial coordinates automatically.
            </p>
            <img 
              src={dummyGestureImage} 
              alt="Setup Step 2" 
              className="mt-auto aspect-video rounded-2xl object-cover border border-gray-200 dark:border-gray-800 grayscale hover:grayscale-0 transition-all duration-500"
            />
          </div>
        </section>

        {/* Gesture Dictionary */}
        <section>
          <div className="flex items-center gap-3 mb-10">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
            <h3 className="text-sm font-black text-gray-400 dark:text-gray-500 tracking-[0.4em] uppercase">Gesture Dictionary</h3>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {gestures.map((g) => (
              <div key={g.name} className="flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2rem] overflow-hidden hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all shadow-sm group">
                <div className="h-56 relative overflow-hidden">
                  <img 
                    src={g.imageUrl} 
                    alt={g.name} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-100 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 ${g.color} mix-blend-overlay opacity-20`}></div>
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-black/80 text-white text-[10px] font-black uppercase tracking-widest rounded-full backdrop-blur-md">
                      Pose: {g.gestureName}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h4 className="text-xl font-black dark:text-white mb-2 uppercase tracking-tight">
                    {g.name}
                  </h4>
                  <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                    {g.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tips Section */}
        <section className="mt-20 p-10 bg-black dark:bg-gray-900 rounded-[3rem] text-white shadow-2xl border border-white/5 relative overflow-hidden group">
          <div className="flex items-start gap-6 relative z-10">
            <div className="bg-white/10 p-3 rounded-2xl">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3 uppercase tracking-tighter">Operational Parameters</h3>
              <p className="text-white/60 text-lg leading-relaxed max-w-2xl">
                Optimize lighting and maintain a clear line of sight. Avoid complex backgrounds to ensure high-fidelity hand tracking and minimized latency.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-20 text-center py-16 border-t border-gray-100 dark:border-gray-900">
           <button 
             onClick={onBack}
             className="px-12 py-4 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest rounded-2xl shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1 transition-all active:scale-95"
           >
             Initialize Interface
           </button>
        </footer>
      </main>
    </div>
  );
};