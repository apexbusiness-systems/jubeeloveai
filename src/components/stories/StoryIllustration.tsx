import { memo, useMemo } from 'react';

/**
 * StoryIllustration — bespoke, hand-crafted animated SVG scenes.
 * Replaces emoji-based visuals with premium, proprietary artwork.
 *
 * Scenes are picked by matching the story title (case-insensitive)
 * + page index, with sensible fallbacks. All animations are pure CSS
 * keyframes for buttery smoothness on every device.
 */

interface StoryIllustrationProps {
  storyTitle: string;
  pageIndex: number;
  /** small (card thumbnail) | full (reader page) */
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
    return ['pigs-build', 'pigs-straw', 'pigs-wolf-blow', 'pigs-bricks'][page] as SceneKey
      ?? 'pigs-build';
  }
  if (t.includes('tortoise') || t.includes('hare')) {
    return ['race-start', 'race-running', 'race-nap', 'race-win'][page] as SceneKey
      ?? 'race-start';
  }
  if (t.includes('big mad') || t.includes('dragon')) {
    return ['dragon-mad', 'dragon-balloon', 'dragon-calm'][page] as SceneKey
      ?? 'dragon-mad';
  }
  if (t.includes('sleepy train') || t.includes('bedtime')) {
    return ['sleepy-train', 'sleepy-toes', 'sleepy-tummy'][page] as SceneKey
      ?? 'sleepy-train';
  }
  if (t.includes('space')) {
    return ['space-blastoff', 'space-float'][page] as SceneKey ?? 'space-blastoff';
  }
  return 'jubee-default';
}

// ---------------------------------------------------------------------------
// Reusable SVG fragments
// ---------------------------------------------------------------------------

function Jubee({ x = 0, y = 0, scale = 1, wing = true }: { x?: number; y?: number; scale?: number; wing?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* body */}
      <ellipse cx="0" cy="0" rx="22" ry="18" fill="hsl(48 96% 60%)" />
      {/* stripes */}
      <path d="M -14 -8 Q -14 8 -10 12" stroke="hsl(20 14% 12%)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 0 -14 Q 0 14 0 14" stroke="hsl(20 14% 12%)" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M 14 -8 Q 14 8 10 12" stroke="hsl(20 14% 12%)" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* wing */}
      {wing && (
        <ellipse
          cx="-6" cy="-14" rx="12" ry="8"
          fill="hsl(200 100% 92%)" opacity="0.7"
          style={{ transformOrigin: '-6px -14px', animation: 'jubee-wing 0.18s ease-in-out infinite alternate' }}
        />
      )}
      {/* eyes */}
      <circle cx="-6" cy="-3" r="3" fill="white" />
      <circle cx="6" cy="-3" r="3" fill="white" />
      <circle cx="-5" cy="-2" r="1.5" fill="hsl(20 14% 12%)" />
      <circle cx="7" cy="-2" r="1.5" fill="hsl(20 14% 12%)" />
      {/* smile */}
      <path d="M -5 5 Q 0 9 5 5" stroke="hsl(20 14% 12%)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* antennae */}
      <line x1="-6" y1="-16" x2="-10" y2="-26" stroke="hsl(20 14% 12%)" strokeWidth="2" strokeLinecap="round" />
      <line x1="6" y1="-16" x2="10" y2="-26" stroke="hsl(20 14% 12%)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="-10" cy="-26" r="2" fill="hsl(20 14% 12%)" />
      <circle cx="10" cy="-26" r="2" fill="hsl(20 14% 12%)" />
    </g>
  );
}

function Sky({ gradient }: { gradient: string }) {
  return <rect x="0" y="0" width="320" height="240" fill={`url(#${gradient})`} />;
}

function Ground({ color = 'hsl(95 50% 45%)' }: { color?: string }) {
  return <path d="M 0 200 Q 80 180 160 195 T 320 200 L 320 240 L 0 240 Z" fill={color} />;
}

// ---------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------

function SceneShell({ children, gradient }: { children: React.ReactNode; gradient: { id: string; from: string; to: string } }) {
  return (
    <svg viewBox="0 0 320 240" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" role="img">
      <defs>
        <linearGradient id={gradient.id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradient.from} />
          <stop offset="100%" stopColor={gradient.to} />
        </linearGradient>
      </defs>
      <Sky gradient={gradient.id} />
      {children}
    </svg>
  );
}

