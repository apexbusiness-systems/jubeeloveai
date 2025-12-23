import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react';
import { SEO } from '@/components/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { musicLibrary, Song } from '@/data/musicLibrary';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music as MusicIcon, Mic, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

// Memoized song item component for better performance
const SongItem = memo(({ 
  song, 
  isCurrentSong, 
  isPlaying, 
  onPlay,
  getGenreColor 
}: { 
  song: Song; 
  isCurrentSong: boolean; 
  isPlaying: boolean; 
  onPlay: (song: Song) => void;
  getGenreColor: (genre: string) => string;
}) => {
  const { t } = useTranslation();
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
        isCurrentSong 
          ? 'border-primary bg-primary/5' 
          : 'border-border hover:border-primary/50'
      }`}
      onClick={() => onPlay(song)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-4xl">{song.emoji}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{song.title}</h3>
            <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={getGenreColor(song.genre)}>
                {t(`music.${song.genre}`)}
              </Badge>
              <span className="text-xs text-muted-foreground">{song.duration}</span>
            </div>
          </div>
          {isCurrentSong && isPlaying && (
            <div className="flex items-center">
              <div className="w-1 h-4 bg-primary animate-pulse mx-0.5"></div>
              <div className="w-1 h-6 bg-primary animate-pulse mx-0.5" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-4 bg-primary animate-pulse mx-0.5" style={{ animationDelay: '0.4s' }}></div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
SongItem.displayName = 'SongItem';

export default function MusicPage() {
  const { t } = useTranslation();
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('jubee-music-volume');
    return saved ? parseFloat(saved) : 0.7;
  });
  const [selectedGenre, setSelectedGenre] = useState<string>(() => {
    return localStorage.getItem('jubee-music-genre') || 'all';
  });
  const [currentLyricIndex, setCurrentLyricIndex] = useState(0);
  const [karaokeMode, setKaraokeMode] = useState(() => {
    return localStorage.getItem('jubee-karaoke-mode') === 'true';
  });
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);

  const genres = useMemo(() => ['all', 'educational', 'lullaby', 'playful', 'classical'], []);

  // Memoize filtered songs to avoid recalculation on every render
  const filteredSongs = useMemo(() => 
    selectedGenre === 'all' 
      ? musicLibrary 
      : musicLibrary.filter(song => song.genre === selectedGenre),
    [selectedGenre]
  );

  // Persist volume changes
  useEffect(() => {
    localStorage.setItem('jubee-music-volume', volume.toString());
  }, [volume]);

  // Persist genre selection
  useEffect(() => {
    localStorage.setItem('jubee-music-genre', selectedGenre);
  }, [selectedGenre]);

  // Persist karaoke mode
  useEffect(() => {
    localStorage.setItem('jubee-karaoke-mode', karaokeMode.toString());
  }, [karaokeMode]);

  // Optimized audio event handlers with useCallback
  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    setCurrentTime(audio.currentTime);
    
    // Update current lyric based on time
    if (currentSong?.lyrics) {
      const currentIndex = currentSong.lyrics.findIndex((lyric, idx) => {
        const nextLyric = currentSong.lyrics![idx + 1];
        return audio.currentTime >= lyric.time && (!nextLyric || audio.currentTime < nextLyric.time);
      });
      if (currentIndex !== -1) {
        setCurrentLyricIndex(currentIndex);
      }
    }
  }, [currentSong?.lyrics]);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration);
      setIsLoading(false);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    playNext();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', () => setIsLoading(true));
    audio.addEventListener('canplay', () => setIsLoading(false));

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', () => setIsLoading(true));
      audio.removeEventListener('canplay', () => setIsLoading(false));
    };
  }, [handleTimeUpdate, handleLoadedMetadata, handleEnded]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Sleep timer effect
  useEffect(() => {
    if (sleepTimer !== null) {
      setSleepTimerRemaining(sleepTimer);
      
      sleepTimerRef.current = setInterval(() => {
        setSleepTimerRemaining((prev) => {
          if (prev === null || prev <= 1) {
            // Timer finished
            if (audioRef.current && isPlaying) {
              audioRef.current.pause();
              setIsPlaying(false);
            }
            setSleepTimer(null);
            if (sleepTimerRef.current) {
              clearInterval(sleepTimerRef.current);
            }
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
      }
    };
  }, [sleepTimer, isPlaying]);

  const playSong = useCallback((song: Song) => {
    if (currentSong?.id === song.id) {
      togglePlayPause();
    } else {
      setIsLoading(true);
      setCurrentSong(song);
      setCurrentLyricIndex(0);
      setCurrentTime(0);
      setIsPlaying(true);
      setTimeout(() => {
        audioRef.current?.play().catch(err => {
          console.error('Playback failed:', err);
          setIsPlaying(false);
          setIsLoading(false);
        });
      }, 0);
    }
  }, [currentSong?.id]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(err => {
        console.error('Playback failed:', err);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const playNext = useCallback(() => {
    if (!currentSong) return;
    const currentIndex = filteredSongs.findIndex(s => s.id === currentSong.id);
    const nextSong = filteredSongs[(currentIndex + 1) % filteredSongs.length];
    playSong(nextSong);
  }, [currentSong, filteredSongs, playSong]);

  const playPrevious = useCallback(() => {
    if (!currentSong) return;
    const currentIndex = filteredSongs.findIndex(s => s.id === currentSong.id);
    const prevSong = filteredSongs[(currentIndex - 1 + filteredSongs.length) % filteredSongs.length];
    playSong(prevSong);
  }, [currentSong, filteredSongs, playSong]);

  const handleSeek = useCallback((value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  }, []);

  const formatTime = useCallback((time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const formatSleepTimer = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const setSleepTimerMinutes = useCallback((minutes: number | null) => {
    if (minutes === null) {
      setSleepTimer(null);
      setSleepTimerRemaining(null);
      if (sleepTimerRef.current) {
        clearInterval(sleepTimerRef.current);
      }
    } else {
      setSleepTimer(minutes * 60);
    }
  }, []);

  const getGenreColor = useCallback((genre: string) => {
    switch (genre) {
      case 'educational': return 'bg-blue-500/20 text-blue-700 border-blue-300';
      case 'lullaby': return 'bg-purple-500/20 text-purple-700 border-purple-300';
      case 'playful': return 'bg-green-500/20 text-green-700 border-green-300';
      case 'classical': return 'bg-amber-500/20 text-amber-700 border-amber-300';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-300';
    }
  }, []);

  return (
    <>
      <SEO 
        title={`${t('app.title')} - ${t('music.title')}`}
        description={t('music.subtitle')}
      />
      
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-32">
        <header className="text-center mb-8 pt-4">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2 flex items-center justify-center gap-3">
            <MusicIcon className="w-10 h-10" />
            {t('music.title')}
          </h1>
          <p className="text-primary text-lg">
            {t('music.subtitle')}
          </p>
        </header>

        {/* Genre Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {genres.map((genre) => (
            <Button
              key={genre}
              variant={selectedGenre === genre ? 'default' : 'outline'}
              onClick={() => setSelectedGenre(genre)}
              className="capitalize"
            >
              {genre === 'all' ? t('music.allGenres') : t(`music.${genre}`)}
            </Button>
          ))}
        </div>

        {/* Song List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading && filteredSongs.length === 0 ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-2">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-16 h-16 rounded" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex gap-2 mt-2">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            filteredSongs.map((song) => (
              <SongItem
                key={song.id}
                song={song}
                isCurrentSong={currentSong?.id === song.id}
                isPlaying={isPlaying}
                onPlay={playSong}
                getGenreColor={getGenreColor}
              />
            ))
          )}
        </div>

        {/* Player Controls */}
        {currentSong && (
          <Card className="fixed bottom-20 left-0 right-0 mx-auto max-w-4xl border-4 border-primary/30 bg-background/95 backdrop-blur shadow-2xl">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Lyrics Panel */}
                {currentSong.lyrics && currentSong.lyrics.length > 0 && (
                  <div className="md:w-64 flex-shrink-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-muted-foreground">🎤 Sing Along</h4>
                      <div className="flex items-center gap-2">
                        <Mic className={`w-4 h-4 ${karaokeMode ? 'text-primary' : 'text-muted-foreground'}`} />
                        <Switch
                          checked={karaokeMode}
                          onCheckedChange={setKaraokeMode}
                          className="scale-75"
                        />
                      </div>
                    </div>
                    <ScrollArea className="h-32 md:h-full rounded-lg border-2 border-primary/20 bg-primary/5 p-3">
                      <div className="space-y-2">
                        {currentSong.lyrics.map((lyric, idx) => {
                          const shouldShow = karaokeMode 
                            ? idx <= currentLyricIndex + 1 // Show current and next line in karaoke mode
                            : true; // Show all lines in normal mode
                          
                          return (
                            <p
                              key={idx}
                              className={`text-sm transition-all duration-300 ${
                                !shouldShow
                                  ? 'opacity-0 h-0'
                                  : idx === currentLyricIndex
                                  ? 'text-primary font-bold text-lg scale-105'
                                  : idx < currentLyricIndex
                                  ? 'text-muted-foreground/50'
                                  : idx === currentLyricIndex + 1 && karaokeMode
                                  ? 'text-muted-foreground/70 text-xs' // Next line preview in karaoke
                                  : 'text-foreground/70'
                              }`}
                            >
                              {shouldShow ? lyric.text : ''}
                            </p>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Player Controls */}
                <div className="flex-1 flex flex-col gap-4">
                {/* Now Playing Info */}
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{currentSong.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{currentSong.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
                  </div>
                  <Badge className={getGenreColor(currentSong.genre)}>
                    {t(`music.${currentSong.genre}`)}
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={1}
                    onValueChange={handleSeek}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Volume2 className="w-4 h-4" />
                    <Slider
                      value={[volume * 100]}
                      max={100}
                      step={1}
                      onValueChange={(v) => setVolume(v[0] / 100)}
                      className="w-24 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={playPrevious}
                      className="rounded-full"
                    >
                      <SkipBack className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="default"
                      size="icon"
                      onClick={togglePlayPause}
                      className="rounded-full w-12 h-12"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={playNext}
                      className="rounded-full"
                    >
                      <SkipForward className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="flex-1 flex justify-end items-center gap-2">
                    <Moon className={`w-4 h-4 ${sleepTimer ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="flex gap-1">
                      <Button
                        variant={sleepTimer === 15 * 60 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSleepTimerMinutes(sleepTimer === 15 * 60 ? null : 15)}
                        className="h-8 px-2 text-xs"
                      >
                        15m
                      </Button>
                      <Button
                        variant={sleepTimer === 30 * 60 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSleepTimerMinutes(sleepTimer === 30 * 60 ? null : 30)}
                        className="h-8 px-2 text-xs"
                      >
                        30m
                      </Button>
                      <Button
                        variant={sleepTimer === 60 * 60 ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSleepTimerMinutes(sleepTimer === 60 * 60 ? null : 60)}
                        className="h-8 px-2 text-xs"
                      >
                        60m
                      </Button>
                    </div>
                    {sleepTimerRemaining !== null && (
                      <span className="text-xs text-primary font-mono ml-1">
                        {formatSleepTimer(sleepTimerRemaining)}
                      </span>
                    )}
                  </div>
                </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <audio ref={audioRef} src={currentSong?.audioUrl} />
      </div>
    </>
  );
}
