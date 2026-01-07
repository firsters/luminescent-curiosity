import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { safeDateToIso, getDaysUntilExpiry } from "../lib/dateUtils";
import { useInventory } from "../context/InventoryContext";
import { useModal } from "../context/ModalContext";
import { useFridge } from "../context/FridgeContext";
import { useState } from "react";
import {
  removeBackground,
  cropTransparent,
  cropToBox,
} from "../lib/imageProcessing";
import { uploadImage } from "../lib/storage";

export default function ItemDetailModal({
  item,
  fridgeName,
  onClose,
  onDelete,
  onConsume,
  onEdit,
  onNext,
  onPrev,
}) {
  const navigate = useNavigate();
  const { showConfirm, showAlert } = useModal();
  const { fridges } = useFridge();
  const { updateItem } = useInventory();

  const [isProcessing, setIsProcessing] = useState(false);

  const fridge = fridges.find((f) => f.name === fridgeName);
  const fridgeType = fridge?.type || "fridge";

  if (!item) return null;

  const days = getDaysUntilExpiry(item.expiryDate);

  // Swipe Logic
  let touchStartX = 0;
  let touchStartY = 0;

  const handleTouchStart = (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Minimum swipe distance & Horizontal dominant
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 2) {
      if (deltaX > 0 && onPrev) {
        onPrev(); // Swipe Right -> Prev
      } else if (deltaX < 0 && onNext) {
        onNext(); // Swipe Left -> Next
      }
    }
  };

  const handleRemoveBackground = async () => {
    if (!item.photoUrl) return;
    try {
      setIsProcessing(true);

      // 1. Fetch current image as Blob
      const response = await fetch(item.photoUrl);
      const blob = await response.blob();

      // 2. Remove Background
      const transparentBlob = await removeBackground(blob);

      // 3. Crop
      let croppedBlob;
      if (item.lastAiBox) {
        croppedBlob = await cropToBox(transparentBlob, item.lastAiBox);
      } else {
        croppedBlob = await cropTransparent(transparentBlob);
      }

      // 4. Upload
      const newUrl = await uploadImage(croppedBlob);

      // 5. Update Firestore
      await updateItem(item.id, {
        photoUrl: newUrl,
        lastAiBox: null, // Clear box after use
      });

      await showAlert("배경이 성공적으로 제거되었습니다!");
    } catch (error) {
      console.error("Manual BG removal failed:", error);
      await showAlert("배경 제거 중 오류가 발생했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Navigation Arrows (Desktop/Tablet or large phones) */}
      {onPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-10 size-12 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-3xl">
            chevron_left
          </span>
        </button>
      )}

      {onNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-10 size-12 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-full flex items-center justify-center transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-3xl">
            chevron_right
          </span>
        </button>
      )}

      <div
        className="w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-3xl overflow-hidden shadow-2xl relative transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image Header */}
        <div className="relative h-64 w-full bg-gray-100 dark:bg-black/20">
          {item.photoUrl ? (
            <img
              src={item.photoUrl}
              alt={item.name || "Food Item"}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
              <span className="material-symbols-outlined text-6xl">
                image_not_supported
              </span>
              <span className="text-sm">사진 없음</span>
            </div>
          )}

          {/* Background Removal Button */}
          {item.photoUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveBackground();
              }}
              disabled={isProcessing}
              className="absolute bottom-4 right-4 size-12 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 z-20"
              title="배경 제거"
            >
              {isProcessing ? (
                <span className="material-symbols-outlined animate-spin">
                  autorenew
                </span>
              ) : (
                <span className="material-symbols-outlined">auto_fix_high</span>
              )}
            </button>
          )}

          <button
            onClick={onClose}
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
                {item.category || "카테고리 없음"}
              </span>
              <h2 className="text-2xl font-bold text-[#0e1b12] dark:text-white leading-tight">
                {item.name || "이름 없음"}
              </h2>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                {item.capacity ? (
                  <span className="mr-2 text-base font-medium text-gray-500">
                    {item.capacity}
                    {item.capacityUnit}
                  </span>
                ) : null}
                {item.quantity} {item.unit}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5">
              <p className="text-xs text-text-sub-light mb-1">소비기한</p>
              <p className="font-bold text-[#0e1b12] dark:text-white">
                {item.expiryDate ? safeDateToIso(item.expiryDate) : "미지정"}
                {item.expiryDate && (
                  <span
                    className={`ml-2 text-xs ${
                      days <= 3 ? "text-red-500 font-bold" : "text-gray-400"
                    }`}
                  >
                    (D-{days})
                  </span>
                )}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5">
              <p className="text-xs text-text-sub-light mb-1">등록일</p>
              <p className="font-bold text-[#0e1b12] dark:text-white">
                {item.addedDate ? safeDateToIso(item.addedDate) : "-"}
              </p>
            </div>
            {/* Added Fridge Name Info */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 col-span-2">
              <p className="text-xs text-text-sub-light mb-1">보관 장소</p>
              <p className="font-bold text-[#0e1b12] dark:text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-gray-400">
                  {fridgeType === "freezer"
                    ? "ac_unit"
                    : fridgeType === "pantry"
                    ? "inventory_2"
                    : "kitchen"}
                </span>
                {fridgeName || "미지정"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            <button
              onClick={onEdit}
              className="flex-1 py-4 rounded-2xl bg-gray-100 dark:bg-white/10 text-[#0e1b12] dark:text-white font-bold transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[18px]">
                edit
              </span>
              수정
            </button>
            <button
              onClick={async () => {
                if (await showConfirm("삭제하시겠습니까? (소비되지 않음)")) {
                  onDelete();
                }
              }}
              className="flex-1 py-4 rounded-2xl border border-red-100 dark:border-red-900/30 text-red-500 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
            >
              삭제
            </button>
            <button
              onClick={onConsume}
              className="flex-[2] py-4 rounded-2xl bg-primary text-[#0e1b12] font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check</span>
              소비 완료
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
