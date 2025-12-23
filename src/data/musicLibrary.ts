export interface LyricLine {
  time: number;
  text: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  emoji: string;
  genre: 'educational' | 'lullaby' | 'playful' | 'classical' | 'routine';
  tier: 'free' | 'premium';
  audioUrl: string;
  lyrics: LyricLine[];
}

export const musicLibrary: Song[] = [
  // --- FREE TIER ---
  {
    id: 'free-1',
    title: 'The Alphabet Song',
    artist: 'Jubee Academy',
    duration: '1:30',
    emoji: '🔤',
    genre: 'educational',
    tier: 'free',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946f0a3c61.mp3',
    lyrics: [{ time: 0, text: '🎵 A B C D E F G' }, { time: 4, text: 'H I J K L M N O P' }]
  },
  {
    id: 'free-2',
    title: 'Twinkle Twinkle',
    artist: 'Jubee Lullabies',
    duration: '2:00',
    emoji: '⭐',
    genre: 'lullaby',
    tier: 'free',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_17f6ddc6b2.mp3',
    lyrics: [{ time: 0, text: '✨ Twinkle twinkle little star' }]
  },

  // --- PREMIUM TIER ---
  {
    id: 'prem-1',
    title: '2-Minute Toothbrush Timer',
    artist: 'Jubee Habits',
    duration: '2:00',
    emoji: '🦷',
    genre: 'routine',
    tier: 'premium',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    lyrics: [
      { time: 0, text: '🦷 Get your toothbrush ready!' },
      { time: 5, text: 'Brush the top teeth...' },
      { time: 30, text: 'Switch to the bottom teeth!' }
    ]
  },
  {
    id: 'prem-2',
    title: 'Clean Up Song',
    artist: 'Jubee Habits',
    duration: '1:30',
    emoji: '🧹',
    genre: 'routine',
    tier: 'premium',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_4a465d35dc.mp3',
    lyrics: [{ time: 0, text: '🎵 Clean up, clean up, everybody everywhere!' }]
  },
  {
    id: 'prem-3',
    title: 'Mozart for Focus',
    artist: 'Classical Kids',
    duration: '3:00',
    emoji: '🎻',
    genre: 'classical',
    tier: 'premium',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_17f6ddc6b2.mp3',
    lyrics: []
  },
  {
    id: 'prem-4',
    title: 'Ocean White Noise',
    artist: 'Sleep Sounds',
    duration: '5:00',
    emoji: '🌊',
    genre: 'lullaby',
    tier: 'premium',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/10/25/audio_946f0a3c61.mp3',
    lyrics: []
  }
];

