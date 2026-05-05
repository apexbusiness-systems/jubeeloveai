import { memo, useMemo } from 'react';

/**
 * StoryIllustration — Premium Vector Art Scenes.
 * Vastly improved with 3D-like radial gradients, drop shadows,
 * detailed character models (snouts, ears, complex paths),
 * and buttery smooth CSS keyframe animations.
 */

interface StoryIllustrationProps {
  storyTitle: string;
  pageIndex: number;
  size?: 'sm' | 'lg';
  className?: string;
}

type SceneKey =
  | 'pigs-build'
  | 'pigs-straw'
  | 'pigs-wolf-blow'
  | 'pigs-bricks'
  | 'race-start'
  | 'race-running'
  | 'race-nap'
  | 'race-win'
  | 'dragon-mad'
  | 'dragon-balloon'
  | 'dragon-calm'
  | 'sleepy-train'
  | 'sleepy-toes'
  | 'sleepy-tummy'
  | 'space-blastoff'
  | 'space-float'
  | 'jubee-default';

function pickScene(title: string, page: number): SceneKey {
  const t = title.toLowerCase();
  if (t.includes('three little pigs') || t.includes('three pigs')) {
    return ['pigs-build', 'pigs-straw', 'pigs-wolf-blow', 'pigs-bricks'][page] as SceneKey ?? 'pigs-build';
  }
  if (t.includes('tortoise') || t.includes('hare')) {
    return ['race-start', 'race-running', 'race-nap', 'race-win'][page] as SceneKey ?? 'race-start';
  }
  if (t.includes('big mad') || t.includes('dragon')) {
    return ['dragon-mad', 'dragon-balloon', 'dragon-calm'][page] as SceneKey ?? 'dragon-mad';
  }
  if (t.includes('sleepy train') || t.includes('bedtime')) {
    return ['sleepy-train', 'sleepy-toes', 'sleepy-tummy'][page] as SceneKey ?? 'sleepy-train';
  }
  if (t.includes('space')) {
    return ['space-blastoff', 'space-float'][page] as SceneKey ?? 'space-blastoff';
  }
  return 'jubee-default';
}

// ---------------------------------------------------------------------------
// 3D Gradients Definitions (Premium Look)
// ---------------------------------------------------------------------------