function PigsBuild() {
  return (
    <SceneShell gradient={{ id: 'g-pigs-1', from: 'hsl(200 90% 80%)', to: 'hsl(48 95% 88%)' }}>
      <circle cx="260" cy="50" r="28" fill="hsl(48 100% 70%)" opacity="0.95" />
      <Ground />
      {[80, 160, 240].map((cx, i) => (
        <g key={i} style={{ animation: `pig-bounce 1.6s ease-in-out infinite`, animationDelay: `${i * 0.2}s`, transformOrigin: `${cx}px 180px` }}>
          <ellipse cx={cx} cy="180" rx="22" ry="18" fill="hsl(340 75% 82%)" />
          <circle cx={cx + 8} cy="170" r="3" fill="hsl(20 14% 12%)" />
          <circle cx={cx - 8} cy="170" r="3" fill="hsl(20 14% 12%)" />
          <ellipse cx={cx} cy="182" rx="6" ry="4" fill="hsl(340 60% 70%)" />
          <circle cx={cx - 2} cy="182" r="1" fill="hsl(20 14% 12%)" />
          <circle cx={cx + 2} cy="182" r="1" fill="hsl(20 14% 12%)" />
        </g>
      ))}
      <Jubee x={50} y={70} scale={0.8} />
    </SceneShell>
  );
}

function PigsStraw() {
  return (
    <SceneShell gradient={{ id: 'g-pigs-2', from: 'hsl(48 95% 75%)', to: 'hsl(35 90% 80%)' }}>
      <Ground color="hsl(45 60% 55%)" />
      {/* straw house */}
      <g style={{ animation: 'sway 2s ease-in-out infinite', transformOrigin: '160px 200px' }}>
        <polygon points="120,160 200,160 160,100" fill="hsl(45 90% 55%)" stroke="hsl(35 80% 35%)" strokeWidth="3" />
        <rect x="125" y="160" width="70" height="50" fill="hsl(48 80% 65%)" stroke="hsl(35 80% 35%)" strokeWidth="3" />
        {Array.from({ length: 8 }).map((_, i) => (
          <line key={i} x1={130 + i * 8} y1="165" x2={132 + i * 8} y2="205" stroke="hsl(35 60% 40%)" strokeWidth="1.5" />
        ))}
        <rect x="150" y="180" width="20" height="30" fill="hsl(20 30% 25%)" />
      </g>
      <ellipse cx="80" cy="200" rx="22" ry="18" fill="hsl(340 75% 82%)" />
      <Jubee x={260} y={70} scale={0.7} />
    </SceneShell>
  );
}

function PigsWolfBlow() {
  return (
    <SceneShell gradient={{ id: 'g-pigs-3', from: 'hsl(220 30% 50%)', to: 'hsl(200 40% 70%)' }}>
      <Ground color="hsl(95 30% 35%)" />
      {/* wolf */}
      <g transform="translate(70 170)">
        <ellipse cx="0" cy="0" rx="34" ry="26" fill="hsl(220 8% 35%)" />
        <polygon points="-30,-22 -20,-2 -38,-8" fill="hsl(220 8% 35%)" />
        <polygon points="30,-22 20,-2 38,-8" fill="hsl(220 8% 35%)" />
        <circle cx="-12" cy="-8" r="3" fill="hsl(48 100% 60%)" />
        <circle cx="12" cy="-8" r="3" fill="hsl(48 100% 60%)" />
        <ellipse cx="32" cy="2" rx="10" ry="5" fill="hsl(220 8% 28%)" />
        <ellipse cx="38" cy="2" rx="3" ry="2" fill="hsl(20 14% 10%)" />
      </g>
      {/* wind puffs */}
      {[0, 1, 2, 3].map((i) => (
        <ellipse key={i}
          cx={120 + i * 30} cy={170 + (i % 2) * 8}
          rx={14 + i * 2} ry={9}
          fill="white" opacity={0.55 - i * 0.08}
          style={{ animation: `wind-blow 1.2s ease-out infinite`, animationDelay: `${i * 0.15}s`, transformOrigin: '70px 170px' }}
        />
      ))}
      {/* tumbling house pieces */}
      <g style={{ animation: 'tumble 1.4s ease-in-out infinite' }}>
        <rect x="240" y="180" width="14" height="14" fill="hsl(45 90% 55%)" transform="rotate(20 247 187)" />
        <rect x="220" y="200" width="10" height="10" fill="hsl(45 80% 50%)" transform="rotate(-30 225 205)" />
        <rect x="270" y="195" width="12" height="12" fill="hsl(48 85% 60%)" transform="rotate(45 276 201)" />
      </g>
    </SceneShell>
  );
}

