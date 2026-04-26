import { useState, useRef, memo, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  emoji: string;
  longPressPath?: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Home', emoji: '🏠' },
  { path: '/stories', label: 'Stories', emoji: '📖' },
  { path: '/games', label: 'Games', emoji: '🎮' },
  { path: '/dance', label: 'Dance', emoji: '💃' },
  { path: '/music', label: 'Music', emoji: '🎵' },
  { path: '/reading', label: 'Reading', emoji: '📚' },
  { path: '/write', label: 'Write', emoji: '✏️' },
  { path: '/shapes', label: 'Shapes', emoji: '⭐' },
  { path: '/stickers', label: 'Stickers', emoji: '🎁' },
  { path: '/progress', label: 'Progress', emoji: '📊' },
  { path: '/settings', label: 'Settings', emoji: '⚙️', longPressPath: '/parent' },
];

export const Navigation = memo(function Navigation() {
  const items = useMemo(() => NAV_ITEMS, []);
  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-50
        bg-card/95 backdrop-blur-md
        border-t-2 border-primary/30
        shadow-[0_-4px_20px_rgba(0,0,0,0.08)]
      "
      role="navigation"
      aria-label="Main navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="
          flex items-stretch gap-1 px-2 py-1.5
          overflow-x-auto overflow-y-hidden
          scrollbar-hide snap-x snap-mandatory
          min-h-[64px]
        "
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => (
          <TabButton key={item.path} {...item} />
        ))}
      </div>
    </nav>
  );
});

type TabButtonProps = NavItem;

const TabButton = memo(function TabButton({ path, emoji, label, longPressPath }: TabButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === path;
  const [pressing, setPressing] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const handlePressStart = () => {
    if (!longPressPath) return;
    longPressTriggered.current = false;
    setPressing(true);
    pressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setPressing(false);
      navigate(longPressPath);
    }, 3000);
  };

  const handlePressEnd = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    setPressing(false);
  };

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!longPressTriggered.current) navigate(path);
    longPressTriggered.current = false;
  };

  return (
    <button
      onClick={handleClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
      className={`
        flex-shrink-0 snap-center
        flex flex-col items-center justify-center
        min-w-[64px] min-h-[60px] px-3 py-1.5 rounded-2xl
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
        relative
        ${isActive
          ? 'bg-primary/15 scale-105 shadow-md'
          : 'hover:bg-muted/50 active:scale-95'}
        ${pressing ? 'ring-4 ring-primary/60 scale-110' : ''}
      `}
      aria-label={`Navigate to ${label}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <span
        className={`text-2xl leading-none transition-transform duration-200 ${
          isActive ? 'scale-110' : ''
        }`}
        aria-hidden="true"
      >
        {emoji}
      </span>
      <span
        className={`text-[11px] mt-0.5 font-bold tracking-tight whitespace-nowrap ${
          isActive ? 'text-primary' : 'text-foreground/80'
        }`}
      >
        {label}
      </span>
      {isActive && (
        <span
          className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-primary"
          aria-hidden="true"
        />
      )}
    </button>
  );
});
