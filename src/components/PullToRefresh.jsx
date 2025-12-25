import { useState, useEffect, useRef } from "react";

export default function PullToRefresh({ children, onRefresh }) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const contentRef = useRef(null);

  // Configuration
  const PULL_THRESHOLD = 80; // px to trigger refresh
  const MAX_PULL = 120; // max visual pull distance

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const handleTouchStart = (e) => {
      // Only enable pull if we are at the top of the scroll container
      // check window.scrollY or element.scrollTop
      if (window.scrollY === 0) {
        setStartY(e.touches[0].clientY);
      } else {
        setStartY(0);
      }
    };

    const handleTouchMove = (e) => {
      if (startY === 0 || refreshing) return;

      const touchY = e.touches[0].clientY;
      const pullDistance = touchY - startY;

      // Only allow pulling down
      if (pullDistance > 0) {
        // Visual resistance (logarithmic-ish) to feel natural
        // We simply cap it or dampen it here
        const dampedDistance = Math.min(pullDistance * 0.5, MAX_PULL);
        setCurrentY(dampedDistance);

        // If we are pulling, we might want to prevent default scrolling sometimes?
        // But since we are at scrollY 0, preventing default might stop the "bounce" check effectively.
        // Let's rely on oversroll-behavior: none in CSS which we already set.
      }
    };

    const handleTouchEnd = async () => {
      if (startY === 0 || refreshing) return;

      if (currentY > PULL_THRESHOLD) {
        setRefreshing(true);
        setCurrentY(60); // Snap to loading position

        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
          setCurrentY(0);
        }
      } else {
        // Snap back
        setCurrentY(0);
      }

      setStartY(0);
    };

    // Attach listeners to window or document to catch swipes reliably
    // Attaching to 'element' is safer for component isolation but window is better for global pull
    // Let's attach to the element first.
    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchmove", handleTouchMove, { passive: false }); // non-passive to theoretically allow preventing default, but we aren't calling it.
    element.addEventListener("touchend", handleTouchEnd);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [startY, currentY, refreshing, onRefresh]);

  return (
    <div ref={contentRef} className="relative min-h-screen">
      {/* Loading Indicator Layer */}
      <div
        className="fixed top-14 left-0 w-full flex items-center justify-center pointer-events-none z-40 transition-transform duration-200"
        style={{
          transform: `translateY(${Math.max(0, currentY - 40)}px)`,
          opacity: currentY > 0 ? 1 : 0,
        }}
      >
        <div
          className={`
          flex items-center justify-center bg-white dark:bg-gray-800 rounded-full p-2 shadow-md border border-gray-100 dark:border-gray-700
          ${refreshing ? "animate-spin" : ""}
        `}
          style={{
            transform: `rotate(${currentY * 2}deg)`,
          }}
        >
          <span
            className={`material-symbols-outlined text-primary ${
              currentY > PULL_THRESHOLD ? "opacity-100" : "opacity-70"
            }`}
          >
            refresh
          </span>
        </div>
      </div>

      {/* Content Layer */}
      <div
        style={{
          transform: `translateY(${currentY}px)`,
          transition: refreshing
            ? "transform 0.3s cubic-bezier(0,0,0.2,1)"
            : "transform 0.1s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
