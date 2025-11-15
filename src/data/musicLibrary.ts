export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  emoji: string;
  genre: 'educational' | 'lullaby' | 'playful' | 'classical';
  audioUrl: string;
}

export const musicLibrary: Song[] = [
  {
    id: '1',
    title: 'ABC Adventure',
    artist: 'Jubee & Friends',
    duration: '2:30',
    emoji: '🔤',
    genre: 'educational',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: '2',
    title: 'Count with Me',
    artist: 'Jubee & Friends',
    duration: '2:45',
    emoji: '🔢',
    genre: 'educational',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: '3',
    title: 'Rainbow Colors',
    artist: 'Jubee & Friends',
    duration: '3:00',
    emoji: '🌈',
    genre: 'educational',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: '4',
    title: 'Sweet Dreams',
    artist: 'Jubee Lullabies',
    duration: '3:20',
    emoji: '🌙',
    genre: 'lullaby',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: '5',
    title: 'Happy Dance',
    artist: 'Jubee & Friends',
    duration: '2:15',
    emoji: '💃',
    genre: 'playful',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    id: '6',
    title: 'Shape Song',
    artist: 'Jubee & Friends',
    duration: '2:50',
    emoji: '⭐',
    genre: 'educational',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  },
  {
    id: '7',
    title: 'Twinkle Stars',
    artist: 'Jubee Lullabies',
    duration: '3:10',
    emoji: '✨',
    genre: 'lullaby',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
  },
  {
    id: '8',
    title: 'Jump Around',
    artist: 'Jubee & Friends',
    duration: '2:20',
    emoji: '🦘',
    genre: 'playful',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  },
  {
    id: '9',
    title: 'Days of the Week',
    artist: 'Jubee & Friends',
    duration: '2:35',
    emoji: '📅',
    genre: 'educational',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
  },
  {
    id: '10',
    title: 'Little Bee Symphony',
    artist: 'Jubee Classical',
    duration: '3:30',
    emoji: '🎻',
    genre: 'classical',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'
  },
  {
    id: '11',
    title: 'Animal Sounds',
    artist: 'Jubee & Friends',
    duration: '2:40',
    emoji: '🐾',
    genre: 'educational',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3'
  },
  {
    id: '12',
    title: 'Sleepy Time',
    artist: 'Jubee Lullabies',
    duration: '3:15',
    emoji: '😴',
    genre: 'lullaby',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3'
  },
  {
    id: '13',
    title: 'Silly Songs',
    artist: 'Jubee & Friends',
    duration: '2:25',
    emoji: '🤪',
    genre: 'playful',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3'
  },
  {
    id: '14',
    title: 'Weather Wonders',
    artist: 'Jubee & Friends',
    duration: '2:55',
    emoji: '⛅',
    genre: 'educational',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3'
  },
  {
    id: '15',
    title: 'Gentle Clouds',
    artist: 'Jubee Lullabies',
    duration: '3:25',
    emoji: '☁️',
    genre: 'lullaby',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3'
  },
  {
    id: '16',
    title: 'Playground Fun',
    artist: 'Jubee & Friends',
    duration: '2:10',
    emoji: '🎪',
    genre: 'playful',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3'
  },
  {
    id: '17',
    title: 'Body Parts Song',
    artist: 'Jubee & Friends',
    duration: '2:45',
    emoji: '👋',
    genre: 'educational',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_4a465d35dc.mp3'
  },
  {
    id: '18',
    title: 'Moonlight Melody',
    artist: 'Jubee Classical',
    duration: '3:40',
    emoji: '🎹',
    genre: 'classical',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3'
  },
  {
    id: '19',
    title: 'Clap Your Hands',
    artist: 'Jubee & Friends',
    duration: '2:05',
    emoji: '👏',
    genre: 'playful',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3'
  },
  {
    id: '20',
    title: 'Goodnight Little One',
    artist: 'Jubee Lullabies',
    duration: '3:30',
    emoji: '🌟',
    genre: 'lullaby',
    audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_17f6ddc6b2.mp3'
  }
];
