
import React, { useState, useEffect, useRef } from 'react';
import { RockAnalysis } from '../types';
import { Leaf, Info, Diamond, Layers, Search, AlertTriangle, ExternalLink, DollarSign, Bookmark, Check, Pickaxe, HelpCircle, Image as ImageIcon, FlaskConical, Globe, Hammer, Coins, Activity, MoveHorizontal } from 'lucide-react';

interface AnalysisResultProps {
  data: RockAnalysis;
  imagePreview?: string | null;
  onReset: () => void;
  onSave?: (data: RockAnalysis) => void;
  isSaved?: boolean;
}

// Helper component to fetch and display a thumbnail from Wikipedia
const WikiRockImage: React.FC<{ rockName: string }> = ({ rockName }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!rockName) return;
    
    let isMounted = true;
    const fetchImage = async () => {
      try {
        const response = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&titles=${encodeURIComponent(rockName)}&pithumbsize=300&origin=*`
        );
        const data = await response.json();
        const pages = data.query?.pages;
        if (pages) {
          const pageId = Object.keys(pages)[0];
          if (pageId !== "-1") {
            const url = pages[pageId]?.thumbnail?.source;
            if (isMounted && url) setImageUrl(url);
          }
        }
      } catch (e) {
        // Silently fail
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchImage();
    return () => { isMounted = false; };
  }, [rockName]);

  if (loading) {
    return <div className="w-full h-32 bg-stone-100 animate-pulse rounded-lg mb-3"></div>;
  }

  if (!imageUrl) {
    return (
      <div className="w-full h-32 bg-stone-50 rounded-lg mb-3 flex flex-col items-center justify-center text-stone-300">
        <ImageIcon size={24} />
      </div>
    );
  }

  return (
    <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-stone-100 relative group-hover:opacity-90 transition-opacity">
      <img 
        src={imageUrl} 
        alt={rockName} 
        className="w-full h-full object-cover"
        onError={() => setImageUrl(null)} 
      />
    </div>
  );
};

// Component for Side-by-Side Comparison Slider
const RockComparison: React.FC<{ userImage: string; rockName: string }> = ({ userImage, rockName }) => {
  const [wikiImage, setWikiImage] = useState<string | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rockName) return;

    let isMounted = true;
    const fetchRefImage = async () => {
      try {
        // Request a larger image for the comparison slider (600px)
        const response = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&titles=${encodeURIComponent(rockName)}&pithumbsize=600&origin=*`
        );
        const data = await response.json();
        const pages = data.query?.pages;
        if (pages) {
          const pageId = Object.keys(pages)[0];
          if (pageId !== "-1") {
            const url = pages[pageId]?.thumbnail?.source;
            if (isMounted && url) setWikiImage(url);
          }
        }
      } catch (e) {
        // Fail silently
      }
    };
    fetchRefImage();
    return () => { isMounted = false; };
  }, [rockName]);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    
    const { left, width } = containerRef.current.getBoundingClientRect();
    let clientX;
    
    // Safely extract clientX for both mouse and touch events
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }

    const newPos = ((clientX - left) / width) * 100;
    setSliderPosition(Math.min(100, Math.max(0, newPos)));
  };

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);

  // If no reference image found, skip this section
  if (!wikiImage) return null;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3 text-stone-800">
        <Search size={20} className="text-stone-500" />
        <h3 className="font-bold text-lg">Visual Verification</h3>
      </div>
      <p className="text-sm text-stone-500 mb-3">
        Drag the slider to compare your scan with a typical specimen.
      </p>
      
      <div 
        ref={containerRef}
        className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden cursor-ew-resize select-none border border-stone-200 shadow-sm"
        onMouseMove={isResizing ? handleMouseMove : undefined}
        onTouchMove={isResizing ? handleMouseMove : undefined}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
      >
        {/* Background Layer (Reference) */}
        <div className="absolute inset-0">
          <img 
            src={wikiImage} 
            alt="Reference Specimen" 
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 right-4 bg-emerald-900/80 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-lg z-10">
            Typical {rockName}
          </div>
        </div>

        {/* Foreground Layer (User Scan) - Clipped */}
        <div 
          className="absolute inset-0 overflow-hidden border-r-2 border-white"
          style={{ width: `${sliderPosition}%` }}
        >
          <img 
            src={userImage} 
            alt="Your Scan" 
            className="absolute top-0 left-0 max-w-none h-full w-full object-cover"
            style={{ width: containerRef.current ? containerRef.current.offsetWidth : '100%' }}
          />
          <div className="absolute bottom-4 left-4 bg-stone-900/80 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md shadow-lg z-10">
            Your Scan
          </div>
        </div>

        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          style={{ left: `${sliderPosition}%` }}
        >
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-stone-800 p-2 rounded-full shadow-lg hover:scale-110 transition-transform">
              <MoveHorizontal size={20} />
           </div>
        </div>
      </div>
    </section>
  );
};

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ data, imagePreview, onReset, onSave, isSaved }) => {
  const [hasSaved, setHasSaved] = useState(isSaved || false);

  const handleSave = () => {
    if (onSave && !hasSaved) {
      onSave(data);
      setHasSaved(true);
    }
  };

  const googleImagesUrl = (query: string) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent((typeof query === 'string' ? query : 'rock') + ' rock mineral specimen')}`;

  // Check for gold or silver specifically
  const preciousMetals = data.valuableElements?.filter(el => 
    typeof el === 'string' && ['gold', 'silver', 'au', 'ag'].some(term => el.toLowerCase().includes(term))
  ) || [];
  const hasPreciousMetals = preciousMetals.length > 0;

  if (!data.isRock) {
    return (
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden p-8 text-center animate-fade-in">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-orange-100 rounded-full text-orange-600">
            <AlertTriangle size={48} />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-stone-800 mb-2">Not a Rock?</h2>
        <p className="text-stone-600 mb-6">
          It looks like this image might not be a rock or mineral. The AI identified it as: <span className="font-semibold text-stone-900">{data.name}</span>.
        </p>
        <button
          onClick={onReset}
          className="bg-stone-800 hover:bg-stone-900 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Try Another Image
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in border border-stone-200 mb-12">
      {/* Header */}
      <div className="bg-stone-900 text-white p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Diamond size={120} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-block px-3 py-1 bg-stone-700 text-stone-100 text-xs font-bold tracking-wider uppercase rounded-full">
                {data.category}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-2 tracking-tight">{data.name}</h1>
            {data.scientificName && (
              <div className="flex items-center gap-2">
                 <p className="text-stone-400 italic font-serif text-lg">{data.scientificName}</p>
                 {data.chemicalFormula && (
                   <>
                    <span className="text-stone-600">•</span>
                    <span className="font-mono text-emerald-400">{data.chemicalFormula}</span>
                   </>
                 )}
              </div>
            )}
          </div>
          
          {onSave && (
            <button 
              onClick={handleSave}
              disabled={hasSaved}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                ${hasSaved 
                  ? 'bg-emerald-600 text-white cursor-default' 
                  : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm'
                }
              `}
            >
              {hasSaved ? <Check size={18} /> : <Bookmark size={18} />}
              {hasSaved ? 'Saved to Collection' : 'Save to Collection'}
            </button>
          )}
        </div>
      </div>

      <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="md:col-span-8 space-y-8">
          
          {/* Scientific Details Cards */}
          {(data.chemicalFormula || data.crystalSystem) && (
             <div className="grid grid-cols-2 gap-4">
               {data.chemicalFormula && (
                 <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col">
                   <div className="flex items-center gap-2 text-stone-500 mb-2">
                     <FlaskConical size={16} />
                     <span className="text-xs font-bold uppercase tracking-wider">Formula</span>
                   </div>
                   <div className="text-lg font-mono font-bold text-stone-800 break-words">{data.chemicalFormula}</div>
                 </div>
               )}
               {data.crystalSystem && (
                 <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col">
                   <div className="flex items-center gap-2 text-stone-500 mb-2">
                     <Diamond size={16} />
                     <span className="text-xs font-bold uppercase tracking-wider">Crystal System</span>
                   </div>
                   <div className="text-lg font-bold text-stone-800">{data.crystalSystem}</div>
                 </div>
               )}
             </div>
          )}

          {/* Side by Side Comparison */}
          {imagePreview && (
            <RockComparison userImage={imagePreview} rockName={data.name} />
          )}

          <section>
            <div className="flex items-center gap-2 mb-3 text-stone-800">
              <Info size={20} className="text-stone-500" />
              <h3 className="font-bold text-lg">Geological Overview</h3>
            </div>
            <p className="text-stone-600 leading-relaxed text-lg">
              {data.description}
            </p>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Occurrence */}
            {data.occurrence && (
              <section className="bg-stone-50 p-5 rounded-xl border border-stone-100">
                 <div className="flex items-start gap-3">
                    <Globe size={20} className="text-stone-500 mt-1" />
                    <div>
                      <h4 className="font-bold text-stone-800 text-sm uppercase tracking-wide mb-1">Occurrence</h4>
                      <p className="text-stone-600 text-sm leading-relaxed">{data.occurrence}</p>
                    </div>
                  </div>
              </section>
            )}
            
            {/* Common Uses */}
            {data.commonUses && data.commonUses.length > 0 && (
              <section className="bg-stone-50 p-5 rounded-xl border border-stone-100">
                 <div className="flex items-start gap-3">
                    <Hammer size={20} className="text-stone-500 mt-1" />
                    <div>
                      <h4 className="font-bold text-stone-800 text-sm uppercase tracking-wide mb-2">Common Uses</h4>
                      <div className="flex flex-wrap gap-2">
                        {data.commonUses.map((use, i) => (
                           <span key={i} className="text-xs font-medium px-2 py-1 bg-white border border-stone-200 rounded text-stone-600">
                             {typeof use === 'string' ? use : String(use)}
                           </span>
                        ))}
                      </div>
                    </div>
                  </div>
              </section>
            )}
          </div>

          {/* Precious Metal Extraction Banner */}
          <section className={`rounded-xl border p-5 ${hasPreciousMetals ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' : 'bg-stone-50 border-stone-200'}`}>
              <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-full shrink-0 ${hasPreciousMetals ? 'bg-yellow-100 text-yellow-600 shadow-sm' : 'bg-stone-200 text-stone-400'}`}>
                      <Coins size={24} />
                  </div>
                  <div>
                      <h3 className={`font-bold text-lg mb-1 ${hasPreciousMetals ? 'text-yellow-800' : 'text-stone-700'}`}>
                          Precious Metal Extraction
                      </h3>
                      {hasPreciousMetals ? (
                           <p className="text-yellow-900 leading-relaxed">
                              <span className="font-bold">Yes.</span> This rock type is a known ore for <span className="font-bold border-b-2 border-yellow-300">{preciousMetals.join(' and ')}</span>. 
                              Industrial extraction or refining may be possible depending on concentration.
                           </p>
                      ) : (
                           <p className="text-stone-500 leading-relaxed">
                              <span className="font-semibold">Unlikely.</span> This specimen is not typically a primary ore for Gold or Silver extraction.
                           </p>
                      )}
                  </div>
              </div>
          </section>

          {/* Market & Value Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {/* Estimated Value Section */}
            <section className="bg-amber-50 border border-amber-100 rounded-xl p-5">
               <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 rounded-full text-amber-600 shrink-0">
                    <DollarSign size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-800 text-sm uppercase tracking-wide mb-1">Estimated Value</h4>
                    <p className="text-amber-900 font-medium">{data.estimatedValue}</p>
                  </div>
                </div>
            </section>

            {/* Valuable Elements Section */}
            {data.valuableElements && data.valuableElements.length > 0 ? (
              <section className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                 <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-full text-blue-600 shrink-0">
                      <Pickaxe size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-800 text-sm uppercase tracking-wide mb-2">Composition</h4>
                      <div className="flex flex-wrap gap-2">
                        {data.valuableElements.map((el, i) => (
                          <span key={i} className="px-2 py-1 bg-white border border-blue-200 text-blue-800 text-xs font-bold rounded shadow-sm">
                            {typeof el === 'string' ? el : 'Unknown'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
              </section>
            ) : (
               <section className="bg-stone-50 border border-stone-100 rounded-xl p-5 flex items-center gap-3 opacity-60">
                  <div className="p-2 bg-stone-200 rounded-full text-stone-500 shrink-0">
                      <Pickaxe size={20} />
                  </div>
                  <div>
                      <h4 className="font-bold text-stone-700 text-sm uppercase tracking-wide">Composition</h4>
                      <p className="text-stone-500 text-sm">No rare elements</p>
                  </div>
               </section>
            )}
          </div>

          {data.funFact && (
            <section className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <Leaf size={24} className="text-emerald-600 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-emerald-800 text-sm uppercase tracking-wide mb-1">Did you know?</h4>
                  <p className="text-emerald-700">{data.funFact}</p>
                </div>
              </div>
            </section>
          )}
          
          {/* Sample Images Link */}
          <section>
             <a 
               href={googleImagesUrl(data.name)} 
               target="_blank" 
               rel="noopener noreferrer"
               className="group flex items-center justify-between p-4 bg-white border border-stone-200 rounded-xl hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer"
             >
               <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-stone-100 rounded-lg flex items-center justify-center text-stone-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                   <Search size={24} />
                 </div>
                 <div>
                   <p className="font-semibold text-stone-800 group-hover:text-emerald-700">View Reference Images</p>
                   <p className="text-sm text-stone-500">Compare with verified examples on Google</p>
                 </div>
               </div>
               <ExternalLink size={20} className="text-stone-400 group-hover:text-emerald-600" />
             </a>
          </section>

          {/* Alternatives Section */}
          {data.alternatives && data.alternatives.length > 0 && (
            <section className="pt-6 border-t border-stone-200">
               <div className="flex items-center gap-2 mb-4 text-stone-800">
                  <HelpCircle size={20} className="text-stone-500" />
                  <h3 className="font-bold text-lg">Common Misidentifications</h3>
               </div>
               <p className="text-stone-500 text-sm mb-4">
                 Identification from a single photo can be difficult. These are the most common visually similar rocks that this specimen could be:
               </p>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.alternatives.map((alt, i) => (
                    <div key={i} className="group bg-white border border-stone-200 p-4 rounded-xl shadow-sm hover:border-emerald-400 hover:shadow-md transition-all">
                      <a 
                        href={googleImagesUrl(alt.name)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block relative"
                      >
                         <WikiRockImage rockName={alt.name} />
                         <div className="absolute top-2 right-2 bg-black/50 hover:bg-emerald-600 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors">
                            <Search size={14} />
                         </div>
                      </a>
                      
                      <div className="mt-2">
                        <h4 className="font-bold text-stone-800 group-hover:text-emerald-700 transition-colors">{alt.name}</h4>
                        <p className="text-xs text-stone-500 leading-snug mt-1"><span className="font-semibold text-stone-600">Distinction:</span> {alt.reason}</p>
                      </div>
                    </div>
                  ))}
               </div>
            </section>
          )}
        </div>

        {/* Sidebar / Properties */}
        <div className="md:col-span-4">
          <div className="bg-stone-50 rounded-xl p-6 border border-stone-200 sticky top-24">
            
            {/* Confidence Score Section */}
            {data.confidenceScore !== undefined && (
              <div className="mb-6 pb-6 border-b border-stone-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Activity size={20} className="text-stone-500" />
                    <h3 className="font-bold text-stone-700">Confidence</h3>
                  </div>
                  <span className={`font-bold text-xl ${
                    data.confidenceScore >= 80 ? 'text-emerald-600' : 
                    data.confidenceScore >= 50 ? 'text-amber-600' : 'text-red-500'
                  }`}>
                    {data.confidenceScore}%
                  </span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${
                      data.confidenceScore >= 80 ? 'bg-emerald-500' : 
                      data.confidenceScore >= 50 ? 'bg-amber-400' : 'bg-red-400'
                    }`} 
                    style={{ width: `${data.confidenceScore}%` }}
                  />
                </div>
                <p className="text-xs text-stone-500 mt-2 text-right">
                  {data.confidenceScore >= 80 ? "High probability match" : 
                   data.confidenceScore >= 50 ? "Moderate probability" : 
                   "Low probability match"}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 mb-4 text-stone-800 border-b border-stone-200 pb-2">
              <Layers size={20} className="text-stone-500" />
              <h3 className="font-bold text-lg">Physical Properties</h3>
            </div>
            
            <dl className="space-y-4">
              <PropertyItem label="Color" value={data.physicalProperties.color} />
              <PropertyItem label="Hardness" value={data.physicalProperties.hardness} />
              <PropertyItem label="Lustre" value={data.physicalProperties.lustre} />
              <PropertyItem label="Transparency" value={data.physicalProperties.transparency} />
              <PropertyItem label="Streak" value={data.physicalProperties.streak} />
              <PropertyItem label="Cleavage" value={data.physicalProperties.cleavage} />
              <PropertyItem label="Fracture" value={data.physicalProperties.fracture} />
              <PropertyItem label="Specific Gravity" value={data.physicalProperties.specificGravity} />
            </dl>

            <button
              onClick={onReset}
              className="w-full mt-8 flex items-center justify-center gap-2 bg-stone-900 text-white hover:bg-emerald-600 px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-stone-200 hover:shadow-emerald-200"
            >
              <Search size={18} />
              Scan New Rock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PropertyItem = ({ label, value }: { label: string; value?: any }) => {
  if (!value) return null;
  // Safely handle potentially non-string values (objects/numbers) to prevent rendering crashes
  const displayValue = typeof value === 'object' ? JSON.stringify(value) : String(value);

  return (
    <div className="group">
      <dt className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">{label}</dt>
      <dd className="text-stone-800 font-medium text-sm leading-snug group-hover:text-emerald-800 transition-colors">{displayValue}</dd>
    </div>
  );
};