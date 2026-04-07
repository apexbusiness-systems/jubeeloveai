import { useState, useRef, memo, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, PencilIcon, StarIcon, ChartIcon, GiftIcon, GearIcon } from '@/components/icons/Icons';

export const Navigation = memo(function Navigation() {
  const icons = useMemo(() => ({
    home: <HomeIcon className="w-8 h-8" />,
    write: <PencilIcon className="w-8 h-8" />,
    shapes: <StarIcon className="w-8 h-8" />,
    progress: <ChartIcon className="w-8 h-8" />,
    stickers: <GiftIcon className="w-8 h-8" />,
    settings: <GearIcon className="w-8 h-8" />,
  }), []);

  return (
    <nav className="tab-bar" role="navigation" aria-label="Main navigation">
      <TabButton path="/" icon={icons.home} label="Home" />
      <TabButton path="/write" icon={icons.write} label="Write" />
      <TabButton path="/shapes" icon={icons.shapes} label="Shapes" />
      <TabButton path="/progress" icon={icons.progress} label="Progress" />
      <TabButton path="/stickers" icon={icons.stickers} label="Stickers" />
      <TabButton path="/settings" icon={icons.settings} label="Settings" longPressPath="/parent" />
    </nav>
  );
});

interface TabButtonProps {
  path: string;
  icon: React.ReactNode;
  label: string;
  longPressPath?: string;
}

const TabButton = memo(function TabButton({ path, icon, label, longPressPath }: TabButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === path;
  const [pressing, setPressing] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggered = useRef(false);

  const handlePressStart = () => {
    if (!longPressPath) return;
    
    longPressTriggered.current = false;
    setPressing(true);
    pressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setPressing(false);
      navigate(longPressPath);
    }, 3000); // 3 seconds long press
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
    // Only navigate if long press didn't trigger navigation
    if (!longPressTriggered.current) {
      navigate(path);
    }
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
      className={`tab-item group min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all relative ${
        isActive ? 'scale-110' : ''
      } ${pressing ? 'scale-125 ring-4 ring-primary' : ''}`}
      aria-label={`Navigate to ${label}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {pressing && longPressPath && (
        <div className="absolute inset-0 rounded-full border-4 border-primary animate-pulse" />
      )}
      <div className="w-8 h-8 text-foreground flex items-center justify-center transition-colors duration-200 group-hover:text-primary" aria-hidden="true">
        {icon}
      </div>
      <span className="text-xs font-bold text-foreground transition-colors duration-200 group-hover:text-primary">{label}</span>
    </button>
  );
});
