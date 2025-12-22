import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFridge } from '../context/FridgeContext';
import { useInventory } from '../context/InventoryContext';

export default function FridgeList() {
  const { logout } = useAuth();
  const { fridges, loading: fridgeLoading, addFridge } = useFridge();
  const { items } = useInventory(); // To calculate stats

  // Local state for "Add Fridge" modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFridgeName, setNewFridgeName] = useState('');
  const [newFridgeType, setNewFridgeType] = useState('fridge'); // fridge, freezer, pantry, kimchi

  const handleAddFridge = async (e) => {
      e.preventDefault();
      if (!newFridgeName.trim()) return;

      try {
          await addFridge({
              name: newFridgeName,
              type: newFridgeType,
              icon: 'kitchen' // Default icon logic can be improved
          });
          setIsModalOpen(false);
          setNewFridgeName('');
          setNewFridgeType('fridge');
      } catch (error) {
          alert('Failed to add fridge: ' + error.message);
      }
  };

  // Helper to count items per fridge (client-side for now)
  const getItemCount = (fridgeId) => {
      // Logic: items need to have 'fridgeId' field AND be available
      return items.filter(i => i.fridgeId === fridgeId && i.status === 'available').length;
  };
  
  // Helper for "Expiring Soon" (Global)
  const expiringCount = items.filter(i => {
      if (!i.expiryDate) return false;
      const days = Math.ceil((i.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      return days <= 3;
  }).length;

  // Fridge Type Visuals
  const getFridgeVisual = (type) => {
      switch(type) {
          case 'fridge': return { icon: 'kitchen', color: 'text-primary' };
          case 'kimchi': return { icon: 'ac_unit', color: 'text-red-500' };
          case 'freezer': return { icon: 'severe_cold', color: 'text-blue-500' };
          case 'pantry': return { icon: 'shelves', color: 'text-orange-500' };
          default: return { icon: 'kitchen', color: 'text-gray-500' };
      }
  }

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 px-4 py-3 backdrop-blur-md">
        <div className="flex size-10 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10">
          <span className="material-symbols-outlined text-text-main-light dark:text-text-main-dark">menu</span>
        </div>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight text-text-main-light dark:text-text-main-dark">
            나의 냉장고
        </h1>
        <div className="flex items-center justify-end gap-2">
            <button className="flex size-10 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10">
                <span className="material-symbols-outlined text-text-main-light dark:text-text-main-dark">notifications</span>
            </button>
            <button onClick={logout} className="flex size-10 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10">
                <span className="material-symbols-outlined text-text-main-light dark:text-text-main-dark">logout</span>
            </button>
        </div>
      </header>
      
      <main className="flex flex-col gap-6 px-4 pt-4 pb-20">
        {/* Stats Row */}
        <div className="flex w-full gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <Link to="/inventory" className="flex min-w-[140px] flex-col rounded-2xl bg-primary/10 p-4 dark:bg-surface-dark border border-primary/20 active:scale-95 transition-transform">
                <span className="text-xs font-semibold text-text-sub-light dark:text-text-sub-dark">전체 보관</span>
                <span className="mt-1 text-2xl font-bold text-text-main-light dark:text-text-main-dark">{items.filter(i => i.status === 'available').length}개</span>
            </Link>
            <Link to="/inventory?filter=expiring" className="flex min-w-[140px] flex-col rounded-2xl bg-red-50 p-4 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 active:scale-95 transition-transform">
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">유통기한 임박</span>
                <span className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{expiringCount}개</span>
            </Link>
        </div>

        {/* Fridge Grid */}
        <div>
            <h2 className="mb-4 text-base font-bold text-text-main-light dark:text-text-main-dark">보관 장소 목록</h2>
            
            {fridgeLoading ? (
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    
                    {fridges.map(fridge => {
                        const visual = getFridgeVisual(fridge.type);
                        const count = getItemCount(fridge.id); // TODO: Implement real count later
                        
                        return (
                            <Link key={fridge.id} to={`/inventory?fridgeId=${fridge.id}&fridgeName=${fridge.name}`} className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-all hover:shadow-md active:scale-95">
                                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    {/* Visual with Unsplash Placeholder based on type? Or just generic */}
                                    <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" 
                                        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1584269668383-a7732d847844?q=80&w=800&auto=format&fit=crop")' }}>
                                    </div>
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                                    
                                    {/* Icon Badge */}
                                    <div className="absolute right-2 bottom-2 rounded-full bg-white/90 dark:bg-black/60 p-1.5 backdrop-blur-sm shadow-sm">
                                        <span className={`material-symbols-outlined text-lg ${visual.color}`}>{visual.icon}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col p-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-base font-bold text-text-main-light dark:text-text-main-dark truncate">{fridge.name}</h3>
                                    </div>
                                    <div className="mt-1 text-xs text-text-sub-light dark:text-text-sub-dark">
                                        {count}개 항목
                                    </div>
                                </div>
                            </Link>
                        );
                    })}

                    {/* Add New Fridge Button */}
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="group flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 transition-all hover:bg-primary/10 active:scale-95 active:bg-primary/20 aspect-[4/5] min-h-[160px]"
                    >
                        <div className="flex size-12 items-center justify-center rounded-full bg-primary text-background-dark shadow-sm group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined">add</span>
                        </div>
                        <span className="text-sm font-bold text-text-main-light dark:text-text-main-dark">새 냉장고 추가</span>
                    </button>

                </div>
            )}
        </div>
      </main>

      {/* Add Fridge Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-surface-light dark:bg-surface-dark w-full max-w-sm rounded-2xl p-6 shadow-xl border border-white/10">
                  <h3 className="text-lg font-bold mb-4">새 보관 장소 추가</h3>
                  <form onSubmit={handleAddFridge} className="flex flex-col gap-4">
                      <div>
                          <label className="block text-sm font-medium mb-1">이름</label>
                          <input 
                            value={newFridgeName}
                            onChange={e => setNewFridgeName(e.target.value)}
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
                                    onClick={() => setNewFridgeType(type)}
                                    className={`p-2 rounded-lg border text-sm font-medium transition-all ${newFridgeType === type ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}
                                 >
                                     {type === 'fridge' && '냉장고'}
                                     {type === 'kimchi' && '김치냉장고'}
                                     {type === 'freezer' && '냉동고'}
                                     {type === 'pantry' && '팬트리'}
                                 </button>
                             ))}
                          </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                          <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 font-bold text-gray-600 dark:text-gray-300">취소</button>
                          <button type="submit" className="flex-1 py-3 rounded-xl bg-primary text-background-dark font-bold shadow-lg shadow-primary/20">추가하기</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

    </>
  );
}
