import { memo, useMemo } from 'react';
import { premiumStories } from '@/data/storySeedData';

interface StoryIllustrationProps {
  storyTitle: string;
  pageIndex: number;
  size?: 'sm' | 'lg';
  className?: string;
}

const getTheme = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('pigs')) {
    return { from: 'hsl(120 40% 70%)', to: 'hsl(200 60% 80%)' }; // Green/Blue
  }
  if (t.includes('tortoise') || t.includes('hare')) {
    return { from: 'hsl(40 80% 70%)', to: 'hsl(20 80% 70%)' }; // Orange/Yellow
  }
  if (t.includes('mad') || t.includes('dragon')) {
    return { from: 'hsl(0 70% 70%)', to: 'hsl(30 80% 70%)' }; // Red/Orange
  }
  if (t.includes('sleepy') || t.includes('bedtime')) {
    return { from: 'hsl(240 40% 40%)', to: 'hsl(260 50% 30%)' }; // Night blues
  }
  if (t.includes('space')) {
    return { from: 'hsl(280 60% 20%)', to: 'hsl(240 60% 10%)' }; // Deep space
  }
  return { from: 'hsl(48 100% 80%)', to: 'hsl(35 90% 70%)' }; // Default Jubee
};

const StoryIllustration = memo(({ storyTitle, pageIndex, size = 'lg', className = '' }: StoryIllustrationProps) => {
  const story = useMemo(() => {
    return premiumStories.find(s => s.title.toLowerCase() === storyTitle.toLowerCase());
  }, [storyTitle]);

  const emojis = useMemo(() => {
    if (!story) return '📖✨';
    const page = story.pages[pageIndex] || story.pages[0];
    return page?.illustration || '📖✨';
  }, [story, pageIndex]);

  const theme = useMemo(() => getTheme(storyTitle), [storyTitle]);

  const sizeClasses = size === 'sm'
    ? 'aspect-[4/3] w-full max-w-[280px] mx-auto text-6xl'
    : 'aspect-[4/3] w-full max-w-[640px] mx-auto text-8xl md:text-9xl';

  return (
    <div
      className={`story-illustration ${sizeClasses} rounded-2xl overflow-hidden shadow-lg border-4 border-game-accent/40 flex items-center justify-center relative ${className}`}
      style={{
        background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
      }}
    >
      <div
        className="transform transition-transform hover:scale-110 flex gap-4 drop-shadow-2xl"
        style={{
          animation: 'bounce-gentle 3s ease-in-out infinite'
        }}
      >
        {emojis.split(/(?=[\uD800-\uDBFF][\uDC00-\uDFFF])/).map((emoji, idx) => (
           <span key={idx} style={{
              animation: `float ${2 + idx * 0.5}s ease-in-out infinite`,
              display: 'inline-block'
           }}>
             {emoji}
           </span>
        ))}
      </div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
});

StoryIllustration.displayName = 'StoryIllustration';

export default StoryIllustration;
