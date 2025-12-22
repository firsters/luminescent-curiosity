import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  // Stitch designs have specific header per page, so Layout mainly handles the shell and bottom nav.
  // We'll wrap children in a safe-area container.
  
  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24">
      
      {/* Main Content Area */}
      {children}

      {/* Bottom Navigation (Stitch Design) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-surface-light pb-safe pt-2 dark:border-white/5 dark:bg-background-dark px-2">
        <div className="flex items-center justify-around pb-2">
          <NavLink to="/" icon="home" label="홈" />
          <NavLink to="/search" icon="search" label="검색" />
          <NavLink to="/add" icon="add_circle" label="추가" highlight />
          <NavLink to="/inventory" icon="kitchen" label="냉장고" />
          <NavLink to="/settings" icon="settings" label="설정" />
        </div>
      </nav>
      
      {/* Safe Area Spacer for bottom nav */}
      <div className="h-6"></div>
    </div>
  );
}

function NavLink({ to, icon, label, highlight }) {
  const location = useLocation();
  const active = location.pathname === to;

  if (highlight) {
      // Special "Add" button style usually floating or highlighted, 
      // but matching the provided "nav" style in code.html (lines 256-275 in List UI / 171-190 in Fridge UI)
      // Actually code.html uses a standard 4-tab bar. 
      // Let's stick to the tab style for consistency, or the FAB style if preferred.
      // The Stitch design seems to use a standard tab bar effectively.
      // However, "Add" is often central.
      // Let's use the standard style for now to match code.html 171-190.
  }

  const baseClass = "group flex flex-1 flex-col items-center justify-center gap-1 p-2 transition-colors";
  const activeClass = "text-primary";
  const inactiveClass = "text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light dark:hover:text-text-main-dark";

  return (
    <Link to={to} className={`${baseClass} ${active ? activeClass : inactiveClass}`}>
      <span className={`material-symbols-outlined text-2xl group-active:scale-90 transition-transform ${active ? 'fill' : ''}`}>
        {icon}
      </span>
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </Link>
  );
}