function PigsBricks() {
  return (
    <SceneShell gradient={{ id: 'g-pigs-4', from: 'hsl(200 90% 78%)', to: 'hsl(95 50% 80%)' }}>
      <circle cx="260" cy="50" r="24" fill="hsl(48 100% 70%)" />
      <Ground />
      {/* brick castle */}
      <g>
        <rect x="100" y="120" width="120" height="80" fill="hsl(15 65% 55%)" stroke="hsl(15 60% 35%)" strokeWidth="3" />
        <polygon points="95,120 225,120 160,80" fill="hsl(15 70% 45%)" stroke="hsl(15 60% 30%)" strokeWidth="3" />
        {/* bricks pattern */}
        {Array.from({ length: 4 }).map((_, row) =>
          Array.from({ length: 6 }).map((__, col) => (
            <rect key={`${row}-${col}`}
              x={102 + col * 20 + (row % 2) * 10} y={125 + row * 18}
              width="18" height="16" fill="none" stroke="hsl(15 50% 35%)" strokeWidth="1"
            />
          ))
        )}
        <rect x="145" y="160" width="30" height="40" fill="hsl(20 30% 20%)" stroke="hsl(15 50% 30%)" strokeWidth="2" />
        <circle cx="170" cy="180" r="2" fill="hsl(48 100% 65%)" />
      </g>
      <ellipse cx="260" cy="200" rx="20" ry="16" fill="hsl(340 75% 82%)" style={{ animation: 'pig-bounce 1.5s ease-in-out infinite', transformOrigin: '260px 200px' }} />
      <Jubee x={50} y={80} scale={0.85} />
    </SceneShell>
  );
}

function RaceStart() {
  return (
    <SceneShell gradient={{ id: 'g-race-1', from: 'hsl(200 90% 82%)', to: 'hsl(95 60% 78%)' }}>
      <Ground />
      <line x1="40" y1="200" x2="40" y2="140" stroke="hsl(0 0% 20%)" strokeWidth="3" />
      {/* checkered flag */}
      {Array.from({ length: 5 }).map((_, r) =>
        Array.from({ length: 3 }).map((__, c) => (
          <rect key={`${r}-${c}`} x={42 + c * 8} y={140 + r * 8}
            width="8" height="8" fill={(r + c) % 2 === 0 ? 'white' : 'hsl(20 14% 12%)'} />
        ))
      )}
      {/* hare */}
      <g style={{ animation: 'hare-hop 0.7s ease-in-out infinite', transformOrigin: '120px 200px' }}>
        <ellipse cx="120" cy="195" rx="22" ry="14" fill="hsl(35 30% 75%)" />
        <ellipse cx="138" cy="183" rx="9" ry="7" fill="hsl(35 30% 75%)" />
        <ellipse cx="135" cy="170" rx="3" ry="10" fill="hsl(35 30% 75%)" transform="rotate(-15 135 170)" />
        <ellipse cx="142" cy="170" rx="3" ry="10" fill="hsl(35 30% 75%)" transform="rotate(10 142 170)" />
        <circle cx="142" cy="183" r="1.6" fill="hsl(20 14% 12%)" />
      </g>
      {/* tortoise */}
      <g>
        <ellipse cx="240" cy="200" rx="26" ry="14" fill="hsl(95 45% 35%)" />
        <ellipse cx="240" cy="195" rx="22" ry="11" fill="hsl(95 35% 45%)" />
        <circle cx="216" cy="198" r="6" fill="hsl(95 40% 50%)" />
        <circle cx="218" cy="196" r="1.4" fill="hsl(20 14% 12%)" />
      </g>
      <Jubee x={280} y={80} scale={0.7} />
    </SceneShell>
  );
}

