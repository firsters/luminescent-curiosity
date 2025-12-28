import React from "react";

export default function GlobalModal({
  visible,
  type = "alert",
  message,
  onConfirm,
  onCancel,
  confirmText = "확인",
  cancelText = "취소",
}) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <p className="text-center text-lg font-bold leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
            {message}
          </p>
        </div>

        <div className="flex border-t border-slate-100 dark:border-white/5">
          {type === "confirm" && (
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-4 text-base font-bold text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors active:bg-slate-100 dark:active:bg-white/10"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`flex-1 px-6 py-4 text-base font-black transition-all active:scale-95
              ${
                type === "confirm"
                  ? "text-primary border-l border-slate-100 dark:border-white/5 hover:bg-primary/5"
                  : "text-primary hover:bg-primary/5"
              }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
