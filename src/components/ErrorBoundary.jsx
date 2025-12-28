import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    // Clear potentially corrupted snapshots and reload
    localStorage.removeItem("fridgy_inventory_snapshot");
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark p-6 text-center">
          <div className="size-20 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-500 mb-6 animate-bounce">
            <span className="material-symbols-outlined text-4xl">warning</span>
          </div>
          <h2 className="text-xl font-bold mb-4 text-[#0e1b12] dark:text-white">
            화면을 불러오는 중 오류가 발생했습니다
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
            문제가 지속되면 아래 버튼을 눌러 데이터를 초기화하고 다시
            시도해주세요.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={this.handleReload}
              className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
            >
              데이터 초기화 및 다시 시도
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full py-4 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-2xl font-bold active:scale-95 transition-all"
            >
              홈으로 이동
            </button>
          </div>
          <div className="mt-8 text-[10px] text-gray-300 dark:text-gray-700 select-none">
            Error: {this.state.error?.message || "Unknown"}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