function RaceRunning() {
  return (
    <SceneShell gradient={{ id: 'g-race-2', from: 'hsl(200 95% 85%)', to: 'hsl(95 60% 78%)' }}>
      <Ground />
      <g style={{ animation: 'hare-zoom 1s linear infinite', transformOrigin: '50% 50%' }}>
        <ellipse cx="240" cy="195" rx="22" ry="14" fill="hsl(35 30% 75%)" />
        <ellipse cx="258" cy="183" rx="9" ry="7" fill="hsl(35 30% 75%)" />
        {/* speed lines */}
        <line x1="200" y1="190" x2="180" y2="190" stroke="hsl(0 0% 80%)" strokeWidth="2" />
        <line x1="195" y1="200" x2="170" y2="200" stroke="hsl(0 0% 80%)" strokeWidth="2" />
        <line x1="200" y1="180" x2="185" y2="180" stroke="hsl(0 0% 80%)" strokeWidth="2" />
      </g>
      <g>
        <ellipse cx="60" cy="208" rx="20" ry="11" fill="hsl(95 45% 35%)" />
        <ellipse cx="60" cy="204" rx="17" ry="9" fill="hsl(95 35% 45%)" />
        <circle cx="42" cy="206" r="5" fill="hsl(95 40% 50%)" />
      </g>
      <Jubee x={160} y={70} scale={0.8} />
    </SceneShell>
  );
}

function RaceNap() {
  return (
    <SceneShell gradient={{ id: 'g-race-3', from: 'hsl(220 60% 80%)', to: 'hsl(48 95% 88%)' }}>
      <Ground />
      {/* tree */}
      <rect x="226" y="130" width="10" height="60" fill="hsl(25 50% 30%)" />
      <circle cx="231" cy="120" r="34" fill="hsl(120 45% 45%)" />
      {/* hare sleeping */}
      <g>
        <ellipse cx="220" cy="200" rx="24" ry="12" fill="hsl(35 30% 75%)" />
        <text x="245" y="175" fontSize="22" fill="hsl(220 30% 40%)"
          style={{ animation: 'zzz-float 2s ease-in-out infinite' }}>z</text>
        <text x="255" y="160" fontSize="16" fill="hsl(220 30% 40%)"
          style={{ animation: 'zzz-float 2s ease-in-out infinite', animationDelay: '0.5s' }}>z</text>
      </g>
      {/* tortoise plodding */}
      <g style={{ animation: 'tortoise-walk 3s linear infinite' }}>
        <ellipse cx="100" cy="208" rx="20" ry="11" fill="hsl(95 45% 35%)" />
        <ellipse cx="100" cy="204" rx="17" ry="9" fill="hsl(95 35% 45%)" />
        <circle cx="82" cy="206" r="5" fill="hsl(95 40% 50%)" />
      </g>
      <Jubee x={50} y={70} scale={0.7} />
    </SceneShell>
  );
}

function RaceWin() {
  return (
    <SceneShell gradient={{ id: 'g-race-4', from: 'hsl(48 100% 75%)', to: 'hsl(35 95% 70%)' }}>
      <Ground />
      {/* confetti */}
      {Array.from({ length: 14 }).map((_, i) => (
        <rect key={i}
          x={20 + i * 22} y={20 + (i * 11) % 60} width="6" height="10"
          fill={['hsl(0 90% 60%)', 'hsl(48 100% 60%)', 'hsl(200 90% 60%)', 'hsl(120 60% 50%)'][i % 4]}
          style={{ animation: `confetti-fall 2s ${i * 0.1}s ease-in infinite` }}
        />
      ))}
      {/* trophy */}
      <g transform="translate(160 100)">
        <path d="M -22 0 L 22 0 L 18 30 L -18 30 Z" fill="hsl(48 95% 55%)" stroke="hsl(35 80% 35%)" strokeWidth="2" />
        <rect x="-12" y="30" width="24" height="8" fill="hsl(35 70% 35%)" />
        <rect x="-18" y="38" width="36" height="6" fill="hsl(35 70% 35%)" />
        <path d="M -22 0 Q -38 8 -28 22" stroke="hsl(48 95% 55%)" strokeWidth="4" fill="none" />
        <path d="M 22 0 Q 38 8 28 22" stroke="hsl(48 95% 55%)" strokeWidth="4" fill="none" />
      </g>
      <g>
        <ellipse cx="160" cy="195" rx="26" ry="14" fill="hsl(95 45% 35%)" />
        <ellipse cx="160" cy="190" rx="22" ry="11" fill="hsl(95 35% 45%)" />
        <circle cx="142" cy="193" r="6" fill="hsl(95 40% 50%)" />
      </g>
      <Jubee x={260} y={70} scale={0.8} />
    </SceneShell>
  );
}

