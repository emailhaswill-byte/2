
import React, { useState, useEffect } from 'react';
import { AnalysisState, SavedRock, RockAnalysis } from './types';
import { identifyRock } from './services/geminiService';
import { ImageUploader } from './components/ImageUploader';
import { AnalysisResult } from './components/AnalysisResult';
import { Achievements } from './components/Achievements';
import { Loader2, Pickaxe, BookOpen, ArrowLeft, Trash2, Lightbulb, Filter, Sun, Aperture, Maximize, MapPin } from 'lucide-react';

const ROCK_FACTS = [
  "Hematite is the primary ore of iron and often appears metallic gray or rusty red.",
  "Obsidian is natural volcanic glass formed when lava cools too quickly for crystals to grow.",
  "Diamonds are the hardest known natural material, scoring a perfect 10 on the Mohs scale.",
  "Quartz is the most common mineral found on Earth's continental crust.",
  "Gold is so malleable that one ounce can be stretched into a wire 50 miles long.",
  "Pumice is a volcanic rock so full of gas bubbles that it can float on water.",
  "Amethyst is actually a purple variety of quartz, colored by irradiation and iron impurities.",
  "Lapis Lazuli was ground up by Renaissance painters to make the pigment ultramarine.",
  "Halite is the mineral name for common table salt (sodium chloride).",
  "Bismuth crystals naturally form iridescent, stair-step patterns due to oxidation and growth rates.",
  "Opal is a hydrated amorphous form of silica and can contain up to 21% water.",
  "Magnetite is naturally magnetic and was used as the first compass by ancient civilizations.",
  "Talc is the softest known mineral, defining the value of 1 on the Mohs hardness scale.",
  "Pyrite is often called 'Fool's Gold' because of its metallic luster and pale brass-yellow hue.",
  "Geodes look like plain rocks on the outside but contain hollow cavities lined with crystals inside."
];

const FILTER_CATEGORIES = ['All', 'Igneous', 'Sedimentary', 'Metamorphic', 'Mineral'];

