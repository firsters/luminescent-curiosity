import { useNavigate } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { items, deleteItem } = useInventory();
  
  // Filter only consumed items
  const historyItems = items.filter(item => item.status === 'consumed').sort((a, b) => {
      // Sort by consumedDate desc
      return (b.consumedDate?.seconds || 0) - (a.consumedDate?.seconds || 0);
  });

  // Calculate Stats
  const thisMonthCount = historyItems.filter(item => {
      const date = item.consumedDate ? new Date(item.consumedDate) : new Date();
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;
  
  const mostRecentItem = historyItems.length > 0 ? historyItems[0] : null;

  // Group by Date
  const groupedItems = historyItems.reduce((acc, item) => {
      const date = item.consumedDate ? new Date(item.consumedDate) : new Date(); // Fallback to now if missing
      const dateStr = `${date.getMonth() + 1}월 ${date.getDate()}일`;
      
      const today = new Date();
      const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
      
      let label = dateStr;
      if (date.toDateString() === today.toDateString()) label = `오늘 ${dateStr}`;
      else if (date.toDateString() === yesterday.toDateString()) label = `어제 ${dateStr}`;
      
      if (!acc[label]) acc[label] = [];
      acc[label].push(item);
      return acc;
  }, {});

  const handleDelete = async (id) => {
      if(confirm('기록을 영구 삭제하시겠습니까?')) {
          await deleteItem(id);
      }
  };

  return (
    <div className="flex h-full min-h-screen w-full flex-col bg-background-light dark:bg-background-dark pb-20">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm border-b border-border-light dark:border-border-dark">
        <div className="flex items-center p-4 justify-between h-16">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="flex items-center justify-center text-text-main-light dark:text-text-main-dark">
                    <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                </button>
                <h2 className="text-text-main-light dark:text-text-main-dark text-xl font-bold leading-tight tracking-tight">소비 기록</h2>
            </div>
        </div>
      </header>

      {/* Stats Summary */}
      <section className="px-4 py-4 w-full">
        <div className="flex gap-3 w-full">
            <div className="flex flex-1 flex-col justify-between rounded-xl bg-gradient-to-br from-green-50 to-white dark:from-surface-dark dark:to-background-dark border border-primary/20 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary text-xl">shopping_basket</span>
                    <span className="text-text-sub-light dark:text-text-sub-dark text-xs font-semibold uppercase tracking-wider">이번 달 소비</span>
                </div>
                <p className="text-text-main-light dark:text-text-main-dark tracking-tight text-3xl font-extrabold">{thisMonthCount}<span className="text-base font-medium text-text-sub-light dark:text-text-sub-dark ml-1">개</span></p>
            </div>
            <div className="flex flex-1 flex-col justify-between rounded-xl bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-text-sub-light dark:text-text-sub-dark text-xl">schedule</span>
                    <span className="text-text-sub-light dark:text-text-sub-dark text-xs font-semibold uppercase tracking-wider">가장 최근</span>
                </div>
                <p className="text-text-main-light dark:text-text-main-dark tracking-tight text-lg font-bold truncate">
                    {mostRecentItem ? mostRecentItem.name : '-'}
                </p>
            </div>
        </div>
      </section>

      {/* List Content */}
      <div className="flex-1 flex flex-col px-4 pb-20">
          {Object.keys(groupedItems).length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-center">
                   <div className="size-24 bg-gray-100 dark:bg-surface-dark rounded-full flex items-center justify-center mb-4">
                       <span className="material-symbols-outlined text-4xl text-gray-400">history</span>
                   </div>
                   <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark mb-1">소비 기록이 없어요</h3>
                   <p className="text-sm text-text-sub-light dark:text-text-sub-dark">음식을 다 먹고 체크하면 기록됩니다.</p>
               </div>
          ) : (
              Object.entries(groupedItems).map(([dateLabel, items]) => (
                  <div key={dateLabel} className="mb-2">
                      <div className="sticky top-[120px] z-10 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-sm py-2 border-b border-dashed border-border-light dark:border-border-dark">
                          <h3 className="text-text-main-light dark:text-text-main-dark text-sm font-bold leading-tight flex items-center gap-2">
                              {dateLabel.split(' ')[0]} <span className="text-primary font-medium">{dateLabel.split(' ').slice(1).join(' ')}</span>
                          </h3>
                      </div>
                      <div className="flex flex-col">
                          {items.map(item => (
                              <div key={item.id} className="group relative flex items-center gap-4 py-3 hover:bg-white dark:hover:bg-surface-dark transition-colors border-b border-border-light/50 dark:border-border-dark/50 last:border-0 pl-2 pr-2 rounded-xl">
                                  <div className="flex shrink-0 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 size-12 shadow-sm">
                                      {item.photoUrl ? (
                                        <img src={item.photoUrl} alt="" className="w-full h-full object-cover rounded-xl opacity-80" />
                                      ) : (
                                        <span className="material-symbols-outlined">nutrition</span>
                                      )}
                                  </div>
                                  <div className="flex flex-1 flex-col justify-center min-w-0">
                                      <div className="flex justify-between items-start">
                                          <p className="text-text-main-light dark:text-text-main-dark text-base font-bold leading-tight truncate pr-2">{item.name}</p>
                                          <span className="text-text-sub-light dark:text-text-sub-dark text-xs font-medium whitespace-nowrap">
                                              {item.consumedDate ? new Date(item.consumedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                          </span>
                                      </div>
                                      <div className="flex items-center mt-1 gap-2">
                                          <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-white/10 px-2 py-0.5 text-xs font-medium text-text-sub-light dark:text-text-sub-dark ring-1 ring-inset ring-gray-500/10">
                                              {item.quantity}{item.unit}
                                          </span>
                                      </div>
                                  </div>
                                  <button onClick={() => handleDelete(item.id)} className="shrink-0 size-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                                      <span className="material-symbols-outlined text-[20px]">delete_outline</span>
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              ))
          )}
      </div>

    </div>
  );
}