function DragonMad() {
  return (
    <SceneShell gradient={{ id: 'g-dragon-1', from: 'hsl(0 60% 70%)', to: 'hsl(20 80% 80%)' }}>
      <Ground color="hsl(15 40% 35%)" />
      {/* dragon */}
      <g style={{ animation: 'dragon-stomp 0.6s ease-in-out infinite', transformOrigin: '160px 180px' }}>
        <ellipse cx="160" cy="170" rx="48" ry="34" fill="hsl(0 70% 45%)" />
        <ellipse cx="160" cy="135" rx="26" ry="22" fill="hsl(0 70% 50%)" />
        {/* spikes */}
        <polygon points="138,116 144,98 150,116" fill="hsl(0 60% 35%)" />
        <polygon points="158,110 164,92 170,110" fill="hsl(0 60% 35%)" />
        <polygon points="178,116 184,98 190,116" fill="hsl(0 60% 35%)" />
        {/* angry eyes */}
        <ellipse cx="150" cy="135" rx="4" ry="5" fill="white" />
        <ellipse cx="170" cy="135" rx="4" ry="5" fill="white" />
        <circle cx="150" cy="136" r="2" fill="hsl(20 14% 10%)" />
        <circle cx="170" cy="136" r="2" fill="hsl(20 14% 10%)" />
        {/* eyebrows angry */}
        <line x1="143" y1="128" x2="155" y2="132" stroke="hsl(20 14% 10%)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="165" y1="132" x2="177" y2="128" stroke="hsl(20 14% 10%)" strokeWidth="2.5" strokeLinecap="round" />
        {/* smoke from nostrils */}
        {[0, 1, 2].map(i => (
          <ellipse key={i} cx={155 + i * 5} cy={120 - i * 6} rx={3 + i} ry={3 + i}
            fill="hsl(0 0% 60%)" opacity={0.7 - i * 0.2}
            style={{ animation: `smoke-rise 1s ${i * 0.2}s ease-out infinite` }}
          />
        ))}
      </g>
      {/* fallen blocks */}
      <rect x="60" y="208" width="20" height="20" fill="hsl(15 65% 55%)" transform="rotate(15 70 218)" />
      <rect x="240" y="212" width="18" height="18" fill="hsl(15 65% 50%)" transform="rotate(-25 249 221)" />
      <rect x="80" y="200" width="14" height="14" fill="hsl(15 70% 60%)" transform="rotate(-10 87 207)" />
      <Jubee x={50} y={80} scale={0.7} />
    </SceneShell>
  );
}

function DragonBalloon() {
  return (
    <SceneShell gradient={{ id: 'g-dragon-2', from: 'hsl(200 80% 80%)', to: 'hsl(280 50% 80%)' }}>
      <Ground color="hsl(95 40% 45%)" />
      <g>
        <ellipse cx="160" cy="170" rx="48" ry="34" fill="hsl(0 50% 60%)" />
        <ellipse cx="160" cy="135" rx="26" ry="22" fill="hsl(0 50% 65%)" />
        <ellipse cx="150" cy="135" rx="3" ry="4" fill="hsl(20 14% 10%)" />
        <ellipse cx="170" cy="135" rx="3" ry="4" fill="hsl(20 14% 10%)" />
      </g>
      {/* big balloon */}
      <g style={{ animation: 'balloon-breath 3s ease-in-out infinite', transformOrigin: '90px 100px' }}>
        <circle cx="90" cy="100" r="38" fill="hsl(340 80% 70%)" stroke="hsl(340 60% 50%)" strokeWidth="2" />
        <ellipse cx="80" cy="90" rx="8" ry="12" fill="white" opacity="0.5" />
        <line x1="90" y1="138" x2="90" y2="200" stroke="hsl(0 0% 30%)" strokeWidth="1.5" />
      </g>
      <Jubee x={240} y={100} scale={0.95} />
    </SceneShell>
  );
}

