import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useFridge } from '../context/FridgeContext';

export default function SearchPage() {
  const navigate = useNavigate();
  const { items } = useInventory();
  const { fridges } = useFridge();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, expiring, fridge, freezer, pantry
  
  // Recent searches (Local Storage could be used here)
  const [recentSearches, setRecentSearches] = useState(['계란', '우유']); 

  const inputRef = useRef(null);
  
  useEffect(() => {
      inputRef.current?.focus();
  }, []);

  // Filter Logic
  const filteredItems = items.filter(item => {
      if (!searchTerm && activeFilter === 'all') return false; // Don't show everything by default? Stitch shows "Recent"

      const matchesSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = true;
      if (activeFilter === 'expiring') {
          const days = getDaysUntilExpiry(item.expiryDate);
          matchesFilter = days <= 3;
      } else if (['fridge', 'freezer', 'pantry'].includes(activeFilter)) {
          // Need to check the TYPE of the fridge this item belongs to
          const fridge = fridges.find(f => f.id === item.fridgeId);
          matchesFilter = fridge?.type === activeFilter;
          // Fallback for items without fridgeId (legacy) -> check item category?
          if (!fridge) matchesFilter = item.category === activeFilter; 
      }

      return matchesSearch && matchesFilter;
  });

  // Helpers
  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return 999;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };
  
  const getBadgeColor = (days) => {
      if (days <= 3) return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      if (days <= 7) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      return 'bg-primary/10 text-primary border-primary/20';
  };

  const getStorageName = (item) => {
      const fridge = fridges.find(f => f.id === item.fridgeId);
      return fridge ? fridge.name : (item.category === 'fridge' ? '냉장실' : item.category === 'freezer' ? '냉동실' : '실온');
  };

  return (
    <div className="flex h-full min-h-screen w-full flex-col bg-background-light dark:bg-background-dark pb-20">
      
      {/* Header */}
      <header className="flex items-center p-4 sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm">
        <button onClick={() => navigate(-1)} className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-slate-900 dark:text-white">arrow_back_ios_new</span>
        </button>
        <h2 className="text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">통합 검색</h2>
        <div className="flex w-10 items-center justify-end"></div>
      </header>

      {/* Search Bar */}
      <div className="px-4 pb-2">
        <div className="relative flex items-center w-full h-12 rounded-2xl bg-white dark:bg-surface-dark shadow-sm border border-slate-100 dark:border-white/5 transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-primary">
            <div className="flex items-center justify-center pl-4 text-primary">
                <span className="material-symbols-outlined">search</span>
            </div>
            <input 
                ref={inputRef}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 w-full h-full bg-transparent border-none focus:ring-0 text-base font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-white px-3" 
                placeholder="음식 이름 검색 (예: 계란, 우유)" 
                type="text" 
            />
            {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="flex items-center justify-center px-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    <span className="material-symbols-outlined filled-icon text-[20px]">cancel</span>
                </button>
            )}
        </div>
      </div>

      {/* Filters */}
      <div className="w-full overflow-x-auto scrollbar-hide py-3 pl-4">
        <div className="flex gap-2 pr-4">
            {[
                { id: 'all', label: '전체' },
                { id: 'expiring', label: '소비기한 임박' },
                { id: 'fridge', label: '냉장실' },
                { id: 'freezer', label: '냉동실' },
                { id: 'pantry', label: '실온' }
            ].map(filter => (
                <button 
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-all
                        ${activeFilter === filter.id 
                            ? 'bg-primary text-white shadow-md shadow-primary/30 font-bold' 
                            : 'bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/5 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-white/5'}`}
                >
                    <p className="text-sm leading-normal">{filter.label}</p>
                </button>
            ))}
        </div>
      </div>

      {/* Results or Recent */}
      <div className="flex-1 flex flex-col pt-2 px-4">
          
          {!searchTerm && activeFilter === 'all' ? (
              // Recent Searches State
              <div className="mt-2">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">최근 검색어</h4>
                    <button className="text-xs text-slate-400 underline" onClick={() => setRecentSearches([])}>지우기</button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {recentSearches.map(term => (
                        <span key={term} onClick={() => setSearchTerm(term)} className="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer transition-colors">
                            {term}
                            <span className="material-symbols-outlined ml-1 text-slate-400 hover:text-slate-600 text-[14px]">close</span>
                        </span>
                    ))}
                    {recentSearches.length === 0 && <span className="text-sm text-gray-400">최근 검색 내역이 없습니다.</span>}
                </div>
              </div>
          ) : (
              // Results State
              <>
                <div className="flex items-center justify-between pb-3 pt-2">
                    <h3 className="text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                        검색 결과 <span className="text-primary ml-1">{filteredItems.length}</span>
                    </h3>
                </div>
                
                <div className="flex flex-col gap-3 pb-20">
                    {filteredItems.map(item => {
                        const days = getDaysUntilExpiry(item.expiryDate);
                        
                        return (
                            <div key={item.id} className="group flex items-center gap-4 bg-white dark:bg-surface-dark rounded-2xl p-3 shadow-sm hover:shadow-md transition-all border border-transparent hover:border-primary/20 cursor-pointer">
                                <div className="relative bg-slate-100 dark:bg-white/10 rounded-xl size-16 shrink-0 overflow-hidden">
                                     {/* Use Unsplash or uploaded URL */}
                                     {item.photoUrl ? (
                                        <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-gray-400">fastfood</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col justify-center flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-slate-900 dark:text-white text-base font-bold leading-normal truncate">{item.name}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${getBadgeColor(days)}`}>
                                            {days < 0 ? '만료' : `D-${days}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-sm">
                                        <span className="material-symbols-outlined text-[16px]">kitchen</span>
                                        <span className="truncate">{getStorageName(item)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {filteredItems.length === 0 && (
                        <div className="py-10 text-center text-gray-400">
                            검색 결과가 없습니다.
                        </div>
                    )}
                </div>
              </>
          )}

      </div>
    </div>
  );
}
