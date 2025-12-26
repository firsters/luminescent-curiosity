import { useState, useMemo } from "react";
import { useInventory } from "../context/InventoryContext";
import { useFridge } from "../context/FridgeContext";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ItemDetailModal from "../components/ItemDetailModal";
import ItemCard from "../components/ItemCard";
import { getDaysUntilExpiry, safeDateToIso } from "../lib/dateUtils";

export default function InventoryList() {
  const { items, loading, deleteItem, consumeItem } = useInventory();
  const { fridges } = useFridge();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL Params
  const fridgeId = searchParams.get("fridgeId");

  // We use URL param as the source of truth for activeFilter (Status) and activeCategory
  const activeFilter = searchParams.get("filter") || "all";
  const activeCategory = searchParams.get("category") || "all";

  const [searchTerm, setSearchTerm] = useState("");

  const DEFAULT_CATEGORIES = [
    { id: "all", label: "전체" },
    { id: "fruit", label: "과일" },
    { id: "vegetable", label: "채소" },
    { id: "meat", label: "육류" },
    { id: "dairy", label: "유제품" },
    { id: "frozen", label: "냉동" },
    { id: "drink", label: "음료" },
    { id: "sauce", label: "소스" },
    { id: "snack", label: "간식" },
  ];

  // Helper to update filter
  const handleFilterChange = (newFilter) => {
    const newParams = new URLSearchParams(searchParams);
    if (newFilter === "all") {
      newParams.delete("filter");
    } else {
      newParams.set("filter", newFilter);
    }
    setSearchParams(newParams);
  };

  const handleCategoryChange = (newCategory) => {
    const newParams = new URLSearchParams(searchParams);
    if (newCategory === "all") {
      newParams.delete("category");
    } else {
      newParams.set("category", newCategory);
    }
    setSearchParams(newParams);
  };

  // Modal State
  const [selectedItem, setSelectedItem] = useState(null);

  // Fridge ID to Name lookup
  const fridgeNameMap = useMemo(() => {
    return fridges.reduce((acc, fridge) => {
      acc[fridge.id] = fridge.name;
      return acc;
    }, {});
  }, [fridges]);

  // Determine current fridge title
  const getPageTitle = () => {
    const fridgeName = searchParams.get("fridgeName");
    if (fridgeName) return fridgeName;
    return "음식 목록";
  };

  const getDDayBadge = (days) => {
    if (days < 0)
      return {
        text: `D+${Math.abs(days)}`,
        color: "bg-gray-100 text-gray-500",
      };
    if (days <= 3)
      return {
        text: `D-${days}`,
        color: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
      };
    if (days <= 7)
      return {
        text: `D-${days}`,
        color:
          "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
      };
    return { text: `여유`, color: "text-[#0e1b12] dark:text-white font-bold" }; // Different style for safe items
  };

  // Base items for stats (filtered by fridge if applicable)
  const statBaseItems = useMemo(() => {
    if (!fridgeId) return items;
    return items.filter((i) => i.fridgeId === fridgeId);
  }, [items, fridgeId]);

  // Stats for the 3 Cards
  const safeCount = statBaseItems.filter((i) => {
    if (i.status !== "available") return false;
    if (!i.expiryDate) return true;
    const days = getDaysUntilExpiry(i.expiryDate);
    return days > 3;
  }).length;

  const expiringCount = statBaseItems.filter((i) => {
    if (i.status !== "available") return false;
    if (!i.expiryDate) return false;
    const days = getDaysUntilExpiry(i.expiryDate);
    return days >= 0 && days <= 3;
  }).length;

  const expiredCount = statBaseItems.filter((i) => {
    if (i.status !== "available") return false;
    if (!i.expiryDate) return false;
    const days = getDaysUntilExpiry(i.expiryDate);
    return days < 0;
  }).length;

  // Filter Logic
  const filteredItems = items.filter((item) => {
    // 0. Status Filter (Only show available items in this list)
    if (item.status === "consumed" || item.status === "discarded") return false;

    // 1. Text Search
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // 2. Fridge Context Filter (URL param)
    let matchesFridge = true;
    if (fridgeId) {
      matchesFridge = item.fridgeId === fridgeId;
    }

    // 3. UI Chip Filter (Active Status Filter)
    let matchesStatus = true;
    const daysUntil = getDaysUntilExpiry(item.expiryDate);

    if (activeFilter === "expiring") {
      matchesStatus = daysUntil >= 0 && daysUntil <= 3;
    } else if (activeFilter === "expired") {
      matchesStatus = daysUntil < 0;
    } else if (activeFilter === "safe") {
      // Safe means > 3 days OR no expiry
      if (item.expiryDate) {
        matchesStatus = daysUntil > 3;
      } else {
        matchesStatus = true; // No expiry is considered safe
      }
    }

    // 4. Category Filter
    let matchesCategory = true;
    if (activeCategory !== "all") {
      matchesCategory = item.foodCategory === activeCategory;
    }

    return matchesSearch && matchesFridge && matchesStatus && matchesCategory;
  });

  const navigate = useNavigate();

  if (loading)
    return <div className="p-8 text-center">Loading inventory...</div>;

  return (
    <>
      {/* TopAppBar */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md px-4 py-3 border-b border-black/5 dark:border-white/5">
        <button
          onClick={() => navigate(-1)}
          className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-[#0e1b12] dark:text-white"
        >
          <span className="material-symbols-outlined text-2xl">
            arrow_back_ios_new
          </span>
        </button>
        <h2 className="text-[#0e1b12] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
          {getPageTitle()}
        </h2>
        <div className="flex w-10 items-center justify-end">
          <button className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all text-[#0e1b12] dark:text-white">
            <span className="material-symbols-outlined text-2xl">
              more_horiz
            </span>
          </button>
        </div>
      </header>

      {/* Filter Cards (Replaced Stats Dashboard) */}
      <div className="px-4 py-4">
        {/* Status Filters */}
        <div className="flex w-full gap-3 overflow-x-auto pb-2 scrollbar-hide mb-2">
          {/* Safe Card */}
          <button
            onClick={() => handleFilterChange("safe")}
            className={`flex min-w-[100px] flex-1 flex-col rounded-2xl p-3 border transition-all active:scale-95 text-left
                    ${
                      activeFilter === "safe"
                        ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 ring-1 ring-green-400"
                        : "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30 opacity-70 hover:opacity-100"
                    }`}
          >
            <span className="text-xs font-semibold text-green-700 dark:text-green-300">
              여유
            </span>
            <span className="mt-1 text-xl font-bold text-green-700 dark:text-green-300">
              {safeCount}개
            </span>
          </button>

          {/* Expiring Card */}
          <button
            onClick={() => handleFilterChange("expiring")}
            className={`flex min-w-[100px] flex-1 flex-col rounded-2xl p-3 border transition-all active:scale-95 text-left
                    ${
                      activeFilter === "expiring"
                        ? "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 ring-1 ring-yellow-400"
                        : "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-100 dark:border-yellow-900/30 opacity-70 hover:opacity-100"
                    }`}
          >
            <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300">
              임박
            </span>
            <span className="mt-1 text-xl font-bold text-yellow-700 dark:text-yellow-300">
              {expiringCount}개
            </span>
          </button>

          {/* Expired Card */}
          <button
            onClick={() => handleFilterChange("expired")}
            className={`flex min-w-[100px] flex-1 flex-col rounded-2xl p-3 border transition-all active:scale-95 text-left
                    ${
                      activeFilter === "expired"
                        ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 ring-1 ring-red-400"
                        : "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 opacity-70 hover:opacity-100"
                    }`}
          >
            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
              만료
            </span>
            <span className="mt-1 text-xl font-bold text-red-600 dark:text-red-400">
              {expiredCount}개
            </span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex w-full gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {DEFAULT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors border
                        ${
                          activeCategory === cat.id
                            ? "bg-gray-800 text-white border-gray-900 dark:bg-white dark:text-black"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
                        }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* SearchBar */}
      <div className="px-4 pb-4">
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

      {/* List Section */}
      <div className="px-4 mt-0 pb-44">
        <div className="flex flex-col gap-3">
          {filteredItems.map((item) => {
            const days = getDaysUntilExpiry(item.expiryDate);
            const badge = getDDayBadge(days);

            let itemBgClass = "";
            if (days < 0) {
              itemBgClass =
                "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30";
            } else if (days <= 3) {
              itemBgClass =
                "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-100 dark:border-yellow-900/30";
            } else {
              itemBgClass =
                "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30";
            }

            return (
              <ItemCard
                key={item.id}
                item={item}
                fridgeName={fridgeNameMap[item.fridgeId] || "미지정"}
                onClick={() => setSelectedItem(item)}
                onConsume={consumeItem}
              />
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
        <Link
          to="/add"
          state={{ fridgeId }}
          className="flex size-14 items-center justify-center rounded-full bg-[#19e65e] text-[#0e1b12] shadow-lg shadow-[#19e65e]/40 hover:scale-105 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-3xl">add</span>
        </Link>
      </div>

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        fridgeName={
          selectedItem ? fridgeNameMap[selectedItem.fridgeId] || "미지정" : ""
        }
        onClose={() => setSelectedItem(null)}
        onEdit={() => {
          // Pass standardized date strings to avoid router serialization issues
          const safeItem = {
            ...selectedItem,
            expiryDate: safeDateToIso(selectedItem.expiryDate),
            addedDate: safeDateToIso(selectedItem.addedDate),
          };
          navigate("/add", { state: { editItem: safeItem } });
        }}
        onDelete={() => {
          deleteItem(selectedItem.id);
          setSelectedItem(null);
        }}
        onConsume={() => {
          consumeItem(selectedItem.id);
          setSelectedItem(null);
        }}
      />
    </>
  );
}