function DragonCalm() {
  return (
    <SceneShell gradient={{ id: 'g-dragon-3', from: 'hsl(200 80% 88%)', to: 'hsl(180 60% 85%)' }}>
      <Ground color="hsl(95 50% 50%)" />
      <g style={{ animation: 'calm-breath 4s ease-in-out infinite', transformOrigin: '160px 180px' }}>
        <ellipse cx="160" cy="170" rx="48" ry="34" fill="hsl(180 50% 55%)" />
        <ellipse cx="160" cy="135" rx="26" ry="22" fill="hsl(180 50% 60%)" />
        {/* closed peaceful eyes */}
        <path d="M 144 134 Q 150 138 156 134" stroke="hsl(20 14% 10%)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 164 134 Q 170 138 176 134" stroke="hsl(20 14% 10%)" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* gentle smile */}
        <path d="M 152 148 Q 160 154 168 148" stroke="hsl(20 14% 10%)" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      {/* hearts floating */}
      {[0, 1, 2].map(i => (
        <text key={i} x={70 + i * 90} y={120 - i * 10} fontSize="20" fill="hsl(340 80% 65%)"
          style={{ animation: `heart-float 3s ${i * 0.6}s ease-in-out infinite` }}>♥</text>
      ))}
      <Jubee x={50} y={80} scale={0.8} />
    </SceneShell>
  );
}

function SleepyTrain() {
  return (
    <SceneShell gradient={{ id: 'g-sleep-1', from: 'hsl(240 50% 25%)', to: 'hsl(260 40% 40%)' }}>
      {/* stars */}
      {Array.from({ length: 20 }).map((_, i) => (
        <circle key={i} cx={(i * 47) % 320} cy={(i * 31) % 140} r={1 + (i % 3) * 0.5}
          fill="white" opacity={0.6 + (i % 4) * 0.1}
          style={{ animation: `star-twinkle 3s ${(i % 5) * 0.4}s ease-in-out infinite` }}
        />
      ))}
      {/* moon */}
      <circle cx="260" cy="60" r="22" fill="hsl(48 100% 88%)" />
      <circle cx="252" cy="55" r="18" fill="hsl(240 50% 25%)" />
      {/* tracks */}
      <line x1="0" y1="200" x2="320" y2="200" stroke="hsl(35 30% 30%)" strokeWidth="3" />
      {Array.from({ length: 12 }).map((_, i) => (
        <rect key={i} x={i * 28} y="200" width="20" height="6" fill="hsl(25 40% 25%)" />
      ))}
      {/* train */}
      <g style={{ animation: 'train-roll 4s linear infinite', transformOrigin: 'center' }}>
        <rect x="120" y="150" width="80" height="40" rx="4" fill="hsl(0 60% 50%)" stroke="hsl(0 50% 30%)" strokeWidth="2" />
        <rect x="125" y="120" width="35" height="30" fill="hsl(0 55% 45%)" stroke="hsl(0 50% 30%)" strokeWidth="2" />
        <rect x="165" y="160" width="14" height="14" fill="hsl(48 100% 80%)" />
        <rect x="185" y="160" width="14" height="14" fill="hsl(48 100% 80%)" />
        <circle cx="135" cy="195" r="10" fill="hsl(20 14% 15%)" />
        <circle cx="135" cy="195" r="4" fill="hsl(35 40% 50%)" />
        <circle cx="185" cy="195" r="10" fill="hsl(20 14% 15%)" />
        <circle cx="185" cy="195" r="4" fill="hsl(35 40% 50%)" />
        <circle cx="148" cy="115" r="3" fill="hsl(0 0% 70%)" opacity="0.7"
          style={{ animation: 'smoke-rise 1.5s ease-out infinite' }} />
      </g>
      <Jubee x={60} y={170} scale={0.7} />
    </SceneShell>
  );
}

