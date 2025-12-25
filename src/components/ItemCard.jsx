import React, { useMemo } from "react";

export default function ItemCard({
  item,
  fridgeName,
  onClick,
  onConsume,
  onDelete,
  mode = "default",
}) {
  const { days, badge, itemBgClass } = useMemo(() => {
    if (mode === "history") {
      const consumedTime = item.consumedDate
        ? new Date(item.consumedDate).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";
      return {
        days: 0,
        badge: {
          text: consumedTime,
          color: "text-gray-500 dark:text-gray-400 font-medium",
        },
        itemBgClass:
          "bg-white dark:bg-surface-dark border-gray-100 dark:border-white/5",
      };
    }

    const getDaysUntilExpiry = (expiryDate) => {
      if (!expiryDate) return 999;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiry = new Date(expiryDate);
      expiry.setHours(0, 0, 0, 0);

      const diffTime = expiry - today;
      return Math.floor(diffTime / (1000 * 60 * 60 * 24));
    };

    const days = getDaysUntilExpiry(item.expiryDate);

    // Badge Logic
    let badge = { text: "", color: "" };
    if (days < 0) {
      badge = {
        text: `D+${Math.abs(days)}`,
        color: "bg-gray-100 text-gray-500",
      };
    } else if (days <= 3) {
      badge = {
        text: `D-${days}`,
        color: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
      };
    } else if (days <= 7) {
      badge = {
        text: `D-${days}`,
        color:
          "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
      };
    } else {
      badge = {
        text: `여유`,
        color: "text-[#0e1b12] dark:text-white font-bold",
      };
    }

    // Background Logic
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

    return { days, badge, itemBgClass };
  }, [item.expiryDate, item.consumedDate, mode]);

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-4 rounded-2xl p-3 shadow-sm border hover:shadow-md active:scale-[0.99] transition-all cursor-pointer relative overflow-hidden ${itemBgClass}`}
    >
      {/* Image Section (Style #1) */}
      <div className="relative flex size-14 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5 overflow-hidden">
        {item.photoUrl ? (
          <img
            src={item.photoUrl}
            alt={item.name}
            className="w-full h-full object-contain opacity-90"
          />
        ) : (
          <span className="material-symbols-outlined text-gray-400">image</span>
        )}
        <div
          className={`absolute bottom-0 w-full h-1 ${
            mode === "history"
              ? "bg-gray-300 dark:bg-gray-600"
              : days <= 3
              ? "bg-red-500"
              : "bg-primary"
          }`}
        ></div>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col justify-center min-w-0">
        {/* Name & Quantity */}
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-[#0e1b12] dark:text-white text-base font-bold leading-tight truncate">
            {item.name}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium whitespace-nowrap">
            {item.capacity ? `${item.capacity}${item.capacityUnit} × ` : ""}
            {item.quantity}
            {item.unit}
          </p>
        </div>

        {/* Fridge Name (Style #2) */}
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs font-medium">
          <span className="material-symbols-outlined text-[14px]">kitchen</span>
          <span className="truncate">{fridgeName}</span>
        </div>
      </div>

      {/* Right Side Section */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        {/* D-Day Badge / Time */}
        {mode === "history" ? (
          <div
            className={`flex items-center justify-center text-sm ${badge.color}`}
          >
            {badge.text}
          </div>
        ) : days <= 7 ? (
          <div
            className={`flex items-center justify-center rounded-lg px-2.5 py-1.5 text-sm font-bold leading-none ${badge.color}`}
          >
            {badge.text}
          </div>
        ) : (
          <div className="flex flex-col items-end">
            <p className="text-[#0e1b12] dark:text-white text-sm font-bold">
              여유
            </p>
            <p className="text-gray-400 text-[10px]">
              {item.expiryDate instanceof Date
                ? `~${String(item.expiryDate.getMonth() + 1).padStart(
                    2,
                    "0"
                  )}.${String(item.expiryDate.getDate()).padStart(2, "0")}`
                : typeof item.expiryDate === "string"
                ? `~${item.expiryDate.slice(5).replace("-", ".")}`
                : ""}
            </p>
          </div>
        )}

        {/* Quick Action Button */}
        {mode === "history" ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (confirm("기록을 영구 삭제하시겠습니까?")) {
                onDelete(item.id);
              }
            }}
            className="z-10 bg-gray-100 dark:bg-white/10 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 p-1.5 rounded-full transition-colors flex items-center justify-center"
            title="기록 삭제"
          >
            <span className="material-symbols-outlined text-[20px]">
              delete_outline
            </span>
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (confirm(`${item.name}을(를) 소비 처리하시겠습니까?`)) {
                onConsume(item.id);
              }
            }}
            className="z-10 bg-primary/10 hover:bg-primary/20 text-primary p-1.5 rounded-full transition-colors flex items-center justify-center"
            title="소비 완료"
          >
            <span className="material-symbols-outlined text-[20px]">check</span>
          </button>
        )}
      </div>
    </div>
  );
}
