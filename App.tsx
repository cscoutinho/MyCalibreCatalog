import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Library, Upload, Settings, Search } from 'lucide-react';
import { Book, CalibreLibrary } from './types';
import { Dashboard } from './components/Dashboard';
import { BookBrowser } from './components/BookBrowser';
import { LibraryLoader } from './components/LibraryLoader';

export default function App() {
  const [library, setLibrary] = useState<CalibreLibrary | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'browser'>('dashboard');
  const [browserSearchQuery, setBrowserSearchQuery] = useState('');

  // Load sample data or check local storage on mount could be implemented here
  // For now, we start with the loader if no library is present.

  const handleLibraryLoaded = (data: CalibreLibrary) => {
    setLibrary(data);
    setActiveTab('dashboard');
  };

  const handleNavigateToTag = (tag: string) => {
    setBrowserSearchQuery(tag);
    setActiveTab('browser');
  };

  const renderContent = () => {
    if (!library) {
      return <LibraryLoader onLoaded={handleLibraryLoaded} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard books={library.books} onTagClick={handleNavigateToTag} />;
      case 'browser':
        return <BookBrowser books={library.books} initialSearch={browserSearchQuery} />;
      default:
        return <Dashboard books={library.books} onTagClick={handleNavigateToTag} />;
    }
  };

  return (
    <div className="flex h-full bg-stone-950 text-stone-200">
      {/* Sidebar Navigation */}
      <nav className="w-20 md:w-64 bg-stone-900 border-r border-stone-800 flex flex-col justify-between shrink-0 transition-all duration-300">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-stone-800">
            <Library className="w-8 h-8 text-amber-600 shrink-0" />
            <span className="font-serif font-bold text-xl hidden md:block truncate text-amber-500 tracking-wide">Librarian</span>
          </div>

          <div className="flex flex-col py-6 gap-2 px-3">
            <NavButton 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
              icon={<LayoutDashboard />} 
              label="Dashboard" 
              disabled={!library}
            />
            <NavButton 
              active={activeTab === 'browser'} 
              onClick={() => {
                setBrowserSearchQuery(''); // Reset search when entering via nav
                setActiveTab('browser');
              }} 
              icon={<Search />} 
              label="Browser" 
              disabled={!library}
            />
          </div>
        </div>

        <div className="p-4 border-t border-stone-800 bg-stone-900/50">
           {!library ? (
             <div className="text-xs text-stone-500 text-center md:text-left italic">No library loaded</div>
           ) : (
             <div className="text-xs text-stone-400 hidden md:block">
               <div className="font-serif text-stone-200 text-lg">{library.books.length.toLocaleString()}</div>
               <div className="truncate text-stone-500 uppercase tracking-wider text-[10px]">Total Volumes</div>
             </div>
           )}
           {library && (
             <button 
               onClick={() => setLibrary(null)}
               className="mt-4 flex items-center gap-2 text-stone-500 hover:text-red-400 text-sm w-full p-2 rounded hover:bg-stone-800 transition-colors"
             >
               <Upload className="w-4 h-4" />
               <span className="hidden md:inline">Load New</span>
             </button>
           )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col bg-stone-950">
        {renderContent()}
      </main>
    </div>
  );
}

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 group
      ${active ? 'bg-amber-900/30 text-amber-500 border border-amber-900/50' : 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    <div className={`${active ? 'text-amber-500' : 'text-stone-500 group-hover:text-stone-300'}`}>
      {icon}
    </div>
    <span className="font-medium hidden md:block tracking-wide">{label}</span>
  </button>
);