function SleepyToes() {
  return (
    <SceneShell gradient={{ id: 'g-sleep-2', from: 'hsl(260 40% 35%)', to: 'hsl(280 35% 50%)' }}>
      {Array.from({ length: 15 }).map((_, i) => (
        <circle key={i} cx={(i * 39) % 320} cy={(i * 23) % 100} r={1 + (i % 3) * 0.4}
          fill="white" opacity="0.7"
          style={{ animation: `star-twinkle 3s ${(i % 5) * 0.4}s ease-in-out infinite` }}
        />
      ))}
      {/* feet */}
      <g style={{ animation: 'wiggle-toes 1.6s ease-in-out infinite', transformOrigin: '160px 200px' }}>
        <ellipse cx="130" cy="200" rx="30" ry="18" fill="hsl(35 65% 75%)" />
        <ellipse cx="190" cy="200" rx="30" ry="18" fill="hsl(35 65% 75%)" />
        {[0, 1, 2, 3, 4].map(i => (
          <circle key={`l${i}`} cx={108 + i * 8} cy={188} r={3} fill="hsl(35 65% 70%)" />
        ))}
        {[0, 1, 2, 3, 4].map(i => (
          <circle key={`r${i}`} cx={168 + i * 8} cy={188} r={3} fill="hsl(35 65% 70%)" />
        ))}
      </g>
      <Jubee x={160} y={100} scale={0.8} />
    </SceneShell>
  );
}

function SleepyTummy() {
  return (
    <SceneShell gradient={{ id: 'g-sleep-3', from: 'hsl(260 35% 30%)', to: 'hsl(220 40% 50%)' }}>
      {Array.from({ length: 18 }).map((_, i) => (
        <circle key={i} cx={(i * 41) % 320} cy={(i * 29) % 110} r={1 + (i % 3) * 0.5}
          fill="white" opacity="0.6" />
      ))}
      {/* sleeping silhouette */}
      <g>
        <ellipse cx="160" cy="200" rx="100" ry="22" fill="hsl(220 40% 25%)" />
        <ellipse cx="80" cy="190" rx="22" ry="18" fill="hsl(35 60% 70%)" />
        <path d="M 70 185 Q 75 188 80 185" stroke="hsl(20 14% 15%)" strokeWidth="1.5" fill="none" />
        <path d="M 84 185 Q 89 188 94 185" stroke="hsl(20 14% 15%)" strokeWidth="1.5" fill="none" />
        {/* breathing tummy */}
        <ellipse cx="180" cy="190" rx="60" ry="16" fill="hsl(220 50% 35%)"
          style={{ animation: 'tummy-breath 3.5s ease-in-out infinite', transformOrigin: '180px 190px' }} />
      </g>
      {/* zzz */}
      {[0, 1, 2].map(i => (
        <text key={i} x={100 + i * 12} y={150 - i * 12} fontSize={18 - i * 2}
          fill="white" opacity="0.8"
          style={{ animation: `zzz-float 3s ${i * 0.5}s ease-in-out infinite` }}>z</text>
      ))}
      <Jubee x={260} y={130} scale={0.7} />
    </SceneShell>
  );
}

function SpaceBlastoff() {
  return (
    <SceneShell gradient={{ id: 'g-space-1', from: 'hsl(240 60% 15%)', to: 'hsl(280 50% 30%)' }}>
      {Array.from({ length: 30 }).map((_, i) => (
        <circle key={i} cx={(i * 37) % 320} cy={(i * 19) % 200} r={1 + (i % 3) * 0.4}
          fill="white" opacity={0.5 + (i % 5) * 0.1}
          style={{ animation: `star-twinkle 2s ${(i % 7) * 0.3}s ease-in-out infinite` }}
        />
      ))}
      {/* rocket */}
      <g style={{ animation: 'rocket-launch 2.4s ease-out infinite', transformOrigin: '160px 200px' }}>
        <polygon points="160,40 140,120 180,120" fill="hsl(0 0% 92%)" stroke="hsl(0 0% 60%)" strokeWidth="2" />
        <rect x="140" y="120" width="40" height="50" fill="hsl(0 70% 55%)" stroke="hsl(0 60% 40%)" strokeWidth="2" />
        <circle cx="160" cy="100" r="6" fill="hsl(200 90% 70%)" />
        <polygon points="140,170 130,200 145,170" fill="hsl(0 60% 45%)" />
        <polygon points="180,170 190,200 175,170" fill="hsl(0 60% 45%)" />
        {/* flames */}
        <polygon points="148,170 160,210 172,170" fill="hsl(48 100% 60%)"
          style={{ animation: 'flame 0.2s ease-in-out infinite alternate', transformOrigin: '160px 170px' }} />
        <polygon points="153,170 160,200 167,170" fill="hsl(0 90% 55%)" />
      </g>
      <Jubee x={70} y={80} scale={0.75} />
    </SceneShell>
  );
}

