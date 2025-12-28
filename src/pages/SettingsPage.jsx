import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useInventory } from "../context/InventoryContext";

import { useInstallPrompt } from "../context/InstallContext";
import { useTheme } from "../context/ThemeContext";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { currentUser, logout, familyId, joinFamily, checkLastMember } =
    useAuth();
  const { removeItemsByFilter } = useInventory();
  const { theme, setTheme } = useTheme();

  // Notification State
  const [expiryAlert, setExpiryAlert] = useState(true);
  // const [marketingAlert, setMarketingAlert] = useState(false);
  const [alertTiming, setAlertTiming] = useState("3"); // 7, 3, 1 days

  // Family State
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  // Install Prompt State
  const { deferredPrompt, clearPrompt, isIos, isStandalone } =
    useInstallPrompt();

  // Data Management Modal State
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [deleteFilters, setDeleteFilters] = useState({
    available: false,
    expired: false,
    consumed: false,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Account Deletion State
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false);

  const DeleteAccountModal = ({ isOpen, onClose }) => {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { deleteAccount } = useAuth(); // Use hook here
    const navigate = useNavigate();

    const handleDelete = async (e) => {
      e.preventDefault();
      if (!confirm("정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다."))
        return;

      setLoading(true);
      setError("");
      try {
        await deleteAccount(password);
        alert("회원 탈퇴가 완료되었습니다.");
        navigate("/login");
      } catch (err) {
        console.error(err);
        if (err.code === "auth/wrong-password") {
          setError("비밀번호가 올바르지 않습니다.");
        } else {
          setError("회원 탈퇴 중 오류가 발생했습니다: " + err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="bg-surface-light dark:bg-surface-dark w-full max-w-sm rounded-2xl p-6 shadow-xl border border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-bold mb-2 text-red-500 flex items-center gap-2">
            <span className="material-symbols-outlined">warning</span> 회원 탈퇴
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
            계정을 삭제하면 모든 데이터(메모, 설정 등)가{" "}
            <strong>영구적으로 삭제</strong>되며 복구할 수 없습니다.
          </p>

          <form onSubmit={handleDelete} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">
                비밀번호 확인
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-base text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 font-bold text-gray-600 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading || !password}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "처리 중..." : "탈퇴하기"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    clearPrompt();
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) return;

    if (inviteCode === familyId) {
      setJoinError("이미 현재 가족 그룹입니다.");
      return;
    }

    try {
      setIsJoining(true);
      setJoinError("");

      // Check if user is the last member of the current group
      const { isLastMember, currentFamilyId } = await checkLastMember();

      // Construct confirmation message based on status
      let message = `가족 코드 [${inviteCode}] 그룹으로 이동하시겠습니까?`;
      if (isLastMember && currentFamilyId) {
        message += `\n\n[주의] 현재 그룹의 마지막 멤버입니다. 이동 시 현재 그룹의 모든 데이터(냉장고, 아이템 등)가 영구적으로 삭제됩니다.`;
      } else {
        message += `\n기존 냉장고 데이터는 보이지 않게 됩니다.`;
      }

      if (!confirm(message)) {
        setIsJoining(false);
        return;
      }

      await joinFamily(inviteCode);
      alert("가족 그룹이 변경되었습니다! 이제 공유된 냉장고를 볼 수 있습니다.");
      setInviteCode("");
    } catch (error) {
      console.error(error);
      setJoinError("가족 그룹 변경 실패. 코드를 확인해주세요.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleBulkDelete = async () => {
    if (
      !deleteFilters.available &&
      !deleteFilters.expired &&
      !deleteFilters.consumed
    ) {
      alert("삭제할 항목을 하나 이상 선택해주세요.");
      return;
    }

    if (
      !confirm(
        "선택한 항목들을 정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다."
      )
    )
      return;

    setIsDeleting(true);
    try {
      const count = await removeItemsByFilter({
        includeAvailable: deleteFilters.available,
        includeExpired: deleteFilters.expired,
        includeConsumed: deleteFilters.consumed,
      });
      alert(`${count}개의 항목이 삭제되었습니다.`);
      setIsDataModalOpen(false);
      setDeleteFilters({ available: false, expired: false, consumed: false });
    } catch (error) {
      console.error(error);
      alert("삭제 실패: " + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const copyMyCode = () => {
    navigator.clipboard.writeText(familyId);
    alert("내 가족 코드가 복사되었습니다.\n가족에게 공유하세요!");
  };

  const handleLogout = async () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      try {
        await logout();
        navigate("/login");
      } catch (e) {
        console.error(e);
        alert("로그아웃 실패");
      }
    }
  };

  // PWA Update Logic (Consumed from Context)
  const { needRefresh, updateServiceWorker } = useInstallPrompt();

  const handleCheckUpdate = async () => {
    if ("serviceWorker" in navigator) {
      if (needRefresh) {
        alert(
          "이미 새로운 업데이트가 준비되어 있습니다.\n아래 '새로운 버전 업데이트' 버튼을 눌러주세요."
        );
        return;
      }

      try {
        const registration = await navigator.serviceWorker.ready;
        console.log("Checking for updates...");
        await registration.update();

        // Polling for state change (up to 2 seconds)
        let newWorkerFound = false;
        for (let i = 0; i < 4; i++) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (registration.installing || registration.waiting) {
            newWorkerFound = true;
            break;
          }
        }

        if (newWorkerFound || needRefresh) {
          console.log("Update found.");
          // Ideally rely on the reactive 'needRefresh' to show the button, but we can alert too.
          if (!needRefresh) {
            // Force state update if needed, though useRegisterSW should handle it.
            // We can just reload if the user wants, or tell them to click the button.
            alert(
              "새로운 버전이 감지되었습니다.\n잠시 후 '새로운 버전 업데이트' 버튼이 활성화됩니다."
            );
          } else {
            alert(
              "새로운 버전이 준비되었습니다.\n'새로운 버전 업데이트' 버튼을 눌러주세요."
            );
          }
        } else {
          alert(
            "현재 최신 버전을 사용 중입니다.\n(버전: " + __APP_VERSION__ + ")"
          );
        }
      } catch (e) {
        console.error("Update check failed:", e);
        alert("업데이트 확인 중 오류가 발생했습니다.");
      }
    } else {
      alert("이 브라우저는 PWA 업데이트를 지원하지 않습니다.");
    }
  };

  return (
    <div className="flex h-full min-h-screen w-full flex-col bg-background-light dark:bg-background-dark pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 px-4 py-3 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-text-main-light dark:text-text-main-dark"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-text-main-light dark:text-text-main-dark">
          설정
        </h1>
        <div className="size-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-8">
        {/* Profile Card */}
        <section className="mt-4">
          <div className="flex items-center gap-4 rounded-2xl bg-surface-light dark:bg-surface-dark p-4 shadow-sm">
            <div className="relative shrink-0">
              <div className="size-16 overflow-hidden rounded-full bg-gray-200">
                {/* Placeholder Avatar */}
                <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                  {currentUser?.email?.[0].toUpperCase() || "U"}
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <h2 className="text-xl font-bold leading-tight text-text-main-light dark:text-text-main-dark">
                {currentUser?.displayName || "사용자"} 님
              </h2>
              <p className="text-text-sub-light dark:text-text-sub-dark text-sm">
                {currentUser?.email}
              </p>
            </div>
            {/* 
                <button className="flex items-center justify-center rounded-full p-2 text-gray-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">chevron_right</span>
                </button> 
                */}
          </div>
        </section>

        {/* Shortcuts (History, etc) */}
        <section className="mt-6">
          <div className="overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
            <Link
              to="/history"
              className="flex w-full items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                  <span className="material-symbols-outlined">history</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-base font-medium text-text-main-light dark:text-text-main-dark">
                    소비 기록
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    내가 먹은 음식 히스토리
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-400">
                chevron_right
              </span>
            </Link>
          </div>
        </section>

        {/* Family Sharing Section */}
        <section className="mt-6">
          <h3 className="px-2 pb-2 text-sm font-bold text-text-sub-light dark:text-text-sub-dark uppercase tracking-wider">
            가족 공유
          </h3>
          <div className="overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm divide-y divide-gray-100 dark:divide-gray-800 p-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    내 가족 코드
                  </span>
                  <span className="text-xs text-gray-500">
                    이 코드를 가족에게 알려주세요
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyMyCode}
                    className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      content_copy
                    </span>
                    코드 복사
                  </button>
                  <button
                    onClick={() => {
                      const shareData = {
                        title: "Fridgy 가족 초대",
                        text: `[Fridgy] 우리 가족 냉장고 관리를 시작해보세요!\n\n🔑 가족 코드: ${familyId}\n\n아래 링크에서 앱을 설치하고, 설정 > 가족 공유에서 위 코드를 입력하세요.\n`,
                        url: window.location.origin,
                      };

                      if (navigator.share) {
                        navigator
                          .share(shareData)
                          .catch((err) => console.log("Error sharing", err));
                      } else {
                        // Fallback
                        navigator.clipboard.writeText(
                          `${shareData.text}\n🔗 앱 링크: ${shareData.url}`
                        );
                        alert(
                          "초대 메시지가 복사되었습니다.\n메신저에 붙여넣어 가족을 초대하세요!"
                        );
                      }
                    }}
                    className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      share
                    </span>
                    초대장 보내기
                  </button>
                </div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-xl text-center font-mono text-sm break-all text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-white/5">
                {familyId || "로딩 중..."}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">
                다른 가족 그룹 참여하기
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="초대 코드 입력"
                  className="flex-1 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={handleJoinFamily}
                  disabled={isJoining || !inviteCode}
                  className="bg-primary text-white text-sm font-bold px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-600 transition-colors"
                >
                  {isJoining ? "참여 중..." : "참여"}
                </button>
              </div>
              {joinError && (
                <p className="text-xs text-red-500 mt-2">{joinError}</p>
              )}
            </div>
          </div>
        </section>

        {/* Notifications Settings */}
        <section className="mt-6">
          <h3 className="px-2 pb-2 text-sm font-bold text-text-sub-light dark:text-text-sub-dark uppercase tracking-wider">
            알림 설정
          </h3>
          <div className="overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
            <div className="flex items-center justify-between p-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
                  <span className="material-symbols-outlined">
                    notifications_active
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-semibold text-text-main-light dark:text-text-main-dark">
                    소비기한 임박 알림
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    음식이 상하기 전에 미리 알려드려요
                  </span>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  checked={expiryAlert}
                  onChange={(e) => setExpiryAlert(e.target.checked)}
                  class="peer sr-only"
                  type="checkbox"
                />
                <div className="peer h-7 w-12 rounded-full bg-gray-200 dark:bg-gray-700 after:absolute after:left-[4px] after:top-[4px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50"></div>
              </label>
            </div>

            {/* Alert Timing (Only show if enabled) */}
            {expiryAlert && (
              <div className="flex flex-col gap-3 p-4 pt-2 pb-4 bg-gray-50/50 dark:bg-white/5">
                <span className="text-sm font-medium text-text-main-light dark:text-text-main-dark ml-1">
                  알림 시점
                </span>
                <div className="flex w-full items-center rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
                  {["7", "3", "1"].map((days) => (
                    <label
                      key={days}
                      className="relative flex-1 cursor-pointer text-center group"
                    >
                      <input
                        checked={alertTiming === days}
                        onChange={() => setAlertTiming(days)}
                        className="peer sr-only"
                        name="alert_timing"
                        type="radio"
                        value={days}
                      />
                      <div className="rounded-lg py-2 text-sm font-medium text-gray-500 dark:text-gray-400 transition-all peer-checked:bg-white dark:peer-checked:bg-surface-dark peer-checked:text-primary peer-checked:shadow-sm">
                        {days}일 전
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Theme Settings */}
        <section className="mt-6">
          <h3 className="px-2 pb-2 text-sm font-bold text-text-sub-light dark:text-text-sub-dark uppercase tracking-wider">
            테마 설정
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "light", label: "라이트", icon: "light_mode" },
              { id: "dark", label: "다크", icon: "dark_mode" },
              { id: "system", label: "시스템", icon: "settings_brightness" },
            ].map((mode) => (
              <label key={mode.id} className="cursor-pointer group">
                <input
                  checked={theme === mode.id}
                  onChange={() => setTheme(mode.id)}
                  className="peer sr-only"
                  name="theme_mode"
                  type="radio"
                  value={mode.id}
                />
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-surface-light dark:bg-surface-dark p-4 shadow-sm border-2 border-transparent transition-all hover:bg-gray-50 dark:hover:bg-gray-800 peer-checked:border-primary peer-checked:bg-primary/5">
                  <div className="flex size-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 peer-checked:text-primary peer-checked:bg-white dark:peer-checked:bg-surface-dark transition-colors">
                    <span className="material-symbols-outlined">
                      {mode.icon}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 peer-checked:text-primary transition-colors">
                    {mode.label}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Data Management */}
        <section className="mt-6">
          <h3 className="px-2 pb-2 text-sm font-bold text-text-sub-light dark:text-text-sub-dark uppercase tracking-wider">
            데이터 관리
          </h3>
          <div className="overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
            <button
              onClick={() => setIsDataModalOpen(true)}
              className="flex w-full items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  <span className="material-symbols-outlined">
                    delete_sweep
                  </span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-base font-medium text-text-main-light dark:text-text-main-dark">
                    전체 아이템 삭제
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    조건에 맞는 아이템을 일괄 삭제합니다
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-400">
                chevron_right
              </span>
            </button>
          </div>
        </section>

        {/* App Info / Install */}
        <section className="mt-6">
          <h3 className="px-2 pb-2 text-sm font-bold text-text-sub-light dark:text-text-sub-dark uppercase tracking-wider">
            앱 정보
          </h3>
          <div className="overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
            {/* 1. Install Button */}
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="flex w-full items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                    <span className="material-symbols-outlined">download</span>
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="text-base font-medium text-text-main-light dark:text-text-main-dark">
                      앱 설치하기
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      홈 화면에 추가하여 앱처럼 사용하세요
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-gray-400">
                  chevron_right
                </span>
              </button>
            )}

            {/* 2. Manual Install Instructions (Shown when button is hidden and NOT standalone) */}
            {!deferredPrompt && !isStandalone && (
              <div className="p-4 bg-gray-50 dark:bg-black/20 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-gray-400 mt-0.5 text-lg">
                    help
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-text-main-light dark:text-text-main-dark">
                      앱 설치 방법 안내
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {isIos ? (
                        <>
                          Safari 브라우저 하단의 <strong>공유</strong> 버튼{" "}
                          <span className="inline-flex align-middle material-symbols-outlined text-[14px]">
                            ios_share
                          </span>{" "}
                          을 누르고
                          <br />
                          <strong>'홈 화면에 추가'</strong>를 선택해주세요.
                        </>
                      ) : (
                        <>
                          브라우저 메뉴{" "}
                          <span className="inline-flex align-middle material-symbols-outlined text-[14px]">
                            more_vert
                          </span>{" "}
                          에서
                          <br />
                          <strong>'앱 설치'</strong> 또는{" "}
                          <strong>'홈 화면에 추가'</strong>를 선택해주세요.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Link
              to="/terms"
              className="flex w-full items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  <span className="material-symbols-outlined">gavel</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-base font-medium text-text-main-light dark:text-text-main-dark">
                    이용약관
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-400">
                chevron_right
              </span>
            </Link>

            <Link
              to="/privacy"
              className="flex w-full items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  <span className="material-symbols-outlined">policy</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-base font-medium text-text-main-light dark:text-text-main-dark">
                    개인정보처리방침
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-400">
                chevron_right
              </span>
            </Link>

            <Link
              to="/licenses"
              className="flex w-full items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  <span className="material-symbols-outlined">code</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-base font-medium text-text-main-light dark:text-text-main-dark">
                    오픈소스 라이선스
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-400">
                chevron_right
              </span>
            </Link>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  <span className="material-symbols-outlined">info</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-medium text-text-main-light dark:text-text-main-dark">
                    현재 버전
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    v{__APP_VERSION__} ({__BUILD_DATE__})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <section className="mt-8 mb-8">
          <div className="flex flex-col gap-3">
            {needRefresh ? (
              <button
                onClick={() => updateServiceWorker(true)}
                className="flex w-full items-center justify-center rounded-xl bg-primary text-white p-3.5 text-base font-medium shadow-sm active:scale-[0.99] hover:bg-green-600 transition-colors"
              >
                새로운 버전 업데이트
              </button>
            ) : (
              <button
                onClick={handleCheckUpdate}
                className="flex w-full items-center justify-center rounded-xl bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 p-3.5 text-base font-medium text-text-main-light dark:text-text-main-dark hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm active:scale-[0.99]"
              >
                업데이트 확인
              </button>
            )}

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center rounded-xl bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 p-3.5 text-base font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shadow-sm active:scale-[0.99]"
            >
              로그아웃
            </button>

            <button
              onClick={() => setIsDeleteAccountModalOpen(true)}
              className="text-xs text-gray-400 underline mt-4 hover:text-red-500 transition-colors"
            >
              회원 탈퇴
            </button>

            <div className="text-center mt-2 flex flex-col gap-1">
              <span className="text-[10px] text-gray-300">
                날짜가 변경되지 않으면 최신 버전입니다.
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Data Delete Modal */}
      {isDataModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsDataModalOpen(false)}
        >
          <div
            className="bg-surface-light dark:bg-surface-dark w-full max-w-sm rounded-2xl p-6 shadow-xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-2 text-text-main-light dark:text-text-main-dark">
              전체 아이템 삭제
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              삭제할 항목의 대상을 선택해주세요.
            </p>

            <div className="flex flex-col gap-3 mb-6">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-black/20 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={deleteFilters.available}
                  onChange={(e) =>
                    setDeleteFilters({
                      ...deleteFilters,
                      available: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded text-primary focus:ring-primary"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-main-light dark:text-text-main-dark">
                    보관 중 (소비기한 남음)
                  </span>
                  <span className="text-xs text-gray-400">
                    아직 상하지 않은 음식
                  </span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-black/20 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={deleteFilters.expired}
                  onChange={(e) =>
                    setDeleteFilters({
                      ...deleteFilters,
                      expired: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded text-primary focus:ring-primary"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-red-500">
                    소비기한 만료
                  </span>
                  <span className="text-xs text-gray-400">
                    소비기한이 지난 음식
                  </span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-black/20 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={deleteFilters.consumed}
                  onChange={(e) =>
                    setDeleteFilters({
                      ...deleteFilters,
                      consumed: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded text-primary focus:ring-primary"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-text-main-light dark:text-text-main-dark">
                    소비/삭제 기록
                  </span>
                  <span className="text-xs text-gray-400">
                    이미 처리된 항목 (히스토리)
                  </span>
                </div>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsDataModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 font-bold text-gray-600 dark:text-gray-300"
              >
                취소
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={
                  isDeleting ||
                  (!deleteFilters.available &&
                    !deleteFilters.expired &&
                    !deleteFilters.consumed)
                }
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "삭제 중..." : "삭제하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {isDeleteAccountModalOpen && (
        <DeleteAccountModal
          isOpen={isDeleteAccountModalOpen}
          onClose={() => setIsDeleteAccountModalOpen(false)}
        />
      )}
    </div>
  );
}
