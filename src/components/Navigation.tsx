import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, PencilIcon, StarIcon, ChartIcon, GiftIcon, GearIcon } from '@/components/icons/Icons';

export function Navigation() {
  return (
    <nav className="tab-bar" role="navigation" aria-label="Main navigation">
      <TabButton path="/" icon={<HomeIcon className="w-8 h-8" />} label="Home" />
      <TabButton path="/write" icon={<PencilIcon className="w-8 h-8" />} label="Write" />
      <TabButton path="/shapes" icon={<StarIcon className="w-8 h-8" />} label="Shapes" />
      <TabButton path="/progress" icon={<ChartIcon className="w-8 h-8" />} label="Progress" />
      <TabButton path="/stickers" icon={<GiftIcon className="w-8 h-8" />} label="Stickers" />
      <TabButton path="/settings" icon={<GearIcon className="w-8 h-8" />} label="Settings" longPressPath="/parent" />
    </nav>
  );
}

interface TabButtonProps {
  path: string;
  icon: React.ReactNode;
  label: string;
  longPressPath?: string;
}

function TabButton({ path, icon, label, longPressPath }: TabButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === path;
  const [pressing, setPressing] = useState(false);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handlePressStart = () => {
    if (!longPressPath) return;
    
    setPressing(true);
    pressTimer.current = setTimeout(() => {
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

  const handleClick = () => {
    if (!pressing) {
      navigate(path);
    }
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
      className={`tab-item min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all relative ${
        isActive ? 'scale-110' : ''
      } ${pressing ? 'scale-125 ring-4 ring-primary' : ''}`}
      aria-label={`Navigate to ${label}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {pressing && longPressPath && (
        <div className="absolute inset-0 rounded-full border-4 border-primary animate-pulse" />
      )}
      <div className="w-8 h-8 text-[hsl(var(--footer-text))] flex items-center justify-center" aria-hidden="true">
        {icon}
      </div>
      <span className="text-xs font-bold text-[hsl(var(--footer-text))]">{label}</span>
    </button>
  );
}
