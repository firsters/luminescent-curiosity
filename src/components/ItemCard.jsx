import React, { useMemo } from "react";
import { getDaysUntilExpiry } from "../lib/dateUtils";
import { useInventory } from "../context/InventoryContext";
import { useModal } from "../context/ModalContext";

export default function ItemCard({
  item,
  fridgeName,
  onClick,
  onConsume,
  onRestore,
  onDelete,
  mode = "default",
}) {
  const { showConfirm } = useModal();
  const { days, badge, itemBgClass } = useMemo(() => {
    if (mode === "history") {
      const dateObj = new Date(item.consumedDate);
      const isValid = item.consumedDate && !isNaN(dateObj.getTime());

      const consumedTime = isValid
        ? dateObj.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";

      const consumedDateStr = isValid
        ? `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(
            2,
            "0"
          )}.${String(dateObj.getDate()).padStart(2, "0")}`
        : "";

      return {
        days: 0,
        badge: {
          text: consumedTime,
          subText: consumedDateStr,
          color: "text-[#0e1b12] dark:text-white font-bold",
          subColor: "text-gray-400 dark:text-gray-500",
        },
        itemBgClass:
          "bg-white dark:bg-surface-dark border-gray-100 dark:border-white/5",
      };
    }

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
        <div className="flex flex-wrap items-baseline gap-x-1.5 mb-0.5">
          <p className="text-[#0e1b12] dark:text-white text-base font-bold leading-tight min-w-[3rem]">
            {item.name}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium shrink-0">
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
          <div className="flex flex-col items-end">
            <p className={`text-sm ${badge.color}`}>{badge.text}</p>
            <p className={`text-[10px] ${badge.subColor}`}>{badge.subText}</p>
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
              {item.expiryDate instanceof Date &&
              !isNaN(item.expiryDate.getTime())
                ? `~${String(item.expiryDate.getMonth() + 1).padStart(
                    2,
                    "0"
                  )}.${String(item.expiryDate.getDate()).padStart(2, "0")}`
                : typeof item.expiryDate === "string" &&
                  item.expiryDate.length >= 10
                ? `~${item.expiryDate.slice(5).replace("-", ".")}`
                : ""}
            </p>
          </div>
        )}

        {/* Quick Action Button */}
        {mode === "history" ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (
                  await showConfirm(
                    `${item.name}을(를) 재고로 복구하시겠습니까?`
                  )
                ) {
                  onRestore(item.id);
                }
              }}
              className="z-10 bg-primary/10 hover:bg-primary/20 text-primary p-1.5 rounded-full transition-colors flex items-center justify-center"
              title="복구"
            >
              <span className="material-symbols-outlined text-[20px]">
                replay
              </span>
            </button>
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (await showConfirm("기록을 영구 삭제하시겠습니까?")) {
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
          </div>
        ) : (
          <button
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (
                await showConfirm(`${item.name}을(를) 소비 처리하시겠습니까?`)
              ) {
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
