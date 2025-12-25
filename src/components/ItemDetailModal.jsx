import { useNavigate } from "react-router-dom";
import { safeDateToIso, getDaysUntilExpiry } from "../lib/dateUtils";

export default function ItemDetailModal({
  item,
  fridgeName,
  onClose,
  onDelete,
  onConsume,
  onEdit,
}) {
  const navigate = useNavigate();

  if (!item) return null;

  const days = getDaysUntilExpiry(item.expiryDate);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface-light dark:bg-surface-dark rounded-3xl overflow-hidden shadow-2xl"
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
              <p className="font-bold text-[#0e1b12] dark:text-white">
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
              onClick={() => {
                if (confirm("삭제하시겠습니까? (소비되지 않음)")) {
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
    </div>
  );
}
