import React from "react";
import { useInstallPrompt } from "../context/InstallContext";

function ReloadPrompt() {
  const {
    offlineReady,
    needRefresh,
    updateServiceWorker,
    setOfflineReady,
    setNeedRefresh,
  } = useInstallPrompt();

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (!offlineReady && !needRefresh) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-0 p-4 z-[100]">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 flex flex-col gap-3 max-w-sm">
        <div className="text-sm text-gray-800 dark:text-gray-200">
          {offlineReady ? (
            <span>앱이 오프라인에서 사용할 준비가 되었습니다.</span>
          ) : (
            <span>새로운 컨텐츠가 사용 가능합니다. 업데이트하시겠습니까?</span>
          )}
        </div>
        <div className="flex gap-2 justify-end">
          {needRefresh && (
            <button
              className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-green-600 transition-colors"
              onClick={() => updateServiceWorker(true)}
            >
              업데이트
            </button>
          )}
          <button
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={close}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReloadPrompt;
