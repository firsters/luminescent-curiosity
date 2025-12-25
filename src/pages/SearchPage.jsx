import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useFridge } from '../context/FridgeContext';
import ItemDetailModal from '../components/ItemDetailModal';
import ItemCard from '../components/ItemCard';

export default function SearchPage() {
  const navigate = useNavigate();
  const { items, deleteItem, consumeItem } = useInventory();
  const { fridges } = useFridge();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Multi-select Filters State
  const [selectedFilters, setSelectedFilters] = useState({
    status: [],   // 'safe', 'expiring', 'expired'
    storage: [],  // 'fridge', 'freezer', 'pantry' (fridge types)
    category: []  // foodCategory ids
  });

  // Modal State
  const [selectedItem, setSelectedItem] = useState(null);

  // Recent searches
  const [recentSearches, setRecentSearches] = useState(['계란', '우유']); 

  const inputRef = useRef(null);
  
  useEffect(() => {
      inputRef.current?.focus();
  }, []);

  // Constants & Helpers
  const CATEGORY_LABELS = {
    fruit: "과일",
    vegetable: "채소",
    meat: "육류",
    dairy: "유제품",
    frozen: "냉동",
    drink: "음료",
    sauce: "소스",
    snack: "간식",
  };

  const STATUS_OPTIONS = [
    { id: 'safe', label: '여유' },
    { id: 'expiring', label: '임박' },
    { id: 'expired', label: '만료' }
  ];

  const STORAGE_OPTIONS = [
    { id: 'fridge', label: '냉장실' },
    { id: 'freezer', label: '냉동실' },
    { id: 'pantry', label: '실온' }
  ];

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry - today;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const getStorageName = (item) => {
      const fridge = fridges.find(f => f.id === item.fridgeId);
      // Fallback if fridge not found but category exists (legacy)
      if (!fridge) return item.category === 'fridge' ? '냉장실' : item.category === 'freezer' ? '냉동실' : '실온';
      return fridge.name;
  };

  const getFridgeType = (item) => {
      const fridge = fridges.find(f => f.id === item.fridgeId);
      if (fridge) return fridge.type; // 'kimchi' might need mapping if we only have fridge/freezer/pantry filters
      // Mapping kimchi to fridge or separate?
      // The requirement only listed fridge, freezer, pantry.
      // AddItem has: kimchi, freezer, pantry, default(fridge).
      if (fridge && fridge.type === 'kimchi') return 'fridge'; // Treat kimchi as fridge for this filter? Or add Kimchi?
      // Let's assume standard types. If 'kimchi', it might not match 'fridge' unless we map it.
      // User requested "Storage Type" (Fridge, Freezer, Pantry).
      // If I look at SearchPage original code: it had 'fridge', 'freezer', 'pantry'.
      return fridge ? fridge.type : null;
  };

  // Compute Top 5 Categories
  const topCategories = useMemo(() => {
    const counts = {};
    items.forEach(item => {
      if (item.foodCategory) {
        counts[item.foodCategory] = (counts[item.foodCategory] || 0) + 1;
      }
    });

    // Convert to array and sort
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1]) // Sort by count desc
      .slice(0, 5) // Take top 5
      .map(([id]) => ({ id, label: CATEGORY_LABELS[id] || id }));

    return sorted;
  }, [items]);

  // Filter Logic
  const filteredItems = items.filter(item => {
      const matchesSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());

      // 1. Status Filter (OR logic within status)
      let matchesStatus = true;
      if (selectedFilters.status.length > 0) {
          const days = getDaysUntilExpiry(item.expiryDate);
          const isExpired = days < 0;
          const isExpiring = days >= 0 && days <= 3;
          const isSafe = days > 3; // or no expiry?

          matchesStatus = selectedFilters.status.some(status => {
              if (status === 'expired') return isExpired;
              if (status === 'expiring') return isExpiring;
              if (status === 'safe') return isSafe;
              return false;
          });
      }

      // 2. Storage Filter (OR logic within storage)
      let matchesStorage = true;
      if (selectedFilters.storage.length > 0) {
          const fType = getFridgeType(item);
          // Map kimchi to fridge if needed, or handle as mismatch.
          // If 'fridge' is selected, does it include 'kimchi'? usually yes in simple UI, but let's stick to exact match or 'fridge' logic.
          // original SearchPage used: matchesFilter = fridge?.type === activeFilter;
          // Let's stick to exact match.
          // Note: AddItem uses 'kimchi', 'freezer', 'pantry', 'default'(which is fridge?).
          // Let's assume 'kimchi' is separate. If user only asked for 3 buttons, maybe map Kimchi to Fridge?
          // I will assume strict match for now, but if 'kimchi' items exist they won't show under 'fridge'.
          // However, standard Fridge is usually type 'default' or undefined?
          // AddItem: default return is gray color.
          // Let's check fridge types in DB...
          // Safe bet: If selected 'fridge', match 'fridge' OR 'kimchi' OR undefined/default?
          matchesStorage = selectedFilters.storage.some(type => {
             if (type === 'fridge') return fType === 'fridge' || fType === 'kimchi' || !fType || fType === 'default'; // Broaden 'fridge'
             return fType === type;
          });
      }

      // 3. Category Filter (OR logic within category)
      let matchesCategory = true;
      if (selectedFilters.category.length > 0) {
          matchesCategory = selectedFilters.category.includes(item.foodCategory);
      }

      return matchesSearch && matchesStatus && matchesStorage && matchesCategory;
  });

  const toggleFilter = (type, value) => {
    setSelectedFilters(prev => {
        const currentList = prev[type];
        const newList = currentList.includes(value)
            ? currentList.filter(item => item !== value)
            : [...currentList, value];
        return { ...prev, [type]: newList };
    });
  };

  const isSelected = (type, value) => selectedFilters[type].includes(value);

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

      {/* Filters Section */}
      <div className="flex flex-col gap-3 px-4 py-2">

          {/* Row 1: Status */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <span className="text-xs font-bold text-gray-400 shrink-0 w-12">상태</span>
              <div className="flex gap-2">
                  {STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => toggleFilter('status', opt.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                            ${isSelected('status', opt.id)
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                            }`}
                      >
                          {opt.label}
                      </button>
                  ))}
              </div>
          </div>

          {/* Row 2: Storage */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <span className="text-xs font-bold text-gray-400 shrink-0 w-12">보관</span>
              <div className="flex gap-2">
                  {STORAGE_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => toggleFilter('storage', opt.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                            ${isSelected('storage', opt.id)
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                            }`}
                      >
                          {opt.label}
                      </button>
                  ))}
              </div>
          </div>

          {/* Row 3: Category (Top 5) */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <span className="text-xs font-bold text-gray-400 shrink-0 w-12">카테고리</span>
              <div className="flex gap-2">
                  {topCategories.length > 0 ? topCategories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => toggleFilter('category', cat.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border
                            ${isSelected('category', cat.id)
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                            }`}
                      >
                          {cat.label}
                      </button>
                  )) : (
                      <span className="text-xs text-gray-400 py-1.5">등록된 음식 없음</span>
                  )}
              </div>
          </div>
      </div>

      {/* Results or Recent */}
      <div className="flex-1 flex flex-col pt-2 px-4">
          
          {/* Recent Searches: Only show if NO search term */}
          {!searchTerm && (
              <div className="mt-4 mb-6">
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
          )}

          {/* Results State - Always visible */}
          <div className="flex items-center justify-between pb-3 pt-2">
              <h3 className="text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
                  검색 결과 <span className="text-primary ml-1">{filteredItems.length}</span>
              </h3>
          </div>

          <div className="flex flex-col gap-3 pb-20">
              {filteredItems.map(item => (
                  <ItemCard
                      key={item.id}
                      item={item}
                      fridgeName={getStorageName(item)}
                      onClick={() => setSelectedItem(item)}
                      onConsume={consumeItem}
                  />
              ))}

              {filteredItems.length === 0 && (
                  <div className="py-10 text-center text-gray-400">
                      검색 결과가 없습니다.
                  </div>
              )}
          </div>

      </div>

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        fridgeName={selectedItem ? getStorageName(selectedItem) : ''}
        onClose={() => setSelectedItem(null)}
        onEdit={() => navigate('/add', { state: { editItem: selectedItem } })}
        onDelete={() => {
            deleteItem(selectedItem.id);
            setSelectedItem(null);
        }}
        onConsume={() => {
            consumeItem(selectedItem.id);
            setSelectedItem(null);
        }}
      />
    </div>
  );
}
