import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { musicLibrary, Song } from '@/data/musicLibrary';
import { Play, Pause, Lock, Music as MusicIcon, Loader2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useParentalStore } from '@/store/useParentalStore';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface MusicCardProps {
  song: Song;
  isLocked: boolean;
  isCurrent: boolean;
  isPlaying: boolean;
  isLoading: boolean;
  onPlay: (song: Song) => void;
}

const MusicCard = memo(({ song, isLocked, isCurrent, isPlaying, isLoading, onPlay }: MusicCardProps) => {
  return (
    <Card
      onClick={() => onPlay(song)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay(song);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${isLocked ? 'Locked premium song: ' : ''}${song.title} by ${song.artist}${isCurrent && isPlaying ? ', now playing' : ''}`}
      className={`cursor-pointer transition-all border-2 relative focus:outline-none focus-visible:ring-4 focus-visible:ring-primary
          ${isLocked ? 'opacity-75 grayscale border-muted bg-muted/20 hover:opacity-90' : 'hover:scale-[1.02] hover:shadow-lg border-transparent hover:border-primary/50'}
          ${isCurrent && !isLocked ? 'border-primary bg-primary/10 ring-2 ring-primary shadow-lg' : ''}
      `}
    >
      {isLocked && (
        <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 z-10">
          <Lock className="w-3 h-3" aria-hidden="true" /> Premium
        </div>
      )}
      <CardContent className="p-4 flex items-center gap-4">
        <div className="text-4xl flex-shrink-0" aria-hidden="true">{song.emoji}</div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold truncate text-foreground">{song.title}</h3>
          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="text-xs capitalize">{song.genre}</Badge>
            <span className="text-xs text-muted-foreground">{song.duration}</span>
          </div>
        </div>
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center" aria-hidden="true">
          {isLoading && isCurrent ? (
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          ) : isCurrent && isPlaying ? (
            <Pause className="w-6 h-6 text-primary" />
          ) : (
            <Play className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </Card>
  );
});
MusicCard.displayName = 'MusicCard';

export default function MusicPage() {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPremium = useParentalStore((state) => state.isPremium);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const stopCurrent = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsPlaying(false);
    setLoadingId(null);
    setCurrentSong(null);
  }, []);

  const playSong = useCallback((song: Song) => {
    const isLocked = song.tier === 'premium' && !isPremium;
    if (isLocked) {
      toast.info('Ask your parents to unlock Premium Music! 🎵', {
        duration: 3000,
      });
      return;
    }

    // Toggle if same song
    if (currentSong?.id === song.id && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch((err) => {
          logger.warn('Music play failed', err);
          toast.error('Could not play song. Try another one!');
          setIsPlaying(false);
        });
      }
      return;
    }

    // Stop existing audio cleanly
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }

    // Create fresh audio element
    setLoadingId(song.id);
    setCurrentSong(song);
    setIsPlaying(false);

    const audio = new Audio();
    audio.preload = 'auto';
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;

    const handleCanPlay = () => {
      setLoadingId(null);
      audio.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          logger.warn('Autoplay blocked or play failed', err);
          toast.error('Tap the song again to play 🎵');
          setIsPlaying(false);
        });
    };

    const handleError = () => {
      logger.error('Audio load error for', song.title);
      setLoadingId(null);
      setIsPlaying(false);
      setCurrentSong(null);
      audioRef.current = null;
      toast.error(`Couldn't load "${song.title}". Try another song!`);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener('canplay', handleCanPlay, { once: true });
    audio.addEventListener('error', handleError, { once: true });
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    // Set src LAST to trigger loading after listeners are attached
    audio.src = song.audioUrl;
    audio.load();
  }, [currentSong, isPlaying, isPremium]);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-32">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary mb-2 flex justify-center items-center gap-3">
          <MusicIcon className="w-10 h-10 sm:w-12 sm:h-12" aria-hidden="true" />
          Jubee Music
        </h1>
        <p className="text-muted-foreground mt-2">
          {musicLibrary.length} kid-friendly songs to sing along with! 🎶
        </p>
      </header>

      {/* Now Playing Bar */}
      {currentSong && (
        <div className="sticky top-2 z-20 mb-6 animate-in slide-in-from-top duration-300">
          <Card className="border-2 border-primary bg-card/95 backdrop-blur-sm shadow-xl">
            <CardContent className="p-3 sm:p-4 flex items-center gap-3">
              <div className="text-3xl flex-shrink-0" aria-hidden="true">{currentSong.emoji}</div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                  {loadingId === currentSong.id ? 'Loading...' : isPlaying ? 'Now Playing' : 'Paused'}
                </p>
                <p className="font-bold truncate text-foreground">{currentSong.title}</p>
              </div>
              <Button
                onClick={() => playSong(currentSong)}
                size="icon"
                variant="default"
                aria-label={isPlaying ? 'Pause' : 'Play'}
                className="flex-shrink-0 min-h-[44px] min-w-[44px]"
                disabled={loadingId === currentSong.id}
              >
                {loadingId === currentSong.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>
              <Button
                onClick={stopCurrent}
                size="icon"
                variant="ghost"
                aria-label="Close player"
                className="flex-shrink-0 min-h-[44px] min-w-[44px]"
              >
                <X className="w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {musicLibrary.map((song) => {
          const isLocked = song.tier === 'premium' && !isPremium;
          const isCurrent = currentSong?.id === song.id;

          return (
            <MusicCard
              key={song.id}
              song={song}
              isLocked={isLocked}
              isCurrent={isCurrent}
              isPlaying={isCurrent && isPlaying}
              isLoading={loadingId === song.id}
              onPlay={playSong}
            />
          );
        })}
      </div>
    </div>
  );
}
