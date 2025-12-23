import { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext';
import { useFridge } from '../context/FridgeContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

export default function InventoryList() {
  const { items, loading, deleteItem, consumeItem } = useInventory();
  const { fridges, updateFridge, deleteFridge } = useFridge(); // Access fridge actions
  const [searchParams] = useSearchParams();
  const fridgeFilter = searchParams.get('fridge'); // 'main', 'freezer', etc.
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'expiring', 'expired', 'fridge', 'freezer'

  // Modal State
  const [selectedItem, setSelectedItem] = useState(null);

  // Fridge Action Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFridgeName, setEditFridgeName] = useState('');
  const [editFridgeType, setEditFridgeType] = useState('fridge');

  const fridgeId = searchParams.get('fridgeId');
  const fridgeNameParam = searchParams.get('fridgeName');

  // Determine current fridge title
  const getPageTitle = () => {
      // Prioritize local state if we just edited it, but for now URL param is single source of truth usually.
      // However, if we update fridge name, we want UI to reflect immediately.
      // Let's find the fridge in the context list if possible.
      const currentFridge = fridges.find(f => f.id === fridgeId);
      if (currentFridge) return currentFridge.name;

      if (fridgeNameParam) return fridgeNameParam;
      return '음식 목록';
  };

  // Handlers for Fridge Actions
  const handleOpenEditModal = () => {
      setIsMenuOpen(false);
      const currentFridge = fridges.find(f => f.id === fridgeId);
      if (currentFridge) {
          setEditFridgeName(currentFridge.name);
          setEditFridgeType(currentFridge.type);
          setIsEditModalOpen(true);
      } else {
          // Fallback if context not loaded or something
          setEditFridgeName(fridgeNameParam || '');
          setIsEditModalOpen(true);
      }
  };

  const handleUpdateFridge = async (e) => {
      e.preventDefault();
      if (!editFridgeName.trim()) return;
      try {
          await updateFridge(fridgeId, {
              name: editFridgeName,
              type: editFridgeType
          });
          setIsEditModalOpen(false);
          // Optional: Update URL to reflect new name? Or just rely on context.
          // Since we use URL param for initial render, better update history state or just rely on Context for title.
      } catch (error) {
          alert('수정 실패: ' + error.message);
      }
  };

  const handleDeleteFridge = async () => {
      if (!confirm(`'${editFridgeName}' 냉장고를 삭제하시겠습니까?\n모든 음식이 함께 삭제됩니다.`)) return;
      try {
          await deleteFridge(fridgeId);
          navigate('/'); // Go back home
      } catch (error) {
          alert('삭제 실패: ' + error.message);
      }
  };

  // Filter Logic
  const filteredItems = items.filter(item => {
    // 0. Status Filter (Only show available items in this list)
    if (item.status === 'consumed' || item.status === 'discarded') return false;

    // 1. Text Search
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Fridge Context Filter (URL param)
    // If we have a fridgeId param, strictly filter by it.
    // If not, maybe show all? Or just 'available'? For now, let's show all if no fridgeId
    // (or handle legacy items without fridgeId if necessary)
    let matchesFridge = true;
    if (fridgeId) {
        matchesFridge = item.fridgeId === fridgeId;
    }

    // 3. UI Chip Filter (Visual grouping within the fridge)
    // 'all' -> everything in this fridge
    // 'expiring' -> expiry <= 3 days
    // 'fridge' / 'freezer' -> these are fridge TYPES, but we are inside a specific fridge which HAS a type.
    // Wait, the design had "Fridge / Freezer / Pantry" chips.
    // If I'm detailed view of "Kimchi Fridge", those chips might be less relevant unless I'm using them for item categories (Fruit/Meat/etc).
    // Let's repurpose chips to "Food Categories" or "Expiry Status".
    // For now, let's keep 'expiring' and 'all'. 
    
    let matchesCategory = true;
    if (activeFilter === 'expiring') {
        const daysUntil = getDaysUntilExpiry(item.expiryDate);
        matchesCategory = daysUntil >= 0 && daysUntil <= 3;
    } else if (activeFilter === 'expired') {
        const daysUntil = getDaysUntilExpiry(item.expiryDate);
        matchesCategory = daysUntil < 0;
    }
    // If we want to filter by foodCategory (meat, fruit) we should change the chips.

    return matchesSearch && matchesFridge && matchesCategory;
  });

  // Effect to sync URL filter param to activeFilter state
  useEffect(() => {
    const filterParam = searchParams.get('filter'); // 'expiring', 'expired'
    if (filterParam) {
        setActiveFilter(filterParam);
    }
  }, [searchParams]);

  // Helpers
  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return 999;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  const getDDayBadge = (days) => {
      if (days < 0) return { text: `만료됨 (D+${Math.abs(days)})`, color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50' };
      if (days <= 3) return { text: `D-${days}`, color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900/50' };
      if (days <= 7) return { text: `D-${days}`, color: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' };
      return { text: `${days}일 남음`, color: 'text-[#0e1b12] dark:text-white font-bold' };
  };

  const navigate = useNavigate();

  if (loading) return <div className="p-8 text-center">Loading inventory...</div>;

  return (
    <>
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 border-b border-black/5 dark:border-white/5">
        <button onClick={() => navigate(-1)} className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-[#0e1b12] dark:text-white">
            <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
        </button>
        <h2 className="text-[#0e1b12] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">{getPageTitle()}</h2>
        <div className="relative flex w-10 items-center justify-end">
             <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-[#0e1b12] dark:text-white"
             >
                <span className="material-symbols-outlined text-2xl">more_horiz</span>
            </button>

            {/* Action Menu Dropdown */}
            {isMenuOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                    <div className="absolute top-12 right-0 z-50 min-w-[160px] overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-xl border border-gray-100 dark:border-white/10 animate-in fade-in zoom-in duration-100 origin-top-right">
                        {fridgeId ? (
                            <div className="flex flex-col py-1">
                                <button
                                    onClick={handleOpenEditModal}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-text-main-light dark:text-text-main-dark hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                    보관 장소 수정
                                </button>
                                <button
                                    onClick={async () => {
                                        setIsMenuOpen(false);
                                        // Need to verify name for confirm dialog
                                        const currentFridge = fridges.find(f => f.id === fridgeId);
                                        const name = currentFridge ? currentFridge.name : fridgeNameParam;
                                        if (!confirm(`'${name}' 냉장고를 삭제하시겠습니까?`)) return;
                                        try {
                                            await deleteFridge(fridgeId);
                                            navigate('/');
                                        } catch (e) {
                                            alert(e.message);
                                        }
                                    }}
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 active:bg-red-100 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                    보관 장소 삭제
                                </button>
                            </div>
                        ) : (
                            <div className="px-4 py-3 text-xs text-gray-500 text-center">
                                관리 가능한 보관 장소가 아닙니다.
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
      </header>

      {/* Stats Dashboard (Simplified) */}
      <div className="px-4 py-4">
        <div className="flex flex-wrap gap-3">
            {/* Safe (Green) */}
            <div className="flex flex-1 flex-col gap-1 rounded-xl bg-surface-light dark:bg-surface-dark shadow-sm border border-green-100 dark:border-green-900/30 p-4 items-center text-center">
                <p className="text-green-600 dark:text-green-400 tracking-tight text-3xl font-bold leading-tight">
                    {filteredItems.filter(i => {
                        if (!i.expiryDate) return true;
                        const d = getDaysUntilExpiry(i.expiryDate);
                        return d > 3;
                    }).length}
                </p>
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <p className="text-xs font-medium leading-normal">안전 (여유)</p>
                </div>
            </div>

            {/* Expiring (Orange) */}
            <div className="flex flex-1 flex-col gap-1 rounded-xl bg-surface-light dark:bg-surface-dark shadow-sm border border-orange-100 dark:border-orange-900/30 p-4 items-center text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-orange-500/5 dark:bg-orange-500/10"></div>
                <p className="text-orange-600 dark:text-orange-400 tracking-tight text-3xl font-bold leading-tight">
                    {filteredItems.filter(i => {
                        const d = getDaysUntilExpiry(i.expiryDate);
                        return d >= 0 && d <= 3;
                    }).length}
                </p>
                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    <p className="text-xs font-medium leading-normal">유통기한 임박</p>
                </div>
            </div>

            {/* Expired (Red) */}
            {filteredItems.some(i => getDaysUntilExpiry(i.expiryDate) < 0) && (
                <div className="flex flex-1 flex-col gap-1 rounded-xl bg-surface-light dark:bg-surface-dark shadow-sm border border-red-100 dark:border-red-900/30 p-4 items-center text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/5 dark:bg-red-500/10"></div>
                    <p className="text-red-600 dark:text-red-400 tracking-tight text-3xl font-bold leading-tight">
                        {filteredItems.filter(i => getDaysUntilExpiry(i.expiryDate) < 0).length}
                    </p>
                    <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <span className="material-symbols-outlined text-sm">error</span>
                        <p className="text-xs font-medium leading-normal">만료됨</p>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* SearchBar */}
      <div className="px-4 pb-2">
        <label className="flex flex-col w-full">
            <div className="flex w-full items-center rounded-xl h-12 bg-surface-light dark:bg-surface-dark shadow-sm border border-transparent focus-within:border-primary transition-colors overflow-hidden">
                <div className="text-primary dark:text-primary/80 flex items-center justify-center pl-4 pr-2">
                    <span className="material-symbols-outlined text-2xl">search</span>
                </div>
                <input 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex w-full min-w-0 flex-1 resize-none bg-transparent text-[#0e1b12] dark:text-white placeholder:text-gray-400 focus:outline-none h-full px-2 text-base font-normal leading-normal" 
                    placeholder="어떤 음식을 찾으세요?"
                />
            </div>
        </label>
      </div>

      {/* Chips (Filter) */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto hide-scrollbar pb-4">
        {[
            { id: 'all', label: '전체', icon: 'check' },
            { id: 'expiring', label: '임박', icon: 'hourglass_bottom' },
            { id: 'expired', label: '만료', icon: 'error' },
            { id: 'fridge', label: '냉장', icon: 'ac_unit' },
            { id: 'freezer', label: '냉동', icon: 'inventory_2' }
        ].map(filter => (
            <button 
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full pl-3 pr-4 active:scale-95 transition-all
                    ${activeFilter === filter.id 
                        ? 'bg-[#19e65e] dark:bg-[#19e65e] shadow-md shadow-[#19e65e]/20' 
                        : 'bg-surface-light dark:bg-surface-dark border border-gray-100 dark:border-white/10'}`}
            >
                <span className={`material-symbols-outlined text-sm ${activeFilter === filter.id ? 'text-[#0e1b12]' : 'text-gray-500'}`}>
                    {filter.icon}
                </span>
                <p className={`text-sm font-medium leading-normal ${activeFilter === filter.id ? 'text-[#0e1b12] font-bold' : 'text-gray-600 dark:text-gray-300'}`}>
                    {filter.label}
                </p>
            </button>
        ))}
      </div>

      {/* List Section */}
      <div className="px-4 mt-2 mb-20">
        <div className="flex flex-col gap-3">
            {filteredItems.map(item => {
                const days = getDaysUntilExpiry(item.expiryDate);
                const badge = getDDayBadge(days);

                // Find fridge name if not in fridge context
                const itemFridge = !fridgeId && fridges.find(f => f.id === item.fridgeId);

                return (
                    <div 
                        key={item.id} 
                        onClick={() => setSelectedItem(item)}
                        className="group flex items-center gap-4 rounded-2xl bg-surface-light dark:bg-surface-dark p-3 shadow-sm border border-transparent hover:shadow-md active:scale-[0.99] transition-all cursor-pointer"
                    >
                        <div className="relative flex size-14 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 overflow-hidden">
                            {item.photoUrl ? (
                                <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover opacity-90" />
                            ) : (
                                <span className="material-symbols-outlined text-gray-400">image</span>
                            )}
                            {/* Color bar indicator based on expiry? Or category? Let's use logic later */}
                            <div className={`absolute bottom-0 w-full h-1 ${days <= 3 ? 'bg-red-500' : 'bg-primary'}`}></div>
                        </div>
                        <div className="flex flex-1 flex-col justify-center">
                            <p className="text-[#0e1b12] dark:text-white text-base font-bold leading-tight">{item.name}</p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-medium leading-normal mt-0.5">
                                {item.category} • {item.quantity}{item.unit}
                            </p>
                            {/* Show Fridge Name if in "All Items" view */}
                            {itemFridge && (
                                <p className="text-primary text-[10px] font-bold mt-1 bg-primary/10 w-fit px-1.5 py-0.5 rounded-md">
                                    {itemFridge.name}
                                </p>
                            )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {days <= 7 ? (
                                <div className={`flex items-center justify-center rounded-lg px-2.5 py-1.5 text-sm font-bold leading-none ${badge.color}`}>
                                    {badge.text}
                                </div>
                            ) : (
                                <>
                                    <p className="text-[#0e1b12] dark:text-white text-sm font-bold">{days}일 남음</p>
                                    <p className="text-gray-400 text-xs">~{item.expiryDate?.slice(5).replace('-', '.')}</p>
                                </>
                            )}
                            
                            {/* Actions */}
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if(confirm(`${item.name}을(를) 소비 처리하시겠습니까?`)) {
                                        consumeItem(item.id);
                                    }
                                }}
                                className="z-10 bg-primary/10 hover:bg-primary/20 text-primary p-1.5 rounded-full transition-colors"
                                title="소비 완료"
                            >
                                <span className="material-symbols-outlined text-[20px]">check</span>
                            </button>
                        </div>
                    </div>
                );
            })}
            
            {filteredItems.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                    등록된 음식이 없습니다.
                </div>
            )}
        </div>
      </div>

      {/* FAB (Floating Action Button) - Optional if Bottom Nav has Add */}
      <div className="fixed bottom-24 right-5 z-40">
        <Link to="/add" className="flex size-14 items-center justify-center rounded-full bg-[#19e65e] text-[#0e1b12] shadow-lg shadow-[#19e65e]/40 hover:scale-105 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-3xl">add</span>
        </Link>
      </div>

      {/* Edit Fridge Modal (Reused UI from FridgeList) */}
      {isEditModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-surface-light dark:bg-surface-dark w-full max-w-sm rounded-2xl p-6 shadow-xl border border-white/10">
                  <h3 className="text-lg font-bold mb-4">보관 장소 수정</h3>
                  <form onSubmit={handleUpdateFridge} className="flex flex-col gap-4">
                      <div>
                          <label className="block text-sm font-medium mb-1">이름</label>
                          <input
                            value={editFridgeName}
                            onChange={e => setEditFridgeName(e.target.value)}
                            placeholder="예: 김치냉장고"
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent p-3 outline-none focus:border-primary"
                            autoFocus
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium mb-1">종류</label>
                          <div className="grid grid-cols-2 gap-2">
                             {['fridge', 'kimchi', 'freezer', 'pantry'].map(type => (
                                 <button
                                    key={type}
                                    type="button"
                                    onClick={() => setEditFridgeType(type)}
                                    className={`p-2 rounded-lg border text-sm font-medium transition-all ${editFridgeType === type ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                                 >
                                     {type === 'fridge' && '냉장고'}
                                     {type === 'kimchi' && '김치냉장고'}
                                     {type === 'freezer' && '냉동고'}
                                     {type === 'pantry' && '팬트리'}
                                 </button>
                             ))}
                          </div>
                      </div>
                      <div className="flex flex-col gap-2 mt-2">
                          <div className="flex gap-2">
                              <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 font-bold text-gray-600 dark:text-gray-300">취소</button>
                              <button type="submit" className="flex-1 py-3 rounded-xl bg-primary text-background-dark font-bold shadow-lg shadow-primary/20">저장하기</button>
                          </div>

                          <button
                            type="button"
                            onClick={handleDeleteFridge}
                            className="w-full py-3 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold mt-2 hover:bg-red-100 dark:hover:bg-red-900/20 active:scale-95 transition-all"
                          >
                                삭제하기
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedItem(null)}>
            <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-3xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                
                {/* Image Header */}
                <div className="relative h-64 w-full bg-gray-100 dark:bg-black/20">
                    {selectedItem.photoUrl ? (
                        <img src={selectedItem.photoUrl} alt={selectedItem.name || 'Food Item'} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                            <span className="material-symbols-outlined text-6xl">image_not_supported</span>
                            <span className="text-sm">사진 없음</span>
                        </div>
                    )}
                    <button 
                        onClick={() => setSelectedItem(null)}
                        className="absolute top-4 right-4 size-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col gap-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <span className="inline-block px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
                                {selectedItem.category || '카테고리 없음'}
                            </span>
                            <h2 className="text-2xl font-bold text-[#0e1b12] dark:text-white leading-tight">
                                {selectedItem.name || '이름 없음'}
                            </h2>
                        </div>
                        <div className="text-right">
                             <div className="text-lg font-bold text-primary">
                                 {selectedItem.quantity || 1} {selectedItem.unit || '개'}
                             </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5">
                            <p className="text-xs text-text-sub-light mb-1">유통기한</p>
                            <p className="font-bold text-[#0e1b12] dark:text-white">
                                {selectedItem.expiryDate ? new Date(selectedItem.expiryDate).toISOString().split('T')[0] : '미지정'} 
                                {selectedItem.expiryDate && (
                                    <span className={`ml-2 text-xs ${getDaysUntilExpiry(selectedItem.expiryDate) <= 3 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                                        (D-{getDaysUntilExpiry(selectedItem.expiryDate)})
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5">
                            <p className="text-xs text-text-sub-light mb-1">등록일</p>
                            <p className="font-bold text-[#0e1b12] dark:text-white">
                                {selectedItem.addedDate ? new Date(selectedItem.addedDate).toISOString().split('T')[0] : '-'}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-2">
                         <button
                            onClick={() => {
                                // Navigate to edit
                                navigate('/add', { state: { editItem: selectedItem } });
                            }}
                            className="flex-1 py-4 rounded-2xl bg-gray-100 dark:bg-white/10 text-[#0e1b12] dark:text-white font-bold transition-colors flex items-center justify-center gap-1"
                        >
                             <span className="material-symbols-outlined text-[18px]">edit</span>
                            수정
                        </button>
                        <button 
                            onClick={() => {
                                if(confirm('삭제하시겠습니까? (소비되지 않음)')) {
                                    deleteItem(selectedItem.id);
                                    setSelectedItem(null);
                                }
                            }}
                            className="flex-1 py-4 rounded-2xl border border-red-100 dark:border-red-900/30 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                        >
                            삭제
                        </button>
                        <button 
                            onClick={() => {
                                consumeItem(selectedItem.id);
                                setSelectedItem(null);
                            }}
                            className="flex-[2] py-4 rounded-2xl bg-primary text-[#0e1b12] font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">check</span>
                            소비 완료
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </>
  );
}
