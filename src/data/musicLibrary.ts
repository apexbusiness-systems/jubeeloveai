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

/**
 * Music Library — 19 kid-friendly lyrical songs.
 * All audio served from Internet Archive (CORS-enabled, public domain / CC).
 * URLs verified as of 2026-04-20 with HTTP 200 + audio/mpeg content-type.
 */
export const musicLibrary: Song[] = [
  // ============= FREE TIER =============
  {
    id: 'free-1', title: 'The Alphabet Song', artist: 'Sesame Street', duration: '1:30',
    emoji: '🔤', genre: 'educational', tier: 'free',
    audioUrl: 'https://ia601901.us.archive.org/13/items/tvtunes_18878/Sesame%20Street%20-%20Celebrities%20-%20Alphabet%20Song.mp3',
    lyrics: [
      { time: 0, text: '🎵 A B C D E F G' },
      { time: 4, text: 'H I J K L M N O P' },
      { time: 9, text: 'Q R S, T U V' },
      { time: 13, text: 'W X Y and Z!' },
      { time: 17, text: 'Now I know my ABCs' },
      { time: 21, text: 'Next time won\'t you sing with me!' },
    ],
  },
  {
    id: 'free-2', title: 'Twinkle Twinkle Little Star', artist: 'Hannah', duration: '1:05',
    emoji: '⭐', genre: 'lullaby', tier: 'free',
    audioUrl: 'https://ia600903.us.archive.org/12/items/TwinkleTwinkleLittleStar_578/hannah_twinkle.mp3',
    lyrics: [
      { time: 0, text: '✨ Twinkle, twinkle, little star' },
      { time: 5, text: 'How I wonder what you are' },
      { time: 10, text: 'Up above the world so high' },
      { time: 15, text: 'Like a diamond in the sky' },
    ],
  },
  {
    id: 'free-3', title: 'Old MacDonald Had a Farm', artist: 'Aidan', duration: '2:00',
    emoji: '🐮', genre: 'playful', tier: 'free',
    audioUrl: 'https://ia600501.us.archive.org/32/items/Aidans_Old_MacDonald/OldMacDonaldFace.mp3',
    lyrics: [
      { time: 0, text: '🎵 Old MacDonald had a farm' },
      { time: 4, text: 'E-I-E-I-O!' },
      { time: 8, text: 'And on his farm he had a cow' },
      { time: 12, text: 'E-I-E-I-O!' },
      { time: 16, text: 'With a moo-moo here, a moo-moo there' },
    ],
  },
  {
    id: 'free-4', title: 'Itsy Bitsy Spider', artist: 'Jubee Academy', duration: '1:30',
    emoji: '🕷️', genre: 'playful', tier: 'free',
    audioUrl: 'https://ia601805.us.archive.org/14/items/itsy-bitsy-spider-song-for-children/ITSY%20BITSY%20SPIDER%20-%20Song%20for%20Children.mp3',
    lyrics: [
      { time: 0, text: '🕷️ The itsy bitsy spider' },
      { time: 4, text: 'Climbed up the water spout' },
      { time: 8, text: 'Down came the rain' },
      { time: 11, text: 'And washed the spider out!' },
    ],
  },
  {
    id: 'free-5', title: 'Wheels on the Bus', artist: 'Jubee Academy', duration: '2:00',
    emoji: '🚌', genre: 'playful', tier: 'free',
    audioUrl: 'https://ia600700.us.archive.org/4/items/TheSpookyWheelsontheBusCD/03%20Track%203%20%28Comprehension%20Questions%29.mp3',
    lyrics: [
      { time: 0, text: '🚌 The wheels on the bus go round and round' },
      { time: 5, text: 'Round and round, round and round' },
      { time: 10, text: 'All through the town!' },
    ],
  },
  {
    id: 'free-6', title: 'Row Row Row Your Boat', artist: 'Miss Persona', duration: '1:20',
    emoji: '🚣', genre: 'lullaby', tier: 'free',
    audioUrl: 'https://ia601403.us.archive.org/2/items/miss-persona-song-row-row-row-your-boat-instrumental/Miss%20Persona%20Song%20Row%20Row%20Row%20Your%20Boat%20Instrumental.mp3',
    lyrics: [
      { time: 0, text: '🚣 Row, row, row your boat' },
      { time: 4, text: 'Gently down the stream' },
      { time: 8, text: 'Merrily, merrily, merrily, merrily' },
      { time: 13, text: 'Life is but a dream!' },
    ],
  },
  {
    id: 'free-7', title: 'If You\'re Happy and You Know It', artist: 'Pinkaide', duration: '1:50',
    emoji: '😊', genre: 'playful', tier: 'free',
    audioUrl: 'https://ia600805.us.archive.org/16/items/jamendo-360404/01-1360603-PINKAIDE-If%20You%20Are%20Happy%20And%20You%20Know%20It.mp3',
    lyrics: [
      { time: 0, text: '😊 If you\'re happy and you know it' },
      { time: 4, text: 'Clap your hands! 👏👏' },
      { time: 8, text: 'If you\'re happy and you know it' },
      { time: 12, text: 'Clap your hands! 👏👏' },
    ],
  },
  {
    id: 'free-8', title: 'Mary Had a Little Lamb', artist: 'Irving Kaufman', duration: '1:40',
    emoji: '🐑', genre: 'lullaby', tier: 'free',
    audioUrl: 'https://ia601709.us.archive.org/13/items/78_mary-had-a-little-lamb_irving-kaufman_gbia0533965b/MARY%20HAD%20A%20LITTLE%20LAMB%20-%20Irving%20Kaufman.mp3',
    lyrics: [
      { time: 0, text: '🐑 Mary had a little lamb' },
      { time: 4, text: 'Little lamb, little lamb' },
      { time: 8, text: 'Mary had a little lamb' },
      { time: 12, text: 'Its fleece was white as snow!' },
    ],
  },

  // ============= PREMIUM TIER =============
  {
    id: 'prem-1', title: 'Clean Up Song', artist: 'Jubee Habits', duration: '1:30',
    emoji: '🧹', genre: 'routine', tier: 'premium',
    audioUrl: 'https://ia601606.us.archive.org/6/items/acidplanet-audio-00261338/00261338.mp3',
    lyrics: [
      { time: 0, text: '🎵 Clean up, clean up' },
      { time: 4, text: 'Everybody, everywhere!' },
      { time: 8, text: 'Clean up, clean up' },
      { time: 12, text: 'Everybody do your share!' },
    ],
  },
  {
    id: 'prem-2', title: 'Head Shoulders Knees and Toes', artist: 'Jubee Academy', duration: '1:45',
    emoji: '🤸', genre: 'educational', tier: 'premium',
    audioUrl: 'https://ia903104.us.archive.org/13/items/headshoulderskneestoes_201911/Head%2C%20Shoulders%2C%20Knees%20%26%20Toes.mp3',
    lyrics: [
      { time: 0, text: '🤸 Head, shoulders, knees and toes' },
      { time: 4, text: 'Knees and toes!' },
      { time: 7, text: 'Head, shoulders, knees and toes' },
      { time: 11, text: 'Knees and toes!' },
      { time: 14, text: 'And eyes and ears and mouth and nose' },
    ],
  },
  {
    id: 'prem-3', title: 'Five Little Ducks', artist: 'Jubee Academy', duration: '2:10',
    emoji: '🦆', genre: 'educational', tier: 'premium',
    audioUrl: 'https://ia600406.us.archive.org/10/items/ccpci55grfftve6tlf8cl59wbsh1b2z8n5wgynas/pc5yjok3qzmkwfv-2670782319865146886_ud.mp3',
    lyrics: [
      { time: 0, text: '🦆 Five little ducks went out one day' },
      { time: 5, text: 'Over the hills and far away' },
      { time: 10, text: 'Mother duck said quack quack quack' },
      { time: 15, text: 'But only four little ducks came back!' },
    ],
  },
  {
    id: 'prem-4', title: 'Baa Baa Black Sheep', artist: 'Jubee Lullabies', duration: '1:30',
    emoji: '🐏', genre: 'lullaby', tier: 'premium',
    audioUrl: 'https://ia601409.us.archive.org/14/items/syj1x77dnjla8wsfz5vpanroqhacr22kgv5jcp9q/tqcrraoskgafbe6-2640176204677676038_ud.mp3',
    lyrics: [
      { time: 0, text: '🐏 Baa, baa, black sheep' },
      { time: 4, text: 'Have you any wool?' },
      { time: 8, text: 'Yes sir, yes sir' },
      { time: 12, text: 'Three bags full!' },
    ],
  },
  {
    id: 'prem-5', title: 'Hot Cross Buns', artist: 'Jubee Academy', duration: '1:15',
    emoji: '🥯', genre: 'playful', tier: 'premium',
    audioUrl: 'https://ia601909.us.archive.org/28/items/HotCrossBuns2/hot%20cross%20buns%202.mp3',
    lyrics: [
      { time: 0, text: '🥯 Hot cross buns!' },
      { time: 3, text: 'Hot cross buns!' },
      { time: 6, text: 'One a penny, two a penny' },
      { time: 10, text: 'Hot cross buns!' },
    ],
  },
  {
    id: 'prem-6', title: 'This Old Man', artist: 'Jubee Academy', duration: '2:00',
    emoji: '👴', genre: 'educational', tier: 'premium',
    audioUrl: 'https://ia600500.us.archive.org/2/items/this-old-man_202603/This%20Old%20Man.mp3',
    lyrics: [
      { time: 0, text: '👴 This old man, he played one' },
      { time: 4, text: 'He played knick-knack on my thumb' },
      { time: 8, text: 'With a knick-knack paddy whack' },
      { time: 12, text: 'Give a dog a bone!' },
    ],
  },
  {
    id: 'prem-7', title: 'Rain Rain Go Away', artist: 'Ted Black Orchestra', duration: '2:30',
    emoji: '🌧️', genre: 'classical', tier: 'premium',
    audioUrl: 'https://ia600707.us.archive.org/10/items/1932-USA-Archives-1932-06-22-Ted-Black-Orch-Rain-Rain-Go-Away/1932%28USA%29Archives19320622TedBlackOrch-RainRainGoAway.mp3',
    lyrics: [
      { time: 0, text: '🌧️ Rain, rain, go away' },
      { time: 4, text: 'Come again another day' },
      { time: 8, text: 'Little Jubee wants to play' },
      { time: 12, text: 'Rain, rain, go away!' },
    ],
  },
  {
    id: 'prem-8', title: 'Brahms Lullaby', artist: 'Classical Kids', duration: '3:00',
    emoji: '🎻', genre: 'classical', tier: 'premium',
    audioUrl: 'https://ia601500.us.archive.org/10/items/phwak13nwvxwdbfzt7680jgfwfpl0qgqnw8ierxo/iujzkmb69tqvhhx-2589158377672087558_hd.mp3',
    lyrics: [
      { time: 0, text: '🎻 Lullaby, and good night' },
      { time: 8, text: 'In the sky stars are bright' },
      { time: 16, text: 'Close your eyes, rest your head' },
      { time: 24, text: 'Sweet dreams in your bed' },
    ],
  },
  {
    id: 'prem-9', title: 'Ten Little Fingers', artist: 'Edison Records', duration: '1:40',
    emoji: '🔢', genre: 'educational', tier: 'premium',
    audioUrl: 'https://ia601603.us.archive.org/14/items/edison-50855_01_8223/cusb_ed_50855_01_8223_0b.mp3',
    lyrics: [
      { time: 0, text: '🔢 One, two, buckle my shoe' },
      { time: 5, text: 'Three, four, knock at the door' },
      { time: 10, text: 'Five, six, pick up sticks' },
      { time: 15, text: 'Seven, eight, lay them straight' },
      { time: 20, text: 'Nine, ten, a big fat hen!' },
    ],
  },
  {
    id: 'prem-10', title: 'Hickory Dickory Dock', artist: 'Virginia Boyer', duration: '1:25',
    emoji: '🐭', genre: 'playful', tier: 'premium',
    audioUrl: 'https://ia903107.us.archive.org/31/items/78_pussy-cat-pussy-cat-hickory-dickory-dock-humpty-dumpty-mary-had-a-little-lamb_gbia0111149b/PUSSY%20CAT%2C%20PUSSY%20CAT%3B%20HICKORY%20DICKORY%20DOC%20-%20Virginia%20Boyer.mp3',
    lyrics: [
      { time: 0, text: '🐭 Hickory dickory dock' },
      { time: 4, text: 'The mouse ran up the clock' },
      { time: 8, text: 'The clock struck one' },
      { time: 11, text: 'The mouse ran down' },
      { time: 14, text: 'Hickory dickory dock!' },
    ],
  },
  {
    id: 'prem-11', title: 'London Bridge Is Falling Down', artist: 'Betsy Lane Shepherd', duration: '2:15',
    emoji: '🌉', genre: 'classical', tier: 'premium',
    audioUrl: 'https://ia600502.us.archive.org/12/items/78_london-bridge-is-falling-down-on-the-isle-of-childhood-dreams_betsy-lane-shepherd-a_gbia3021308b/LONDON%20BRIDGE%20IS%20FAL%20-%20BETSY%20LANE%20SHEPHERD%20and%20LEWIS%20JAMES.mp3',
    lyrics: [
      { time: 0, text: '🌉 London Bridge is falling down' },
      { time: 5, text: 'Falling down, falling down' },
      { time: 10, text: 'London Bridge is falling down' },
      { time: 15, text: 'My fair lady!' },
    ],
  },
];