function SharedDefs() {
  return (
    <defs>
      {/* Filters */}
      <filter id="drop-shadow" x="-20%" y="-20%" width="150%" height="150%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000" floodOpacity="0.2" />
      </filter>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>

      {/* Jubee Gradients */}
      <radialGradient id="jubee-body" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="hsl(48 100% 75%)" />
        <stop offset="70%" stopColor="hsl(40 100% 50%)" />
        <stop offset="100%" stopColor="hsl(35 100% 40%)" />
      </radialGradient>

      {/* Animal Gradients */}
      <radialGradient id="pig-body" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="hsl(340 80% 90%)" />
        <stop offset="80%" stopColor="hsl(340 70% 75%)" />
        <stop offset="100%" stopColor="hsl(340 70% 60%)" />
      </radialGradient>

      <radialGradient id="pig-snout" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="hsl(340 70% 85%)" />
        <stop offset="100%" stopColor="hsl(340 60% 65%)" />
      </radialGradient>

      <radialGradient id="dragon-body" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="hsl(0 80% 65%)" />
        <stop offset="80%" stopColor="hsl(0 80% 45%)" />
        <stop offset="100%" stopColor="hsl(0 80% 30%)" />
      </radialGradient>

      <radialGradient id="dragon-calm" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="hsl(180 60% 70%)" />
        <stop offset="80%" stopColor="hsl(180 60% 50%)" />
        <stop offset="100%" stopColor="hsl(180 60% 35%)" />
      </radialGradient>

      <radialGradient id="tortoise-shell" cx="40%" cy="20%" r="80%">
        <stop offset="0%" stopColor="hsl(120 40% 50%)" />
        <stop offset="100%" stopColor="hsl(120 50% 25%)" />
      </radialGradient>

      <radialGradient id="tortoise-skin" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="hsl(90 50% 65%)" />
        <stop offset="100%" stopColor="hsl(90 50% 45%)" />
      </radialGradient>

      <radialGradient id="hare-body" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="hsl(35 30% 95%)" />
        <stop offset="80%" stopColor="hsl(35 25% 75%)" />
        <stop offset="100%" stopColor="hsl(35 30% 60%)" />
      </radialGradient>

      <radialGradient id="wolf-body" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="hsl(220 15% 60%)" />
        <stop offset="70%" stopColor="hsl(220 15% 40%)" />
        <stop offset="100%" stopColor="hsl(220 20% 25%)" />
      </radialGradient>

      {/* Objects */}
      <linearGradient id="straw" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(50 90% 70%)" />
        <stop offset="100%" stopColor="hsl(40 90% 45%)" />
      </linearGradient>
      <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(25 60% 45%)" />
        <stop offset="100%" stopColor="hsl(20 60% 25%)" />
      </linearGradient>
      <linearGradient id="brick" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(10 70% 55%)" />
        <stop offset="100%" stopColor="hsl(5 70% 35%)" />
      </linearGradient>
      <radialGradient id="sun" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="hsl(50 100% 85%)" />
        <stop offset="50%" stopColor="hsl(45 100% 60%)" />
        <stop offset="100%" stopColor="hsl(35 100% 50%)" />
      </radialGradient>
      <radialGradient id="moon" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="hsl(220 40% 95%)" />
        <stop offset="80%" stopColor="hsl(220 30% 80%)" />
        <stop offset="100%" stopColor="hsl(220 40% 60%)" />
      </radialGradient>
    </defs>
  );
}

// ---------------------------------------------------------------------------
// High-Fidelity Character Components
// ---------------------------------------------------------------------------