const App: React.FC = () => {
  const [view, setView] = useState<'scan' | 'library'>('scan');
  const [state, setState] = useState<AnalysisState>({
    status: 'idle',
    data: null,
    error: null,
    imagePreview: null,
  });

  const [library, setLibrary] = useState<SavedRock[]>([]);
  const [randomFact, setRandomFact] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Load library from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('lithoLens_library');
    if (saved) {
      try {
        setLibrary(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse library", e);
      }
    }
    // Set random fact
    setRandomFact(ROCK_FACTS[Math.floor(Math.random() * ROCK_FACTS.length)]);
  }, []);

  const saveToLibrary = (analysisData: RockAnalysis) => {
    if (!state.imagePreview) return;
    
    const newRock: SavedRock = {
      ...analysisData,
      id: Date.now().toString(),
      date: Date.now(),
      image: state.imagePreview
    };

    const updatedLibrary = [newRock, ...library];
    setLibrary(updatedLibrary);
    
    // Save to local storage (try/catch for quota limits)
    try {
      localStorage.setItem('lithoLens_library', JSON.stringify(updatedLibrary));
    } catch (e) {
      alert("Storage full! Could not save to library. Try deleting old items.");
    }
  };

  const deleteFromLibrary = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = library.filter(item => item.id !== id);
    setLibrary(updated);
    localStorage.setItem('lithoLens_library', JSON.stringify(updated));
  };

  const viewLibraryItem = (item: SavedRock) => {
    setState({
      status: 'success',
      data: item,
      error: null,
      imagePreview: item.image
    });
    setView('scan');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageSelect = async (base64Image: string) => {
    setState(prev => ({ 
      ...prev, 
      status: 'analyzing', 
      imagePreview: base64Image,
      error: null 
    }));

    try {
      const result = await identifyRock(base64Image);
      setState(prev => ({
        ...prev,
        status: 'success',
        data: result
      }));
    } catch (error: any) {
      // Ensure error is strictly a string to avoid [object Object] crashes in UI
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string' 
          ? error 
          : "An unexpected error occurred during analysis.";

      setState(prev => ({
        ...prev,
        status: 'error',
        error: errorMessage
      }));
    }
  };

  const handleReset = () => {
    setState({
      status: 'idle',
      data: null,
      error: null,
      imagePreview: null
    });
    setView('scan');
    // Refresh fact on reset
    setRandomFact(ROCK_FACTS[Math.floor(Math.random() * ROCK_FACTS.length)]);
  };

  const filteredLibrary = library.filter(rock => {
    if (activeFilter === 'All') return true;
    // Guard against undefined category in case of malformed legacy data
    return (rock.category || '').toLowerCase().includes(activeFilter.toLowerCase());
  });

  // Helper to safely display value
  const getSafeValueDisplay = (val: string) => {
    if (!val || typeof val !== 'string') return "Value info unavailable";
    const prefix = val.split(' ')[0] !== 'Very' ? '$' : '';
    return `${prefix} ${val.slice(0, 15)}${val.length > 15 ? '...' : ''}`;
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center">
      {/* Navbar / Header */}
      <header className="w-full bg-stone-900 text-stone-50 py-4 px-6 shadow-md z-10 sticky top-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('scan')}>
            <div className="p-2 bg-stone-800 rounded-lg">
              <Pickaxe size={24} className="text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">LithoLens</h1>
          </div>
          
          <nav className="flex items-center gap-2">
            <button 
              onClick={() => setView('scan')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'scan' ? 'bg-stone-800 text-white' : 'text-stone-400 hover:text-white'}`}
            >
              Scanner
            </button>
            <button 
              onClick={() => setView('library')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'library' ? 'bg-stone-800 text-white' : 'text-stone-400 hover:text-white'}`}
            >
              <BookOpen size={16} />
              Collection <span className="bg-stone-700 text-stone-300 px-2 py-0.5 rounded-full text-xs">{library.length}</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl px-4 py-8 md:py-12 flex flex-col items-center">
        
        {view === 'library' ? (
          <div className="w-full animate-fade-in">
             <div className="flex items-center justify-between mb-8">
               <h2 className="text-3xl font-bold text-stone-800">My Collection</h2>
               <button onClick={() => setView('scan')} className="flex items-center gap-2 text-stone-500 hover:text-stone-800 transition-colors">
                 <ArrowLeft size={18} /> Back to Scanner
               </button>
             </div>

             {/* Achievements Section */}
             <Achievements library={library} />

             {/* Filters */}
             {library.length > 0 && (
               <div className="flex flex-wrap gap-2 mb-6">
                 <div className="flex items-center gap-2 mr-2 text-stone-500">
                   <Filter size={16} />
                   <span className="text-sm font-medium">Filter:</span>
                 </div>
                 {FILTER_CATEGORIES.map(cat => (
                   <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`
                      px-3 py-1.5 rounded-full text-sm font-medium transition-all
                      ${activeFilter === cat 
                        ? 'bg-stone-800 text-white shadow-md' 
                        : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-400'
                      }
                    `}
                   >
                     {cat}
                   </button>
                 ))}
               </div>
             )}

             {library.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-2xl border border-stone-200">
                 <div className="bg-stone-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
                   <BookOpen size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-stone-700 mb-2">No rocks saved yet</h3>
                 <p className="text-stone-500 mb-6">Scan stones and save them to unlock achievements.</p>
                 <button onClick={() => setView('scan')} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors">
                   Start Scanning
                 </button>
               </div>
             ) : (
               <>
                 {filteredLibrary.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-stone-300">
                      <p className="text-stone-500 mb-2">No rocks found in this category.</p>
                      <button 
                        onClick={() => setActiveFilter('All')}
                        className="text-emerald-600 font-medium hover:underline text-sm"
                      >
                        Clear filters
                      </button>
                    </div>
                 ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLibrary.map(rock => (
                      <div 
                        key={rock.id} 
                        onClick={() => viewLibraryItem(rock)}
                        className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-stone-200 overflow-hidden cursor-pointer group flex flex-col"
                      >
                        <div className="h-48 overflow-hidden relative">
                          <img src={rock.image} alt={rock.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-0 right-0 p-2">
                              <button 
                                onClick={(e) => deleteFromLibrary(rock.id, e)}
                                className="bg-white/80 hover:bg-red-500 hover:text-white p-2 rounded-full text-stone-600 transition-colors backdrop-blur-sm"
                                title="Remove from collection"
                              >
                                <Trash2 size={16} />
                              </button>
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{rock.category}</span>
                            {rock.locationFound && <span className="text-[10px] text-stone-400 flex items-center gap-1"><MapPin size={10} /> {rock.locationFound.slice(0, 15)}{rock.locationFound.length > 15 ? '...' : ''}</span>}
                          </div>
                          <h3 className="font-bold text-xl text-stone-800 mb-1">{rock.name}</h3>
                          <p className="text-stone-500 text-sm line-clamp-2 flex-1">{rock.description}</p>
                          <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center text-xs text-stone-400">
                            <span>{new Date(rock.date).toLocaleDateString()}</span>
                            <span className="font-medium text-amber-600">
                              {getSafeValueDisplay(rock.estimatedValue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                 )}
               </>
             )}
          </div>
        ) : (
          <>
            {state.status === 'idle' && (
              <div className="flex flex-col items-center w-full animate-fade-in-up">
                <div className="text-center max-w-2xl mb-12">
                  <h2 className="text-4xl md:text-5xl font-extrabold text-stone-800 mb-6 leading-tight">
                    Discover the <br/>
                    <span className="text-emerald-600">Hidden Geology</span>
                  </h2>
                  <p className="text-lg md:text-xl text-stone-600 leading-relaxed">
                    Found an interesting stone? Upload a photo and our AI geologist will instantly identify it, explain its origins, and detail its properties.
                  </p>
                </div>
                
                <ImageUploader onImageSelect={handleImageSelect} />

                {/* Tips for Best Results */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                  <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-col items-center text-center shadow-sm hover:border-emerald-200 transition-colors">
                    <Sun className="text-amber-500 mb-2" size={24} />
                    <h4 className="font-bold text-stone-700 text-sm mb-1">Good Lighting</h4>
                    <p className="text-xs text-stone-500 leading-snug">Use bright natural daylight to reveal true colors and textures.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-col items-center text-center shadow-sm hover:border-emerald-200 transition-colors">
                    <Aperture className="text-blue-500 mb-2" size={24} />
                    <h4 className="font-bold text-stone-700 text-sm mb-1">Sharp Focus</h4>
                    <p className="text-xs text-stone-500 leading-snug">Ensure the crystal structure or grain is clearly visible.</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-stone-200 flex flex-col items-center text-center shadow-sm hover:border-emerald-200 transition-colors">
                    <Maximize className="text-stone-500 mb-2" size={24} />
                    <h4 className="font-bold text-stone-700 text-sm mb-1">Clean Background</h4>
                    <p className="text-xs text-stone-500 leading-snug">Place the rock on a plain white or dark surface.</p>
                  </div>
                </div>

                {/* Did You Know Section */}
                <div className="mt-8 max-w-xl w-full bg-emerald-50/50 border border-emerald-100 shadow-sm rounded-xl p-5 flex items-start gap-4 animate-fade-in hover:shadow-md transition-shadow">
                  <div className="p-3 bg-white rounded-full text-emerald-600 shrink-0 shadow-sm">
                      <Lightbulb size={24} />
                  </div>
                  <div>
                      <h4 className="font-bold text-stone-800 text-sm uppercase tracking-wide mb-1">Rock Fact of the Day</h4>
                      <p className="text-stone-600 leading-relaxed italic text-sm">"{randomFact}"</p>
                  </div>
                </div>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl opacity-75">
                  {[
                    { title: 'Instant ID', desc: 'Identify minerals in seconds', icon: '⚡' },
                    { title: 'Valuation', desc: 'Get market value estimates', icon: '💰' },
                    { title: 'Collection', desc: 'Build your digital rock library', icon: '📚' }
                  ].map((item, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm text-center hover:border-emerald-300 transition-colors">
                      <div className="text-3xl mb-3">{item.icon}</div>
                      <h3 className="font-bold text-stone-800 mb-1">{item.title}</h3>
                      <p className="text-sm text-stone-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state.status === 'analyzing' && (
              <div className="flex flex-col items-center justify-center w-full max-w-2xl animate-pulse">
                 <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8 rounded-2xl overflow-hidden shadow-2xl border-4 border-stone-200">
                    {state.imagePreview && (
                      <img 
                        src={state.imagePreview} 
                        alt="Analyzing" 
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center backdrop-blur-[2px]">
                      <Loader2 size={64} className="text-white animate-spin" />
                    </div>
                 </div>
                 <h3 className="text-2xl font-bold text-stone-800 mb-2">Analyzing Specimen...</h3>
                 <p className="text-stone-500">Examining crystal structure and physical properties</p>
              </div>
            )}

            {state.status === 'success' && state.data && (
               <div className="w-full flex flex-col items-center gap-8">
                  {/* Thumbnail of uploaded image */}
                  {state.imagePreview && (
                     <div className="relative group w-32 h-32 rounded-xl overflow-hidden border-4 border-white shadow-lg -mb-16 z-20 transition-transform transform hover:scale-105">
                       <img src={state.imagePreview} alt="Specimen" className="w-full h-full object-cover" />
                     </div>
                  )}
                  <AnalysisResult 
                    data={state.data} 
                    imagePreview={state.imagePreview}
                    onReset={handleReset} 
                    onSave={saveToLibrary}
                    isSaved={library.some(item => item.name === state.data?.name && item.description === state.data?.description)}
                  />
               </div>
            )}

            {state.status === 'error' && (
              <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                <h3 className="text-xl font-bold text-red-800 mb-2">Analysis Failed</h3>
                <p className="text-red-600 mb-6">{state.error}</p>
                <button 
                  onClick={handleReset}
                  className="px-6 py-2 bg-white text-red-700 font-medium rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="w-full py-6 text-center text-stone-400 text-sm">
        <p>© {new Date().getFullYear()} LithoLens. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};

export default App;
