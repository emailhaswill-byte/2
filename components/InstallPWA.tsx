import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export const InstallPWA: React.FC = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
      // Automatically show the button when available
      setIsVisible(true);
    };
    
    // Listen for the 'beforeinstallprompt' event (Chrome/Android)
    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onClick = (evt: React.MouseEvent) => {
    evt.preventDefault();
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
    // Wait for the user to respond to the prompt
    promptInstall.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        setIsVisible(false);
      }
      setPromptInstall(null);
    });
  };

  if (!supportsPWA || !isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center animate-bounce-subtle">
       <button
        onClick={onClick}
        className="flex items-center gap-3 bg-stone-900 text-white px-6 py-3 rounded-full shadow-2xl border border-stone-700 hover:bg-black transition-all"
      >
        <div className="bg-emerald-600 p-1.5 rounded-full">
            <Download size={18} />
        </div>
        <div className="text-left">
            <p className="text-xs text-stone-400 font-medium uppercase tracking-wider">Get the App</p>
            <p className="text-sm font-bold">Install LithoLens</p>
        </div>
      </button>
      <button 
        onClick={() => setIsVisible(false)}
        className="mt-2 text-stone-400 text-xs underline hover:text-stone-600"
      >
        Not now
      </button>
    </div>
  );
};