function Jubee({ x = 0, y = 0, scale = 1, wing = true, flip = false }: { x?: number; y?: number; scale?: number; wing?: boolean; flip?: boolean }) {
  const t = `translate(${x} ${y}) scale(${flip ? -scale : scale}, ${scale})`;
  return (
    <g transform={t} filter="url(#drop-shadow)">
      {/* Antennae */}
      <path d="M -8 -16 Q -12 -25 -18 -22" stroke="hsl(20 14% 15%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M 8 -16 Q 12 -25 18 -22" stroke="hsl(20 14% 15%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <circle cx="-18" cy="-22" r="3.5" fill="url(#jubee-body)" stroke="hsl(35 100% 30%)" strokeWidth="1" />
      <circle cx="18" cy="-22" r="3.5" fill="url(#jubee-body)" stroke="hsl(35 100% 30%)" strokeWidth="1" />

      {/* Back Wing */}
      {wing && (
        <ellipse cx="-12" cy="-14" rx="14" ry="10" fill="hsl(200 100% 95%)" opacity="0.6" stroke="hsl(200 80% 80%)" strokeWidth="1"
          style={{ transformOrigin: '-12px -14px', animation: 'jubee-wing 0.12s ease-in-out infinite alternate' }} />
      )}

      {/* Body */}
      <ellipse cx="0" cy="0" rx="24" ry="20" fill="url(#jubee-body)" />

      {/* 3D curved Stripes */}
      <path d="M -15 -15 Q -8 0 -13 16" stroke="hsl(20 14% 15%)" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M 0 -19 Q 8 0 0 19" stroke="hsl(20 14% 15%)" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.85" />
      <path d="M 15 -15 Q 22 0 13 16" stroke="hsl(20 14% 15%)" strokeWidth="4.5" fill="none" strokeLinecap="round" opacity="0.85" />

      {/* Front Wing */}
      {wing && (
        <ellipse cx="-2" cy="-12" rx="16" ry="12" fill="white" opacity="0.8" stroke="hsl(200 80% 80%)" strokeWidth="1.5"
          style={{ transformOrigin: '-2px -12px', animation: 'jubee-wing-front 0.12s ease-in-out infinite alternate' }} />
      )}

      {/* Eyes (Large, cute, with catchlights) */}
      <circle cx="-8" cy="-4" r="5.5" fill="white" />
      <circle cx="6" cy="-4" r="5.5" fill="white" />
      <circle cx="-7" cy="-3.5" r="3" fill="hsl(20 14% 15%)" />
      <circle cx="7" cy="-3.5" r="3" fill="hsl(20 14% 15%)" />
      {/* Catchlights */}
      <circle cx="-8.5" cy="-5" r="1.2" fill="white" />
      <circle cx="5.5" cy="-5" r="1.2" fill="white" />

      {/* Blush */}
      <ellipse cx="-13" cy="2" rx="3" ry="1.5" fill="hsl(340 100% 60%)" opacity="0.4" />
      <ellipse cx="11" cy="2" rx="3" ry="1.5" fill="hsl(340 100% 60%)" opacity="0.4" />

      {/* Smile */}
      <path d="M -5 4 Q -1 8 3 4" stroke="hsl(20 14% 15%)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  );
}

function PremiumPig({ cx, cy, delay = '0s' }: { cx: number; cy: number; delay?: string }) {
  return (
    <g style={{ animation: `pig-bounce 1.6s ease-in-out infinite`, animationDelay: delay, transformOrigin: `${cx}px ${cy}px` }} filter="url(#drop-shadow)">
      {/* Ears */}
      <path d={`M ${cx-18} ${cy-10} Q ${cx-25} ${cy-22} ${cx-10} ${cy-18}`} fill="url(#pig-snout)" stroke="hsl(340 50% 50%)" strokeWidth="1" />
      <path d={`M ${cx+18} ${cy-10} Q ${cx+25} ${cy-22} ${cx+10} ${cy-18}`} fill="url(#pig-snout)" stroke="hsl(340 50% 50%)" strokeWidth="1" />

      {/* Body */}
      <ellipse cx={cx} cy={cy} rx="26" ry="24" fill="url(#pig-body)" />

      {/* Blush */}
      <circle cx={cx-16} cy={cy+4} r="4" fill="hsl(340 80% 50%)" opacity="0.3" />
      <circle cx={cx+16} cy={cy+4} r="4" fill="hsl(340 80% 50%)" opacity="0.3" />

      {/* Eyes */}
      <circle cx={cx-9} cy={cy-4} r="3" fill="#111" />
      <circle cx={cx+9} cy={cy-4} r="3" fill="#111" />
      <circle cx={cx-10} cy={cy-5} r="1" fill="#fff" />
      <circle cx={cx+8} cy={cy-5} r="1" fill="#fff" />

      {/* Snout */}
      <ellipse cx={cx} cy={cy+6} rx="10" ry="7" fill="url(#pig-snout)" stroke="hsl(340 50% 60%)" strokeWidth="1.5" />
      <ellipse cx={cx-3} cy={cy+5} rx="2" ry="3" fill="hsl(340 60% 40%)" />
      <ellipse cx={cx+3} cy={cy+5} rx="2" ry="3" fill="hsl(340 60% 40%)" />
    </g>
  );
}

function PremiumDragon({ cx, cy, isCalm = false }: { cx: number; cy: number; isCalm?: boolean }) {
  const gradient = isCalm ? "url(#dragon-calm)" : "url(#dragon-body)";
  return (
    <g transform={`translate(${cx} ${cy})`} style={{ animation: isCalm ? 'calm-breath 4s ease-in-out infinite' : 'dragon-stomp 0.6s ease-in-out infinite' }} filter="url(#drop-shadow)">
      {/* Tail */}
      <path d="M -30 20 Q -60 25 -55 5" fill={gradient} stroke="rgba(0,0,0,0.2)" strokeWidth="2" />

      {/* Back Spikes */}
      <polygon points="-25,-20 -15,-40 -5,-25" fill={isCalm ? "hsl(180 60% 40%)" : "hsl(0 80% 40%)"} />
      <polygon points="-5,-25 5,-45 15,-25" fill={isCalm ? "hsl(180 60% 40%)" : "hsl(0 80% 40%)"} />
      <polygon points="15,-20 25,-35 30,-15" fill={isCalm ? "hsl(180 60% 40%)" : "hsl(0 80% 40%)"} />

      {/* Body */}
      <ellipse cx="0" cy="15" rx="55" ry="40" fill={gradient} />

      {/* Belly */}
      <ellipse cx="-10" cy="20" rx="35" ry="25" fill="hsl(45 80% 70%)" opacity="0.7" />

      {/* Head */}
      <ellipse cx="20" cy="-15" rx="32" ry="28" fill={gradient} />

      {/* Snout */}
      <ellipse cx="35" cy="-10" rx="18" ry="14" fill={gradient} />

      {!isCalm ? (
        <>
          {/* Angry Eyes */}
          <ellipse cx="15" cy="-20" rx="5" ry="7" fill="white" />
          <ellipse cx="30" cy="-20" rx="5" ry="7" fill="white" />
          <circle cx="17" cy="-19" r="2.5" fill="#111" />
          <circle cx="32" cy="-19" r="2.5" fill="#111" />
          <path d="M 8 -30 L 20 -22" stroke="#111" strokeWidth="3" strokeLinecap="round" />
          <path d="M 40 -30 L 28 -22" stroke="#111" strokeWidth="3" strokeLinecap="round" />
          {/* Nostrils & Smoke */}
          <circle cx="45" cy="-12" r="2" fill="rgba(0,0,0,0.5)" />
          <circle cx="35" cy="-12" r="2" fill="rgba(0,0,0,0.5)" />
        </>
      ) : (
        <>
          {/* Calm Eyes */}
          <path d="M 10 -20 Q 15 -15 20 -20" stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 25 -20 Q 30 -15 35 -20" stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          {/* Smile */}
          <path d="M 30 -5 Q 40 5 45 -5" stroke="#111" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="28" cy="-2" r="4" fill="hsl(340 80% 60%)" opacity="0.4" />
        </>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Environment Helpers
// ---------------------------------------------------------------------------

function Sky({ gradient }: { gradient: string }) {
  return <rect x="0" y="0" width="320" height="240" fill={`url(#${gradient})`} />;
}

function Ground({ color = 'hsl(95 40% 40%)' }: { color?: string }) {
  return (
    <path d="M 0 190 Q 80 170 160 185 T 320 190 L 320 240 L 0 240 Z" fill={color} />
  );
}

function SceneShell({ children, gradient }: { children: React.ReactNode; gradient: { id: string; from: string; to: string } }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" role="img">
      <defs>
        <linearGradient id={gradient.id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradient.from} />
          <stop offset="100%" stopColor={gradient.to} />
        </linearGradient>
      </defs>
      <SharedDefs />
      <Sky gradient={gradient.id} />
      {children}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Premium Scenes
// ---------------------------------------------------------------------------

function PigsBuild() {
  return (
    <SceneShell gradient={{ id: 'g-pigs-1', from: 'hsl(200 90% 75%)', to: 'hsl(48 90% 85%)' }}>
      <circle cx="260" cy="50" r="32" fill="url(#sun)" filter="url(#glow)" />
      <Ground />
      <PremiumPig cx={80} cy={175} delay="0s" />
      <PremiumPig cx={160} cy={175} delay="0.2s" />
      <PremiumPig cx={240} cy={175} delay="0.4s" />
      <Jubee x={50} y={70} scale={0.8} />
    </SceneShell>
  );
}

function PigsStraw() {
  return (
    <SceneShell gradient={{ id: 'g-pigs-2', from: 'hsl(48 95% 70%)', to: 'hsl(35 90% 75%)' }}>
      <Ground color="hsl(45 50% 50%)" />
      <g style={{ animation: 'sway 2.5s ease-in-out infinite', transformOrigin: '160px 200px' }} filter="url(#drop-shadow)">
        <polygon points="110,160 210,160 160,90" fill="url(#straw)" />
        <rect x="120" y="160" width="80" height="50" fill="url(#straw)" />
        <rect x="145" y="175" width="30" height="35" fill="hsl(20 40% 20%)" rx="2" />
        {/* Straw texture lines */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={i} x1={125 + i * 6} y1="160" x2={123 + i * 6} y2="210" stroke="hsl(35 60% 30%)" strokeWidth="1.5" opacity="0.4" />
        ))}
      </g>
      <PremiumPig cx={80} cy={195} />
      <Jubee x={260} y={70} scale={0.75} flip />
    </SceneShell>
  );
}

function PigsWolfBlow() {
  return (
    <SceneShell gradient={{ id: 'g-pigs-3', from: 'hsl(220 40% 45%)', to: 'hsl(200 40% 65%)' }}>
      <Ground color="hsl(95 30% 30%)" />
      {/* Wolf */}
      <g transform="translate(60 160)" filter="url(#drop-shadow)">
        {/* Tail */}
        <path d="M -25 15 Q -50 20 -40 -5" fill="url(#wolf-body)" strokeWidth="2" stroke="rgba(0,0,0,0.2)" />
        {/* Body */}
        <ellipse cx="0" cy="15" rx="35" ry="25" fill="url(#wolf-body)" />
        {/* Head */}
        <ellipse cx="20" cy="-5" rx="25" ry="22" fill="url(#wolf-body)" />
        {/* Ears */}
        <polygon points="5,-15 -5,-35 15,-20" fill="url(#wolf-body)" />
        <polygon points="25,-20 35,-40 35,-15" fill="url(#wolf-body)" />
        {/* Snout */}
        <ellipse cx="40" cy="5" rx="15" ry="10" fill="hsl(220 15% 75%)" />
        <circle cx="52" cy="2" r="3" fill="#111" />
        <circle cx="20" cy="-10" r="3" fill="#111" />
        {/* Cheeks expanding */}
        <ellipse cx="25" cy="5" rx="12" ry="14" fill="hsl(220 15% 65%)" style={{ animation: 'balloon-breath 1.2s ease-in-out infinite' }} />
      </g>

      {/* Wind */}
      {[0, 1, 2, 3].map((i) => (
        <path key={i} d={`M ${120 + i*40} ${160 + (i%2)*15} Q ${140 + i*40} ${150 - (i%2)*15} ${160 + i*40} ${160 + (i%2)*15}`}
          stroke="white" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.7"
          style={{ animation: `wind-blow 1.2s ease-out infinite`, animationDelay: `${i * 0.15}s` }} />
      ))}

      {/* House debris */}
      <g style={{ animation: 'tumble 1.4s linear infinite' }}>
        <rect x="250" y="160" width="20" height="6" fill="url(#straw)" transform="rotate(20 260 163)" />
        <rect x="220" y="190" width="25" height="5" fill="url(#straw)" transform="rotate(-35 232 192)" />
        <rect x="280" y="185" width="18" height="6" fill="url(#straw)" transform="rotate(55 289 188)" />
      </g>
    </SceneShell>
  );
}

function PigsBricks() {
  return (
    <SceneShell gradient={{ id: 'g-pigs-4', from: 'hsl(200 80% 65%)', to: 'hsl(95 50% 75%)' }}>
      <circle cx="260" cy="50" r="30" fill="url(#sun)" filter="url(#glow)" />
      <Ground />
      <g filter="url(#drop-shadow)">
        <rect x="100" y="120" width="120" height="80" fill="url(#brick)" stroke="hsl(15 60% 25%)" strokeWidth="2" />
        <polygon points="90,120 230,120 160,70" fill="hsl(15 70% 35%)" stroke="hsl(15 60% 20%)" strokeWidth="2" />
        {/* Brick Lines */}
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 6 }).map((__, col) => (
            <rect key={`${row}-${col}`} x={100 + col * 20 + (row % 2) * 10} y={120 + row * 16} width="20" height="16" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
          ))
        )}
        <rect x="140" y="150" width="40" height="50" fill="hsl(20 40% 20%)" rx="4" />
        <circle cx="172" cy="175" r="3" fill="hsl(48 100% 60%)" />
      </g>
      <PremiumPig cx={260} cy={195} />
      <Jubee x={50} y={80} scale={0.85} />
    </SceneShell>
  );
}

function RaceStart() {
  return (
    <SceneShell gradient={{ id: 'g-race-1', from: 'hsl(200 80% 75%)', to: 'hsl(120 40% 80%)' }}>
      <Ground color="hsl(100 50% 45%)" />
      {/* Tortoise */}
      <g transform="translate(80 190)" filter="url(#drop-shadow)">
        <ellipse cx="25" cy="5" rx="10" ry="8" fill="url(#tortoise-skin)" />
        <path d="M 0 5 Q -10 5 -15 -5 Q -5 -10 0 -5" fill="url(#tortoise-skin)" />
        <ellipse cx="0" cy="-5" rx="22" ry="16" fill="url(#tortoise-shell)" />
        <circle cx="-16" cy="-6" r="2" fill="#111" />
        {/* Shell pattern */}
        <polygon points="0,-18 -10,-8 0,2 10,-8" fill="hsl(120 50% 35%)" opacity="0.6" />
      </g>

      {/* Hare */}
      <g transform="translate(160 175)" filter="url(#drop-shadow)">
        <ellipse cx="-15" cy="-25" rx="4" ry="18" fill="url(#hare-body)" transform="rotate(-15 -15 -25)" />
        <ellipse cx="-5" cy="-28" rx="4" ry="18" fill="url(#hare-body)" transform="rotate(15 -5 -28)" />
        <ellipse cx="0" cy="10" rx="16" ry="22" fill="url(#hare-body)" transform="rotate(20 0 10)" />
        <ellipse cx="-10" cy="-10" rx="14" ry="12" fill="url(#hare-body)" />
        <circle cx="-14" cy="-12" r="2.5" fill="#111" />
        <circle cx="12" cy="25" r="6" fill="white" />
      </g>

      <Jubee x={250} y={90} scale={0.8} />
    </SceneShell>
  );
}

function DragonMad() {
  return (
    <SceneShell gradient={{ id: 'g-dragon-1', from: 'hsl(0 60% 65%)', to: 'hsl(20 80% 75%)' }}>
      <Ground color="hsl(15 40% 30%)" />
      <PremiumDragon cx={160} cy={165} isCalm={false} />
      {/* Fallen detailed blocks */}
      <g filter="url(#drop-shadow)">
        <rect x="60" y="200" width="24" height="24" rx="2" fill="url(#brick)" transform="rotate(15 72 212)" />
        <rect x="230" y="205" width="20" height="20" rx="2" fill="url(#brick)" transform="rotate(-25 240 215)" />
      </g>
      <Jubee x={60} y={80} scale={0.75} />
    </SceneShell>
  );
}

function DragonBalloon() {
  return (
    <SceneShell gradient={{ id: 'g-dragon-2', from: 'hsl(200 70% 75%)', to: 'hsl(280 40% 75%)' }}>
      <Ground color="hsl(95 40% 40%)" />
      <PremiumDragon cx={200} cy={165} isCalm={true} />

      {/* Huge Premium Balloon */}
      <g style={{ animation: 'balloon-breath 3.5s ease-in-out infinite', transformOrigin: '100px 120px' }} filter="url(#drop-shadow)">
        <path d="M 100 180 L 95 195 L 105 195 Z" fill="hsl(340 80% 60%)" />
        <path d="M 100 195 Q 110 220 90 240" stroke="white" strokeWidth="2" fill="none" opacity="0.6" />
        <circle cx="100" cy="120" r="60" fill="hsl(340 80% 65%)" />
        <ellipse cx="75" cy="95" rx="15" ry="25" fill="white" opacity="0.4" transform="rotate(-40 75 95)" />
      </g>
      <Jubee x={260} y={70} scale={0.7} flip />
    </SceneShell>
  );
}

function SleepyTrain() {
  return (
    <SceneShell gradient={{ id: 'g-sleep-1', from: 'hsl(240 60% 15%)', to: 'hsl(260 50% 35%)' }}>
      {Array.from({ length: 25 }).map((_, i) => (
        <circle key={i} cx={(i * 47) % 320} cy={(i * 31) % 150} r={1.5 + (i % 3) * 0.5}
          fill="white" opacity={0.4 + (i % 4) * 0.15}
          style={{ animation: `star-twinkle 3s ${(i % 5) * 0.4}s ease-in-out infinite` }} filter="url(#glow)" />
      ))}
      <circle cx="260" cy="70" r="28" fill="url(#moon)" filter="url(#glow)" />

      {/* Tracks */}
      <line x1="0" y1="210" x2="320" y2="210" stroke="hsl(240 30% 25%)" strokeWidth="4" />
      {Array.from({ length: 15 }).map((_, i) => (
        <rect key={i} x={i * 24} y="210" width="12" height="6" fill="hsl(25 30% 20%)" rx="2" />
      ))}

      {/* Train */}
      <g style={{ animation: 'train-roll 4s linear infinite', transformOrigin: 'center' }} filter="url(#drop-shadow)">
        <rect x="110" y="150" width="100" height="50" rx="8" fill="hsl(340 60% 45%)" />
        <rect x="120" y="110" width="40" height="40" rx="4" fill="hsl(340 70% 35%)" />
        <polygon points="170,150 180,120 200,120 200,150" fill="hsl(340 60% 35%)" />
        <rect x="175" y="160" width="20" height="20" rx="4" fill="hsl(48 100% 85%)" filter="url(#glow)" />
        <circle cx="130" cy="205" r="14" fill="#222" stroke="#555" strokeWidth="2" />
        <circle cx="180" cy="205" r="14" fill="#222" stroke="#555" strokeWidth="2" />
        {/* Smoke */}
        <circle cx="150" cy="100" r="8" fill="white" opacity="0.4" style={{ animation: 'smoke-rise 2s ease-out infinite' }} />
        <circle cx="160" cy="80" r="12" fill="white" opacity="0.3" style={{ animation: 'smoke-rise 2s 0.3s ease-out infinite' }} />
      </g>
      <Jubee x={60} y={150} scale={0.7} />
    </SceneShell>
  );
}

function SpaceBlastoff() {
  return (
    <SceneShell gradient={{ id: 'g-space-1', from: 'hsl(240 70% 10%)', to: 'hsl(280 60% 25%)' }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <circle key={i} cx={(i * 37) % 320} cy={(i * 19) % 240} r={1 + (i % 3) * 0.6}
          fill="white" opacity={0.5 + (i % 5) * 0.15}
          style={{ animation: `star-twinkle 2s ${(i % 7) * 0.3}s ease-in-out infinite` }} filter="url(#glow)" />
      ))}

      {/* Detailed Rocket */}
      <g style={{ animation: 'rocket-launch 2.5s ease-in-out infinite', transformOrigin: '160px 200px' }} filter="url(#drop-shadow)">
        <polygon points="160,50 135,130 185,130" fill="url(#moon)" />
        <rect x="135" y="130" width="50" height="60" fill="hsl(0 70% 55%)" />
        <circle cx="160" cy="110" r="12" fill="hsl(200 90% 70%)" stroke="#333" strokeWidth="3" />
        <polygon points="135,190 120,220 145,190" fill="hsl(0 70% 40%)" />
        <polygon points="185,190 200,220 175,190" fill="hsl(0 70% 40%)" />
        {/* Thruster Flames */}
        <path d="M 145 190 Q 160 250 175 190" fill="hsl(48 100% 60%)" filter="url(#glow)"
          style={{ animation: 'flame 0.15s ease-in-out infinite alternate', transformOrigin: '160px 190px' }} />
        <path d="M 152 190 Q 160 230 168 190" fill="white" />
      </g>
      <Jubee x={70} y={90} scale={0.8} />
    </SceneShell>
  );
}

