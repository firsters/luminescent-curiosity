import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFridge } from "../context/FridgeContext";
import { useInventory } from "../context/InventoryContext";
import Toast from "../components/Toast";

export default function FridgeList() {
  const { logout } = useAuth();
  const {
    fridges,
    loading: fridgeLoading,
    error: fridgeError, // Get sensitive error
    addFridge,
    deleteFridge,
    updateFridge,
  } = useFridge();
  const { items } = useInventory(); // To calculate stats
  const navigate = useNavigate();

  // Edit Mode state
  const [isEditMode, setIsEditMode] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ visible: false, message: "" });

  const showToast = (message) => {
    setToast({ visible: true, message });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  // Local state for Fridge modal (Add/Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // 'add' or 'edit'
  const [editingId, setEditingId] = useState(null);
  const [fridgeName, setFridgeName] = useState("");
  const [fridgeType, setFridgeType] = useState("fridge"); // fridge, freezer, pantry, kimchi

  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingId(null);
    setFridgeName("");
    setFridgeType("fridge");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (fridge) => {
    setModalMode("edit");
    setEditingId(fridge.id);
    setFridgeName(fridge.name);
    setFridgeType(fridge.type);
    setIsModalOpen(true);
  };

  const handleSaveFridge = async (e) => {
    e.preventDefault();
    const nameToSave = fridgeName.trim();
    if (!nameToSave) return;

    // Check for duplicates
    const isDuplicate = fridges.some((f) => {
      // Skip current fridge if editing
      if (modalMode === "edit" && f.id === editingId) return false;
      return f.name.toLowerCase() === nameToSave.toLowerCase();
    });

    if (isDuplicate) {
      alert("이미 존재하는 이름입니다. 다른 이름을 입력해주세요.");
      return;
    }

    try {
      if (modalMode === "add") {
        await addFridge({
          name: fridgeName,
          type: fridgeType,
          icon: "kitchen", // Default icon logic can be improved
        });
      } else {
        await updateFridge(editingId, {
          name: fridgeName,
          type: fridgeType,
        });
      }
      setIsModalOpen(false);
      setFridgeName("");
      setFridgeType("fridge");
    } catch (error) {
      alert("Failed to save fridge: " + error.message);
    }
  };

  const handleDeleteFridge = async (e, id, name) => {
    e.preventDefault(); // Prevent Link navigation
    e.stopPropagation();

    if (
      !confirm(
        `'${name}' 냉장고를 삭제하시겠습니까?\n주의: 보관 중인 모든 음식이 함께 삭제됩니다.`
      )
    )
      return;

    try {
      await deleteFridge(id);
    } catch (error) {
      alert("냉장고 삭제 실패: " + error.message);
    }
  };

  // Helper to count items per fridge (client-side for now)
  const getItemCount = (fridgeId) => {
    // Logic: items need to have 'fridgeId' field AND be available
    return items.filter(
      (i) => i.fridgeId === fridgeId && i.status === "available"
    ).length;
  };

  // Stats Helpers (Global)
  const safeCount = items.filter((i) => {
    if (i.status !== "available") return false;
    if (!i.expiryDate) return true; // No expiry = Safe
    const days = Math.ceil((i.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    return days > 3;
  }).length;

  const expiringCount = items.filter((i) => {
    if (i.status !== "available") return false;
    if (!i.expiryDate) return false;
    const days = Math.ceil((i.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    return days >= 0 && days <= 3;
  }).length;

  const expiredCount = items.filter((i) => {
    if (i.status !== "available") return false;
    if (!i.expiryDate) return false;
    const days = Math.ceil((i.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    return days < 0;
  }).length;

  // Handle Card Click
  const handleStatCardClick = (type, count) => {
    if (count > 0) {
      navigate(`/inventory?filter=${type}`);
    } else {
      showToast("해당하는 항목이 없습니다.");
    }
  };

  // Fridge Type Visuals
  const getFridgeVisual = (type) => {
    switch (type) {
      case "fridge":
        return { icon: "kitchen", color: "text-primary" };
      case "kimchi":
        return { icon: "ac_unit", color: "text-red-500" };
      case "freezer":
        return { icon: "severe_cold", color: "text-blue-500" };
      case "pantry":
        return { icon: "shelves", color: "text-orange-500" };
      default:
        return { icon: "kitchen", color: "text-gray-500" };
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 px-4 py-3 backdrop-blur-md">
        <div className="flex size-10 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10">
          <span className="material-symbols-outlined text-text-main-light dark:text-text-main-dark">
            menu
          </span>
        </div>
        <h1 className="flex-1 text-center text-lg font-bold leading-tight tracking-tight text-text-main-light dark:text-text-main-dark">
          나의 냉장고
        </h1>
        <div className="flex items-center justify-end gap-2">
          <button className="flex size-10 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10">
            <span className="material-symbols-outlined text-text-main-light dark:text-text-main-dark">
              notifications
            </span>
          </button>
          <button
            onClick={logout}
            className="flex size-10 items-center justify-center rounded-full active:bg-black/5 dark:active:bg-white/10"
          >
            <span className="material-symbols-outlined text-text-main-light dark:text-text-main-dark">
              logout
            </span>
          </button>
        </div>
      </header>

      <main className="flex flex-col gap-6 px-4 pt-4 pb-20">
        {/* Stats Row */}
        <div className="flex w-full gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => handleStatCardClick("safe", safeCount)}
            className="flex min-w-[140px] flex-col rounded-2xl bg-primary/10 p-4 dark:bg-surface-dark border border-primary/20 active:scale-95 transition-transform text-left"
          >
            <span className="text-xs font-semibold text-text-sub-light dark:text-text-sub-dark">
              여유
            </span>
            <span className="mt-1 text-2xl font-bold text-text-main-light dark:text-text-main-dark">
              {safeCount}개
            </span>
          </button>
          <button
            onClick={() => handleStatCardClick("expiring", expiringCount)}
            className="flex min-w-[140px] flex-col rounded-2xl bg-orange-50 p-4 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 active:scale-95 transition-transform text-left"
          >
            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
              소비기한 임박
            </span>
            <span className="mt-1 text-2xl font-bold text-orange-600 dark:text-orange-400">
              {expiringCount}개
            </span>
          </button>
          <button
            onClick={() => handleStatCardClick("expired", expiredCount)}
            className="flex min-w-[140px] flex-col rounded-2xl bg-red-50 p-4 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 active:scale-95 transition-transform text-left"
          >
            <span className="text-xs font-semibold text-red-600 dark:text-red-400">
              소비기한 만료
            </span>
            <span className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
              {expiredCount}개
            </span>
          </button>
        </div>

        {/* Fridge Grid */}
        <div>
          {fridgeError && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl">
              데이터 불러오기 오류: {fridgeError}
            </div>
          )}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-text-main-light dark:text-text-main-dark">
              보관 장소 목록
            </h2>
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-4 py-2 text-sm font-bold rounded-full transition-colors ${
                isEditMode
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              }`}
            >
              {isEditMode ? "완료" : "편집"}
            </button>
          </div>

          {fridgeLoading ? (
            <div className="text-center py-10">Loading...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {fridges.map((fridge) => {
                const visual = getFridgeVisual(fridge.type);
                const count = getItemCount(fridge.id); // TODO: Implement real count later

                const CardContent = (
                  <>
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {/* Visual Image */}
                      <div
                        className={`absolute inset-0 bg-cover bg-center transition-transform duration-500 ${
                          !isEditMode && "group-hover:scale-110"
                        }`}
                        style={{
                          backgroundImage: `url('/images/${fridge.type}_${
                            // Get index of this fridge in the filtered list (or fallback to logic)
                            // A simple deterministic way: Parse int from ID if possible, or use string hash
                            // For this simple app, we can just use the index from the map if we want, OR
                            // use a simple hash of the ID to keep it consistent per fridge.
                            (fridge.id
                              .split("")
                              .reduce(
                                (acc, char) => acc + char.charCodeAt(0),
                                0
                              ) %
                              3) +
                            1
                          }.png')`,
                        }}
                      ></div>
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>

                      {/* Icon Badge */}
                      <div className="absolute right-2 bottom-2 rounded-full bg-white/90 dark:bg-black/60 p-2 backdrop-blur-sm shadow-sm">
                        <span
                          className={`material-symbols-outlined text-2xl ${visual.color}`}
                        >
                          {visual.icon}
                        </span>
                      </div>

                      {/* Delete Button (Only in Edit Mode) */}
                      {isEditMode && (
                        <>
                          <button
                            onClick={(e) =>
                              handleDeleteFridge(e, fridge.id, fridge.name)
                            }
                            className="absolute top-2 right-2 size-10 rounded-full bg-red-500 flex items-center justify-center text-white shadow-md animate-in zoom-in duration-200"
                          >
                            <span className="material-symbols-outlined text-xl">
                              delete
                            </span>
                          </button>

                          {/* Edit Indicator Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                            <div className="size-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                              <span className="material-symbols-outlined text-white">
                                edit
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col p-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark truncate">
                          {fridge.name}
                        </h3>
                      </div>
                      <div className="mt-1 text-sm font-medium text-text-sub-light dark:text-text-sub-dark">
                        {count}개 항목
                      </div>
                    </div>
                  </>
                );

                if (isEditMode) {
                  return (
                    <div
                      key={fridge.id}
                      onClick={() => handleOpenEditModal(fridge)}
                      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm ring-1 ring-primary/50 dark:ring-primary/50 transition-all active:scale-95 animate-pulse-once"
                    >
                      {CardContent}
                    </div>
                  );
                }

                return (
                  <Link
                    key={fridge.id}
                    to={`/inventory?fridgeId=${fridge.id}&fridgeName=${fridge.name}`}
                    className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-all hover:shadow-md active:scale-95"
                  >
                    {CardContent}
                  </Link>
                );
              })}

              {/* Add New Fridge Button */}
              <button
                onClick={handleOpenAddModal}
                className="group flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-6 transition-all hover:bg-primary/10 active:scale-95 active:bg-primary/20 aspect-[4/5] min-h-[160px]"
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-primary text-background-dark shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">add</span>
                </div>
                <span className="text-sm font-bold text-text-main-light dark:text-text-main-dark">
                  새 냉장고 추가
                </span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Fridge Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface-light dark:bg-surface-dark w-full max-w-sm rounded-2xl p-6 shadow-xl border border-white/10">
            <h3 className="text-lg font-bold mb-4">
              {modalMode === "add" ? "새 보관 장소 추가" : "보관 장소 수정"}
            </h3>
            <form onSubmit={handleSaveFridge} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">이름</label>
                <input
                  value={fridgeName}
                  onChange={(e) => setFridgeName(e.target.value)}
                  placeholder="예: 김치냉장고"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent p-3 outline-none focus:border-primary"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">종류</label>
                <div className="grid grid-cols-2 gap-2">
                  {["fridge", "kimchi", "freezer", "pantry"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFridgeType(type)}
                      className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                        fridgeType === type
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-gray-200 dark:border-gray-700 text-gray-500"
                      }`}
                    >
                      {type === "fridge" && "냉장고"}
                      {type === "kimchi" && "김치냉장고"}
                      {type === "freezer" && "냉동고"}
                      {type === "pantry" && "팬트리"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 font-bold text-gray-600 dark:text-gray-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-primary text-background-dark font-bold shadow-lg shadow-primary/20"
                >
                  {modalMode === "add" ? "추가하기" : "저장하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        isVisible={toast.visible}
        onClose={hideToast}
      />
    </>
  );
}