function SpaceFloat() {
  return (
    <SceneShell gradient={{ id: 'g-space-2', from: 'hsl(240 60% 12%)', to: 'hsl(260 50% 25%)' }}>
      {Array.from({ length: 35 }).map((_, i) => (
        <circle key={i} cx={(i * 43) % 320} cy={(i * 27) % 230} r={1 + (i % 3) * 0.5}
          fill="white" opacity={0.4 + (i % 6) * 0.1} />
      ))}
      {/* planet */}
      <circle cx="260" cy="180" r="50" fill="hsl(220 60% 50%)" />
      <ellipse cx="260" cy="180" rx="70" ry="10" fill="none" stroke="hsl(48 80% 70%)" strokeWidth="3" opacity="0.8" />
      <circle cx="245" cy="170" r="8" fill="hsl(220 50% 40%)" />
      <circle cx="275" cy="195" r="6" fill="hsl(220 50% 40%)" />
      {/* floating Jubee */}
      <g style={{ animation: 'space-float 4s ease-in-out infinite', transformOrigin: '120px 130px' }}>
        <Jubee x={120} y={130} scale={1.2} />
      </g>
    </SceneShell>
  );
}

function JubeeDefault() {
  return (
    <SceneShell gradient={{ id: 'g-default', from: 'hsl(48 100% 80%)', to: 'hsl(35 90% 70%)' }}>
      <circle cx="260" cy="60" r="28" fill="hsl(48 100% 65%)" />
      <Ground />
      {[60, 140, 220].map((cx, i) => (
        <g key={i}>
          <rect x={cx - 2} y="160" width="4" height="40" fill="hsl(95 50% 35%)" />
          <circle cx={cx} cy="155" r="14" fill={['hsl(340 80% 70%)', 'hsl(280 70% 70%)', 'hsl(48 100% 65%)'][i]} />
          <circle cx={cx} cy="155" r="4" fill="hsl(48 100% 90%)" />
        </g>
      ))}
      <Jubee x={160} y={120} scale={1.2} />
    </SceneShell>
  );
}

const SCENE_MAP: Record<SceneKey, () => JSX.Element> = {
  'pigs-build': PigsBuild,
  'pigs-straw': PigsStraw,
  'pigs-wolf-blow': PigsWolfBlow,
  'pigs-bricks': PigsBricks,
  'race-start': RaceStart,
  'race-running': RaceRunning,
  'race-nap': RaceNap,
  'race-win': RaceWin,
  'dragon-mad': DragonMad,
  'dragon-balloon': DragonBalloon,
  'dragon-calm': DragonCalm,
  'sleepy-train': SleepyTrain,
  'sleepy-toes': SleepyToes,
  'sleepy-tummy': SleepyTummy,
  'space-blastoff': SpaceBlastoff,
  'space-float': SpaceFloat,
  'jubee-default': JubeeDefault,
};

const StoryIllustration = memo(({ storyTitle, pageIndex, size = 'lg', className = '' }: StoryIllustrationProps) => {
  const Scene = useMemo(() => SCENE_MAP[pickScene(storyTitle, pageIndex)], [storyTitle, pageIndex]);
  const sizeClasses = size === 'sm'
    ? 'aspect-[4/3] w-full max-w-[280px] mx-auto'
    : 'aspect-[4/3] w-full max-w-[640px] mx-auto';

  return (
    <div className={`story-illustration ${sizeClasses} rounded-2xl overflow-hidden shadow-lg border-4 border-game-accent/40 bg-card ${className}`}>
      <Scene />
    </div>
  );
});

StoryIllustration.displayName = 'StoryIllustration';

export default StoryIllustration;