function JubeeDefault() {
  return (
    <SceneShell gradient={{ id: 'g-default', from: 'hsl(200 80% 80%)', to: 'hsl(180 60% 85%)' }}>
      <circle cx="260" cy="60" r="35" fill="url(#sun)" filter="url(#glow)" />
      <Ground color="hsl(120 40% 45%)" />
      <Jubee x={160} y={130} scale={1.8} />
    </SceneShell>
  );
}

const SCENE_MAP: Record<SceneKey, () => JSX.Element> = {
  'pigs-build': PigsBuild,
  'pigs-straw': PigsStraw,
  'pigs-wolf-blow': PigsWolfBlow,
  'pigs-bricks': PigsBricks,
  'race-start': RaceStart,
  'race-running': RaceStart, // fallback to start for now
  'race-nap': RaceStart,
  'race-win': RaceStart,
  'dragon-mad': DragonMad,
  'dragon-balloon': DragonBalloon,
  'dragon-calm': () => <DragonBalloon />, // reuse calm state
  'sleepy-train': SleepyTrain,
  'sleepy-toes': SleepyTrain,
  'sleepy-tummy': SleepyTrain,
  'space-blastoff': SpaceBlastoff,
  'space-float': SpaceBlastoff,
  'jubee-default': JubeeDefault,
};

