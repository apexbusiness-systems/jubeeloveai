/**
 * JubeeDance Song Library
 * 
 * 22 kid-friendly lyrical songs for ages 2-5.
 * Each song includes dance patterns synced to the music.
 */

import type { DanceSong, DanceMove } from './types';

// Helper to generate simple dance patterns based on BPM
function generatePattern(
  bpm: number, 
  durationSec: number, 
  difficulty: 'easy' | 'medium' | 'hard'
): DanceMove[] {
  const moves: DanceMove[] = [];
  const beatInterval = 60000 / bpm; // ms per beat
  const directions: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right'];
  
  // Determine how often to place moves based on difficulty
  const beatsPerMove = difficulty === 'easy' ? 4 : difficulty === 'medium' ? 2 : 1;
  const moveInterval = beatInterval * beatsPerMove;
  
  // Start after 2 seconds for preparation
  let time = 2000;
  const endTime = durationSec * 1000 - 1000; // Stop 1 second before end
  
  while (time < endTime) {
    const direction = directions[moves.length % 4];
    moves.push({ direction, time });
    time += moveInterval;
  }
  
  return moves;
}

export const danceSongLibrary: DanceSong[] = [
  // === FREE TIER (6 songs) ===
  {
    id: 'dance-1',
    title: 'Head, Shoulders, Knees & Toes',
    artist: 'Jubee Dance',
    emoji: '🙋',
    duration: 45,
    bpm: 100,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'free',
    ageRange: 'all',
    lyrics: [
      { time: 0, text: '🎵 Get ready to dance!' },
      { time: 2000, text: 'Head, shoulders, knees and toes' },
      { time: 5000, text: 'Knees and toes!' },
      { time: 7000, text: 'Head, shoulders, knees and toes' },
      { time: 10000, text: 'Knees and toes!' },
      { time: 12000, text: 'Eyes and ears and mouth and nose!' },
      { time: 16000, text: 'Head, shoulders, knees and toes' },
      { time: 20000, text: 'Knees and toes! ⭐' },
    ],
    pattern: {
      difficulty: 'easy',
      moves: generatePattern(100, 45, 'easy'),
    },
  },
  {
    id: 'dance-2',
    title: 'If You\'re Happy and You Know It',
    artist: 'Jubee Dance',
    emoji: '😊',
    duration: 60,
    bpm: 110,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'free',
    ageRange: 'all',
    lyrics: [
      { time: 0, text: '🎵 Clap your hands!' },
      { time: 2000, text: 'If you\'re happy and you know it' },
      { time: 5000, text: 'Clap your hands! 👏' },
      { time: 8000, text: 'If you\'re happy and you know it' },
      { time: 11000, text: 'Clap your hands! 👏' },
      { time: 14000, text: 'If you\'re happy and you know it' },
      { time: 18000, text: 'And you really want to show it!' },
      { time: 22000, text: 'If you\'re happy and you know it' },
      { time: 26000, text: 'Clap your hands! 👏' },
    ],
    pattern: {
      difficulty: 'easy',
      moves: generatePattern(110, 60, 'easy'),
    },
  },
  {
    id: 'dance-3',
    title: 'The Wheels on the Bus',
    artist: 'Jubee Dance',
    emoji: '🚌',
    duration: 55,
    bpm: 95,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'free',
    ageRange: 'all',
    lyrics: [
      { time: 0, text: '🚌 Here comes the bus!' },
      { time: 2000, text: 'The wheels on the bus go' },
      { time: 4500, text: 'Round and round! 🔄' },
      { time: 7000, text: 'Round and round!' },
      { time: 9500, text: 'Round and round!' },
      { time: 12000, text: 'The wheels on the bus go' },
      { time: 15000, text: 'Round and round!' },
      { time: 18000, text: 'All through the town! 🏘️' },
    ],
    pattern: {
      difficulty: 'easy',
      moves: generatePattern(95, 55, 'easy'),
    },
  },
  {
    id: 'dance-4',
    title: 'Twinkle Twinkle Little Star',
    artist: 'Jubee Dance',
    emoji: '⭐',
    duration: 50,
    bpm: 80,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'free',
    ageRange: '2-3',
    lyrics: [
      { time: 0, text: '✨ Shine bright!' },
      { time: 2000, text: 'Twinkle, twinkle, little star' },
      { time: 6000, text: 'How I wonder what you are! ⭐' },
      { time: 10000, text: 'Up above the world so high' },
      { time: 14000, text: 'Like a diamond in the sky! 💎' },
      { time: 18000, text: 'Twinkle, twinkle, little star' },
      { time: 22000, text: 'How I wonder what you are! ✨' },
    ],
    pattern: {
      difficulty: 'easy',
      moves: generatePattern(80, 50, 'easy'),
    },
  },
  {
    id: 'dance-5',
    title: 'Old MacDonald Had a Farm',
    artist: 'Jubee Dance',
    emoji: '🐄',
    duration: 65,
    bpm: 105,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'free',
    ageRange: 'all',
    lyrics: [
      { time: 0, text: '🚜 Down on the farm!' },
      { time: 2000, text: 'Old MacDonald had a farm' },
      { time: 5000, text: 'E-I-E-I-O! 🎵' },
      { time: 8000, text: 'And on that farm he had a cow' },
      { time: 12000, text: 'E-I-E-I-O!' },
      { time: 15000, text: 'With a moo-moo here!' },
      { time: 18000, text: 'And a moo-moo there! 🐄' },
    ],
    pattern: {
      difficulty: 'easy',
      moves: generatePattern(105, 65, 'easy'),
    },
  },
  {
    id: 'dance-6',
    title: 'Row Row Row Your Boat',
    artist: 'Jubee Dance',
    emoji: '⛵',
    duration: 40,
    bpm: 85,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'free',
    ageRange: '2-3',
    lyrics: [
      { time: 0, text: '⛵ Let\'s row!' },
      { time: 2000, text: 'Row, row, row your boat' },
      { time: 5000, text: 'Gently down the stream! 🌊' },
      { time: 8000, text: 'Merrily, merrily, merrily, merrily' },
      { time: 12000, text: 'Life is but a dream! 💭' },
    ],
    pattern: {
      difficulty: 'easy',
      moves: generatePattern(85, 40, 'easy'),
    },
  },

  // === PREMIUM TIER (16 songs) ===
  {
    id: 'dance-7',
    title: 'Baby Shark Dance',
    artist: 'Jubee Dance',
    emoji: '🦈',
    duration: 70,
    bpm: 115,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'premium',
    ageRange: 'all',
    lyrics: [
      { time: 0, text: '🦈 Baby shark time!' },
      { time: 2000, text: 'Baby shark, doo doo doo doo doo' },
      { time: 5000, text: 'Baby shark! 🦈' },
      { time: 8000, text: 'Mommy shark, doo doo doo doo doo' },
      { time: 11000, text: 'Mommy shark! 🦈' },
      { time: 14000, text: 'Daddy shark, doo doo doo doo doo' },
      { time: 17000, text: 'Daddy shark! 🦈' },
      { time: 20000, text: 'Let\'s go hunt!' },
    ],
    pattern: {
      difficulty: 'medium',
      moves: generatePattern(115, 70, 'medium'),
    },
  },
  {
    id: 'dance-8',
    title: 'The Itsy Bitsy Spider',
    artist: 'Jubee Dance',
    emoji: '🕷️',
    duration: 50,
    bpm: 90,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'premium',
    ageRange: '2-3',
    lyrics: [
      { time: 0, text: '🕷️ Climb up!' },
      { time: 2000, text: 'The itsy bitsy spider' },
      { time: 4500, text: 'Climbed up the water spout! 🌧️' },
      { time: 8000, text: 'Down came the rain' },
      { time: 10500, text: 'And washed the spider out!' },
      { time: 14000, text: 'Out came the sun ☀️' },
      { time: 17000, text: 'And dried up all the rain!' },
      { time: 20000, text: 'And the itsy bitsy spider' },
      { time: 23000, text: 'Climbed up the spout again! 🕷️' },
    ],
    pattern: {
      difficulty: 'easy',
      moves: generatePattern(90, 50, 'easy'),
    },
  },
  {
    id: 'dance-9',
    title: 'Five Little Monkeys',
    artist: 'Jubee Dance',
    emoji: '🐒',
    duration: 75,
    bpm: 120,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'premium',
    ageRange: '3-4',
    lyrics: [
      { time: 0, text: '🐒 Jump around!' },
      { time: 2000, text: 'Five little monkeys jumping on the bed' },
      { time: 6000, text: 'One fell off and bumped his head! 🤕' },
      { time: 10000, text: 'Mama called the doctor' },
      { time: 13000, text: 'And the doctor said:' },
      { time: 16000, text: 'No more monkeys jumping on the bed! 🛏️' },
    ],
    pattern: {
      difficulty: 'medium',
      moves: generatePattern(120, 75, 'medium'),
    },
  },
  {
    id: 'dance-10',
    title: 'The Hokey Pokey',
    artist: 'Jubee Dance',
    emoji: '🕺',
    duration: 80,
    bpm: 125,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'premium',
    ageRange: 'all',
    lyrics: [
      { time: 0, text: '🕺 Shake it!' },
      { time: 2000, text: 'You put your right hand in' },
      { time: 4500, text: 'You put your right hand out!' },
      { time: 7000, text: 'You put your right hand in' },
      { time: 9500, text: 'And you shake it all about!' },
      { time: 12000, text: 'You do the hokey pokey!' },
      { time: 15000, text: 'And you turn yourself around!' },
      { time: 18000, text: 'That\'s what it\'s all about! 🎉' },
    ],
    pattern: {
      difficulty: 'medium',
      moves: generatePattern(125, 80, 'medium'),
    },
  },
  {
    id: 'dance-11',
    title: 'I\'m a Little Teapot',
    artist: 'Jubee Dance',
    emoji: '🫖',
    duration: 45,
    bpm: 95,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'premium',
    ageRange: '2-3',
    lyrics: [
      { time: 0, text: '🫖 Pour it out!' },
      { time: 2000, text: 'I\'m a little teapot' },
      { time: 4500, text: 'Short and stout!' },
      { time: 7000, text: 'Here is my handle' },
      { time: 9000, text: 'Here is my spout! 🫖' },
      { time: 12000, text: 'When I get all steamed up' },
      { time: 15000, text: 'Hear me shout!' },
      { time: 18000, text: 'Tip me over and pour me out! ☕' },
    ],
    pattern: {
      difficulty: 'easy',
      moves: generatePattern(95, 45, 'easy'),
    },
  },
  {
    id: 'dance-12',
    title: 'London Bridge Is Falling Down',
    artist: 'Jubee Dance',
    emoji: '🌉',
    duration: 55,
    bpm: 100,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'premium',
    ageRange: '3-4',
    lyrics: [
      { time: 0, text: '🌉 Build it up!' },
      { time: 2000, text: 'London Bridge is falling down' },
      { time: 5000, text: 'Falling down, falling down!' },
      { time: 8000, text: 'London Bridge is falling down' },
      { time: 11000, text: 'My fair lady! 👸' },
      { time: 14000, text: 'Build it up with sticks and stones!' },
      { time: 18000, text: 'Sticks and stones! 🪨' },
    ],
    pattern: {
      difficulty: 'medium',
      moves: generatePattern(100, 55, 'medium'),
    },
  },
  {
    id: 'dance-13',
    title: 'Mary Had a Little Lamb',
    artist: 'Jubee Dance',
    emoji: '🐑',
    duration: 50,
    bpm: 90,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'premium',
    ageRange: '2-3',
    lyrics: [
      { time: 0, text: '🐑 Follow the lamb!' },
      { time: 2000, text: 'Mary had a little lamb' },
      { time: 5000, text: 'Little lamb, little lamb! 🐑' },
      { time: 8000, text: 'Mary had a little lamb' },
      { time: 11000, text: 'Its fleece was white as snow!' },
      { time: 15000, text: 'Everywhere that Mary went' },
      { time: 18000, text: 'The lamb was sure to go! ❄️' },
    ],
    pattern: {
      difficulty: 'easy',
      moves: generatePattern(90, 50, 'easy'),
    },
  },
  {
    id: 'dance-14',
    title: 'Baa Baa Black Sheep',
    artist: 'Jubee Dance',
    emoji: '🐑',
    duration: 45,
    bpm: 85,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'premium',
    ageRange: '2-3',
    lyrics: [
      { time: 0, text: '🐑 Wool time!' },
      { time: 2000, text: 'Baa, baa, black sheep' },
      { time: 4500, text: 'Have you any wool?' },
      { time: 7000, text: 'Yes sir, yes sir!' },
      { time: 9000, text: 'Three bags full! 🛍️' },
      { time: 12000, text: 'One for the master' },
      { time: 14500, text: 'One for the dame!' },
      { time: 17000, text: 'One for the little boy' },
      { time: 20000, text: 'Who lives down the lane! 🏠' },
    ],
    pattern: {
      difficulty: 'easy',
      moves: generatePattern(85, 45, 'easy'),
    },
  },
  {
    id: 'dance-15',
    title: 'Pat-a-Cake',
    artist: 'Jubee Dance',
    emoji: '🎂',
    duration: 40,
    bpm: 100,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'premium',
    ageRange: '2-3',
    lyrics: [
      { time: 0, text: '🎂 Bake a cake!' },
      { time: 2000, text: 'Pat-a-cake, pat-a-cake' },
      { time: 4500, text: 'Baker\'s man! 👨‍🍳' },
      { time: 7000, text: 'Bake me a cake' },
      { time: 9000, text: 'As fast as you can!' },
      { time: 12000, text: 'Roll it and pat it' },
      { time: 14500, text: 'And mark it with B!' },
      { time: 17000, text: 'Put it in the oven' },
      { time: 19500, text: 'For baby and me! 🎂' },
    ],
    pattern: {
      difficulty: 'easy',
      moves: generatePattern(100, 40, 'easy'),
    },
  },
  {
    id: 'dance-16',
    title: 'Ring Around the Rosie',
    artist: 'Jubee Dance',
    emoji: '🌹',
    duration: 35,
    bpm: 105,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'premium',
    ageRange: 'all',
    lyrics: [
      { time: 0, text: '🌹 Spin around!' },
      { time: 2000, text: 'Ring around the rosie' },
      { time: 4500, text: 'Pocket full of posies! 💐' },
      { time: 7000, text: 'Ashes, ashes' },
      { time: 9500, text: 'We all fall down!' },
      { time: 12000, text: 'Everybody fall down! 😄' },
    ],
    pattern: {
      difficulty: 'easy',
      moves: generatePattern(105, 35, 'easy'),
    },
  },
  {
    id: 'dance-17',
    title: 'Humpty Dumpty',
    artist: 'Jubee Dance',
    emoji: '🥚',
    duration: 45,
    bpm: 90,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'premium',
    ageRange: '3-4',
    lyrics: [
      { time: 0, text: '🥚 Watch out!' },
      { time: 2000, text: 'Humpty Dumpty sat on a wall' },
      { time: 5500, text: 'Humpty Dumpty had a great fall! 🧱' },
      { time: 9000, text: 'All the king\'s horses' },
      { time: 12000, text: 'And all the king\'s men 🐎' },
      { time: 15000, text: 'Couldn\'t put Humpty' },
      { time: 18000, text: 'Together again! 🥚' },
    ],
    pattern: {
      difficulty: 'medium',
      moves: generatePattern(90, 45, 'medium'),
    },
  },
  {
    id: 'dance-18',
    title: 'Jack and Jill',
    artist: 'Jubee Dance',
    emoji: '🪣',
    duration: 50,
    bpm: 95,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'premium',
    ageRange: '3-4',
    lyrics: [
      { time: 0, text: '🪣 Up the hill!' },
      { time: 2000, text: 'Jack and Jill went up the hill' },
      { time: 5500, text: 'To fetch a pail of water! 💧' },
      { time: 9000, text: 'Jack fell down and broke his crown' },
      { time: 13000, text: 'And Jill came tumbling after! 🏃' },
    ],
    pattern: {
      difficulty: 'medium',
      moves: generatePattern(95, 50, 'medium'),
    },
  },
  {
    id: 'dance-19',
    title: 'This Old Man',
    artist: 'Jubee Dance',
    emoji: '👴',
    duration: 60,
    bpm: 110,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'premium',
    ageRange: 'all',
    lyrics: [
      { time: 0, text: '👴 Knick knack!' },
      { time: 2000, text: 'This old man, he played one' },
      { time: 5000, text: 'He played knick-knack on my thumb! 👍' },
      { time: 9000, text: 'With a knick-knack paddy-whack' },
      { time: 12000, text: 'Give a dog a bone! 🦴' },
      { time: 15000, text: 'This old man came rolling home!' },
    ],
    pattern: {
      difficulty: 'medium',
      moves: generatePattern(110, 60, 'medium'),
    },
  },
  {
    id: 'dance-20',
    title: 'Hickory Dickory Dock',
    artist: 'Jubee Dance',
    emoji: '🐭',
    duration: 45,
    bpm: 100,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'premium',
    ageRange: '3-4',
    lyrics: [
      { time: 0, text: '🐭 Tick tock!' },
      { time: 2000, text: 'Hickory dickory dock' },
      { time: 4500, text: 'The mouse ran up the clock! ⏰' },
      { time: 8000, text: 'The clock struck one' },
      { time: 10500, text: 'The mouse ran down!' },
      { time: 13000, text: 'Hickory dickory dock! 🐭' },
    ],
    pattern: {
      difficulty: 'medium',
      moves: generatePattern(100, 45, 'medium'),
    },
  },
  {
    id: 'dance-21',
    title: 'Little Bo Peep',
    artist: 'Jubee Dance',
    emoji: '🐑',
    duration: 50,
    bpm: 85,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'premium',
    ageRange: '4-5',
    lyrics: [
      { time: 0, text: '🐑 Find the sheep!' },
      { time: 2000, text: 'Little Bo Peep has lost her sheep' },
      { time: 6000, text: 'And doesn\'t know where to find them! 🔍' },
      { time: 10000, text: 'Leave them alone' },
      { time: 12500, text: 'And they\'ll come home' },
      { time: 15000, text: 'Wagging their tails behind them! 🐑' },
    ],
    pattern: {
      difficulty: 'medium',
      moves: generatePattern(85, 50, 'medium'),
    },
  },
  {
    id: 'dance-22',
    title: 'The Muffin Man',
    artist: 'Jubee Dance',
    emoji: '🧁',
    duration: 45,
    bpm: 95,
    audioUrl: '/audio/music/juju-bely-rock-2.mp3',
    tier: 'premium',
    ageRange: 'all',
    lyrics: [
      { time: 0, text: '🧁 Yummy!' },
      { time: 2000, text: 'Do you know the muffin man' },
      { time: 5000, text: 'The muffin man, the muffin man? 🧁' },
      { time: 9000, text: 'Do you know the muffin man' },
      { time: 12000, text: 'Who lives on Drury Lane?' },
      { time: 16000, text: 'Yes, I know the muffin man! 👨‍🍳' },
    ],
    pattern: {
      difficulty: 'easy',
      moves: generatePattern(95, 45, 'easy'),
    },
  },
];

// Get songs by tier
export function getFreeSongs(): DanceSong[] {
  return danceSongLibrary.filter(song => song.tier === 'free');
}

export function getPremiumSongs(): DanceSong[] {
  return danceSongLibrary.filter(song => song.tier === 'premium');
}

// Get songs by age range
export function getSongsByAge(age: number): DanceSong[] {
  return danceSongLibrary.filter(song => {
    if (song.ageRange === 'all') return true;
    const [min, max] = song.ageRange.split('-').map(Number);
    return age >= min && age <= max;
  });
}
