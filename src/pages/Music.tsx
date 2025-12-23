import { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { musicLibrary, Song } from '@/data/musicLibrary';
import { Play, Lock, Music as MusicIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useParentalStore } from '@/store/useParentalStore';
import { toast } from 'sonner';

export default function MusicPage() {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { isPremium } = useParentalStore();

  const playSong = useCallback((song: Song) => {
    const isLocked = song.tier === 'premium' && !isPremium;
    if (isLocked) {
        toast.info("Ask your parents to unlock Premium Music! 🎵");
        return;
    }

    if (currentSong?.id === song.id) {
      if (isPlaying) audioRef.current?.pause();
      else audioRef.current?.play();
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
      setTimeout(() => audioRef.current?.play(), 0);
    }
  }, [currentSong, isPlaying, isPremium]);

  return (
    <div className="max-w-6xl mx-auto p-6 pb-32">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-bold text-primary mb-2 flex justify-center gap-3">
            <MusicIcon className="w-12 h-12" /> Jubee Music
        </h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {musicLibrary.map((song) => {
            const isLocked = song.tier === 'premium' && !isPremium;
            const isCurrent = currentSong?.id === song.id;

            return (
              <Card 
                key={song.id} 
                onClick={() => playSong(song)}
                className={`cursor-pointer transition-all border-2 relative 
                    ${isLocked ? 'opacity-75 grayscale border-muted bg-muted/20' : 'hover:scale-105 border-transparent hover:border-primary'}
                    ${isCurrent ? 'border-primary bg-primary/10 ring-2 ring-primary' : ''}
                `}
              >
                {isLocked && (
                    <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1 z-10">
                        <Lock className="w-3 h-3" /> Premium
                    </div>
                )}
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="text-4xl">{song.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold truncate">{song.title}</h3>
                    <p className="text-sm text-muted-foreground">{song.artist}</p>
                    <Badge variant="outline" className="mt-2 text-xs capitalize">{song.genre}</Badge>
                  </div>
                  {isCurrent && isPlaying && <Play className="w-6 h-6 text-primary animate-pulse" />}
                </CardContent>
              </Card>
            );
        })}
      </div>

      <audio 
        ref={audioRef} 
        src={currentSong?.audioUrl} 
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
    </div>
  );
}