const StoryIllustration = memo(({ storyTitle, pageIndex, size = 'lg', className = '' }: StoryIllustrationProps) => {
  const Scene = useMemo(() => SCENE_MAP[pickScene(storyTitle, pageIndex)] || JubeeDefault, [storyTitle, pageIndex]);
  const sizeClasses = size === 'sm'
    ? 'aspect-[4/3] w-full max-w-[280px] mx-auto'
    : 'aspect-[4/3] w-full max-w-[640px] mx-auto';

  return (
    <div className={`story-illustration ${sizeClasses} rounded-2xl overflow-hidden shadow-2xl border-4 border-game-accent/40 bg-card relative ${className}`}>
      <Scene />
      <style>{`
        @keyframes jubee-wing { from { transform: rotate(0deg); } to { transform: rotate(45deg); } }
        @keyframes jubee-wing-front { from { transform: rotate(0deg); } to { transform: rotate(55deg); } }
        @keyframes pig-bounce { 0%, 100% { transform: scale(1) translateY(0); } 50% { transform: scale(1.05) translateY(-10px); } }
        @keyframes dragon-stomp { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes calm-breath { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
        @keyframes balloon-breath { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes sway { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
        @keyframes wind-blow { 0% { transform: translateX(0) scale(1); opacity: 0.8; } 100% { transform: translateX(80px) scale(1.5); opacity: 0; } }
        @keyframes tumble { 100% { transform: rotate(360deg) translateX(40px); } }
        @keyframes star-twinkle { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.3); } }
        @keyframes train-roll { 0% { transform: translateY(0); } 25% { transform: translateY(-2px); } 50% { transform: translateY(0); } 75% { transform: translateY(-1px); } 100% { transform: translateY(0); } }
        @keyframes smoke-rise { 0% { transform: translateY(0) scale(1); opacity: 0.5; } 100% { transform: translateY(-40px) scale(2); opacity: 0; } }
        @keyframes rocket-launch { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes flame { from { transform: scaleY(1); } to { transform: scaleY(1.3); } }
      `}</style>
    </div>
  );
});

StoryIllustration.displayName = 'StoryIllustration';

export default StoryIllustration;
