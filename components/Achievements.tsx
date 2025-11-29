import React from 'react';
import { SavedRock } from '../types';
import { Trophy, Flame, Layers, Mountain, Pickaxe, Diamond, Box, Award } from 'lucide-react';

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  condition: (library: SavedRock[]) => boolean;
  colorClass: string; // Tailwind classes for color
}

interface AchievementsProps {
  library: SavedRock[];
}

export const Achievements: React.FC<AchievementsProps> = ({ library }) => {
  const badges: Badge[] = [
    {
      id: 'novice',
      title: 'Novice Rockhound',
      description: 'Save your first specimen to the collection',
      icon: <Box size={20} />,
      condition: (lib) => lib.length >= 1,
      colorClass: 'text-stone-600 bg-stone-100 border-stone-200'
    },
    {
      id: 'collector',
      title: 'Serious Collector',
      description: 'Save 5 rocks to your library',
      icon: <Trophy size={20} />,
      condition: (lib) => lib.length >= 5,
      colorClass: 'text-amber-600 bg-amber-100 border-amber-200'
    },
    {
      id: 'igneous',
      title: 'Magma Master',
      description: 'Collect an Igneous rock',
      icon: <Flame size={20} />,
      condition: (lib) => lib.some(r => r.category.toLowerCase().includes('igneous')),
      colorClass: 'text-red-600 bg-red-100 border-red-200'
    },
    {
      id: 'sedimentary',
      title: 'Sediment Seeker',
      description: 'Collect a Sedimentary rock',
      icon: <Layers size={20} />,
      condition: (lib) => lib.some(r => r.category.toLowerCase().includes('sedimentary')),
      colorClass: 'text-orange-600 bg-orange-100 border-orange-200'
    },
    {
      id: 'metamorphic',
      title: 'Pressure Player',
      description: 'Collect a Metamorphic rock',
      icon: <Mountain size={20} />,
      condition: (lib) => lib.some(r => r.category.toLowerCase().includes('metamorphic')),
      colorClass: 'text-indigo-600 bg-indigo-100 border-indigo-200'
    },
    {
      id: 'mineral',
      title: 'Crystal Clear',
      description: 'Collect a Mineral or Crystal',
      icon: <Diamond size={20} />,
      condition: (lib) => lib.some(r => r.category.toLowerCase().includes('mineral') || r.category.toLowerCase().includes('crystal')),
      colorClass: 'text-cyan-600 bg-cyan-100 border-cyan-200'
    },
    {
      id: 'valuable',
      title: 'Treasure Hunter',
      description: 'Find a rock with valuable elements',
      icon: <Pickaxe size={20} />,
      condition: (lib) => lib.some(r => r.valuableElements && r.valuableElements.length > 0),
      colorClass: 'text-emerald-600 bg-emerald-100 border-emerald-200'
    },
    {
      id: 'pro',
      title: 'Master Geologist',
      description: 'Reach a collection size of 10 specimens',
      icon: <Award size={20} />,
      condition: (lib) => lib.length >= 10,
      colorClass: 'text-purple-600 bg-purple-100 border-purple-200'
    }
  ];

  const unlockedCount = badges.filter(b => b.condition(library)).length;
  const progress = Math.round((unlockedCount / badges.length) * 100);

  return (
    <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm mb-8 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-lg text-stone-800 flex items-center gap-2">
            <Award className="text-emerald-600" />
            Geologist Achievements
          </h3>
          <p className="text-sm text-stone-500">Unlock badges by diversifying your collection</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-stone-800">{unlockedCount}</span>
          <span className="text-stone-400 text-sm">/{badges.length}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-100 rounded-full h-2 mb-6">
        <div 
          className="bg-emerald-500 h-2 rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {badges.map(badge => {
          const isUnlocked = badge.condition(library);
          return (
            <div 
              key={badge.id}
              className={`
                p-3 rounded-xl border transition-all duration-300 flex flex-col items-center text-center
                ${isUnlocked 
                  ? `${badge.colorClass} shadow-sm scale-100` 
                  : 'bg-stone-50 border-stone-100 text-stone-300 grayscale opacity-70 scale-95'
                }
              `}
            >
              <div className={`
                p-2 rounded-full mb-2
                ${isUnlocked ? 'bg-white bg-opacity-60' : 'bg-stone-200'}
              `}>
                {badge.icon}
              </div>
              <h4 className="font-bold text-xs mb-1">{badge.title}</h4>
              <p className="text-[10px] leading-tight opacity-80 hidden sm:block">
                {badge.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
