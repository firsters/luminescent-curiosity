import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { currentUser, logout, familyId, joinFamily } = useAuth();
  
  // Theme State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');

  // Notification State
  const [expiryAlert, setExpiryAlert] = useState(true);
  const [marketingAlert, setMarketingAlert] = useState(false);
  const [alertTiming, setAlertTiming] = useState('3'); // 7, 3, 1 days
  
  // Family State
  const [inviteCode, setInviteCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const handleJoinFamily = async () => {
      if (!inviteCode.trim()) return;
      
      if (inviteCode === familyId) {
          setJoinError('이미 현재 가족 그룹입니다.');
          return;
      }

      if(!confirm(`가족 코드 [${inviteCode}] 그룹으로 이동하시겠습니까?\n기존 냉장고 데이터는 보이지 않게 됩니다.`)) return;

      setIsJoining(true);
      setJoinError('');
      try {
          await joinFamily(inviteCode);
          alert('가족 그룹이 변경되었습니다! 이제 공유된 냉장고를 볼 수 있습니다.');
          setInviteCode('');
      } catch (error) {
          console.error(error);
          setJoinError('가족 그룹 변경 실패. 코드를 확인해주세요.');
      } finally {
          setIsJoining(false);
      }
  };

  const copyMyCode = () => {
      navigator.clipboard.writeText(familyId);
      alert('내 가족 코드가 복사되었습니다.\n가족에게 공유하세요!');
  };

  // Apply Theme
  useEffect(() => {
     const root = window.document.documentElement;
     root.classList.remove('light', 'dark');

     if (theme === 'system') {
         const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
         root.classList.add(systemTheme);
     } else {
         root.classList.add(theme);
     }
     localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = async () => {
      if(confirm('로그아웃 하시겠습니까?')) {
          try {
              await logout();
              navigate('/login');
          } catch(e) {
              alert('로그아웃 실패');
          }
      }
  };

  return (
    <div className="flex h-full min-h-screen w-full flex-col bg-background-light dark:bg-background-dark pb-24">
      
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background-light/90 dark:bg-background-dark/90 px-4 py-3 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="flex size-10 items-center justify-center rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-text-main-light dark:text-text-main-dark">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="flex-1 text-center text-lg font-bold text-text-main-light dark:text-text-main-dark">설정</h1>
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
                            {currentUser?.email?.[0].toUpperCase() || 'U'}
                        </div>
                    </div>
                </div>
                <div className="flex flex-1 flex-col justify-center">
                    <h2 className="text-xl font-bold leading-tight text-text-main-light dark:text-text-main-dark">
                        {currentUser?.displayName || '사용자'} 님
                    </h2>
                    <p className="text-text-sub-light dark:text-text-sub-dark text-sm">{currentUser?.email}</p>
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
                <Link to="/history" className="flex w-full items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                            <span className="material-symbols-outlined">history</span>
                        </div>
                        <div className="flex flex-col items-start">
                            <span className="text-base font-medium text-text-main-light dark:text-text-main-dark">소비 기록</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">내가 먹은 음식 히스토리</span>
                        </div>
                    </div>
                    <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                </Link>
            </div>
        </section>

        {/* Family Sharing Section */}
        <section className="mt-6">
            <h3 className="px-2 pb-2 text-sm font-bold text-text-sub-light dark:text-text-sub-dark uppercase tracking-wider">가족 공유</h3>
            <div className="overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm divide-y divide-gray-100 dark:divide-gray-800 p-4">
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">내 가족 코드</span>
                            <span className="text-xs text-gray-500">이 코드를 가족에게 알려주세요</span>
                        </div>
                        <button onClick={copyMyCode} className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors">
                            <span className="material-symbols-outlined text-[16px]">content_copy</span>
                            복사
                        </button>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-xl text-center font-mono text-sm break-all text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-white/5">
                        {familyId || '로딩 중...'}
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">다른 가족 그룹 참여하기</label>
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
                            {isJoining ? '참여 중...' : '참여'}
                        </button>
                    </div>
                    {joinError && <p className="text-xs text-red-500 mt-2">{joinError}</p>}
                </div>
            </div>
        </section>

        {/* Notifications Settings */}
        <section className="mt-6">
            <h3 className="px-2 pb-2 text-sm font-bold text-text-sub-light dark:text-text-sub-dark uppercase tracking-wider">알림 설정</h3>
            <div className="overflow-hidden rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
                <div className="flex items-center justify-between p-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
                            <span className="material-symbols-outlined">notifications_active</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-base font-semibold text-text-main-light dark:text-text-main-dark">유통기한 임박 알림</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">음식이 상하기 전에 미리 알려드려요</span>
                        </div>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                        <input checked={expiryAlert} onChange={e => setExpiryAlert(e.target.checked)} class="peer sr-only" type="checkbox"/>
                        <div className="peer h-7 w-12 rounded-full bg-gray-200 dark:bg-gray-700 after:absolute after:left-[4px] after:top-[4px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50"></div>
                    </label>
                </div>
                
                {/* Alert Timing (Only show if enabled) */}
                {expiryAlert && (
                    <div className="flex flex-col gap-3 p-4 pt-2 pb-4 bg-gray-50/50 dark:bg-white/5">
                        <span className="text-sm font-medium text-text-main-light dark:text-text-main-dark ml-1">알림 시점</span>
                        <div className="flex w-full items-center rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
                            {['7', '3', '1'].map(days => (
                                <label key={days} className="relative flex-1 cursor-pointer text-center group">
                                    <input checked={alertTiming === days} onChange={() => setAlertTiming(days)} className="peer sr-only" name="alert_timing" type="radio" value={days}/>
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
            <h3 className="px-2 pb-2 text-sm font-bold text-text-sub-light dark:text-text-sub-dark uppercase tracking-wider">테마 설정</h3>
            <div className="grid grid-cols-3 gap-3">
                {[
                    { id: 'light', label: '라이트', icon: 'light_mode' },
                    { id: 'dark', label: '다크', icon: 'dark_mode' },
                    { id: 'system', label: '시스템', icon: 'settings_brightness' }
                ].map(mode => (
                    <label key={mode.id} className="cursor-pointer group">
                        <input checked={theme === mode.id} onChange={() => setTheme(mode.id)} className="peer sr-only" name="theme_mode" type="radio" value={mode.id}/>
                        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-surface-light dark:bg-surface-dark p-4 shadow-sm border-2 border-transparent transition-all hover:bg-gray-50 dark:hover:bg-gray-800 peer-checked:border-primary peer-checked:bg-primary/5">
                            <div className="flex size-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 peer-checked:text-primary peer-checked:bg-white dark:peer-checked:bg-surface-dark transition-colors">
                                <span className="material-symbols-outlined">{mode.icon}</span>
                            </div>
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 peer-checked:text-primary transition-colors">{mode.label}</span>
                        </div>
                    </label>
                ))}
            </div>
        </section>

        {/* Footer Actions */}
        <section className="mt-8 mb-8">
            <div className="flex flex-col gap-3">
                <button onClick={handleLogout} className="flex w-full items-center justify-center rounded-xl bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 p-3.5 text-base font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors shadow-sm active:scale-[0.99]">
                    로그아웃
                </button>
                <div className="text-center mt-2">
                    <span className="text-xs text-gray-400">버전 {__APP_VERSION__} ({__BUILD_DATE__})</span>
                </div>
            </div>
        </section>

      </main>
    </div>
  );
}
