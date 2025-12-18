/**
 * Jubee Contextual Greetings Library
 * 
 * Provides time-of-day, activity-based, and mood-specific greetings
 * for a more personalized and engaging Jubee experience.
 */

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'
export type Activity = 'home' | 'games' | 'shapes' | 'writing' | 'reading' | 'music' | 'stickers' | 'progress' | 'settings' | 'gallery'
export type Mood = 'happy' | 'excited' | 'frustrated' | 'curious' | 'tired'

export interface GreetingContext {
  timeOfDay: TimeOfDay
  activity: Activity
  mood?: Mood
  childName?: string
  isFirstVisitToday?: boolean
  streak?: number
}

// Time-of-day greetings with natural, warm tone
export const TIME_GREETINGS: Record<TimeOfDay, string[]> = {
  morning: [
    "Good morning, sunshine! ☀️",
    "Rise and shine, little bee! 🐝",
    "What a beautiful morning! *buzz-buzz*",
    "Morning, friend! Ready to learn and play?",
    "Hello, early bird! Let's have fun today! 🌈",
    "Good morning! *happy buzzing* I missed you!",
    "Yay, it's morning! Time for adventures!"
  ],
  afternoon: [
    "Hey there! Having a fun afternoon? 🌈",
    "Good afternoon, little one! *buzz*",
    "Afternoon, friend! What shall we do?",
    "Hi hi! The afternoon is perfect for learning!",
    "Hello! *excited buzz* Let's play together!",
    "Afternoon vibes! Ready for some fun? ✨"
  ],
  evening: [
    "Good evening! Time for some cozy learning! 🌙",
    "Evening, little friend! *gentle buzz*",
    "Hello! The stars are coming out! ⭐",
    "Evening time! Let's have a quiet adventure!",
    "Hi there! *soft buzzing* How was your day?",
    "Good evening! Almost bedtime, but we can still play!"
  ],
  night: [
    "Shh, it's quiet time! Let's be gentle... 💤",
    "*soft buzz* Hello, sleepy friend!",
    "Night night time! One more adventure? 🌙",
    "Hello, night owl! *gentle humming*",
    "It's late! Should we do something calm? ✨",
    "*quiet buzz* The moon says hi!"
  ]
}

// Activity-specific greetings
export const ACTIVITY_GREETINGS: Record<Activity, string[]> = {
  home: [
    "Welcome back! What shall we do today? 🏠",
    "Home sweet home! *happy buzz* 🐝",
    "Hey there! So many things to explore!",
    "Hello, friend! Pick an adventure!",
    "Welcome! I'm so happy to see you! ✨"
  ],
  games: [
    "Game time! Let's have fun! 🎮",
    "Yay, games! *excited buzzing* 🐝",
    "Ready to play? Let's go! ✨",
    "Games, games, games! I love games!",
    "Let's see how clever you are! 🧩"
  ],
  shapes: [
    "Ooh, shapes! I love circles and stars! ⭐",
    "Shape time! Can you find the square? 🔷",
    "Let's learn about shapes! *buzz-buzz*",
    "Triangles, circles, squares... oh my! 🔺",
    "Shape detective time! 🔍"
  ],
  writing: [
    "Ready to practice writing? You've got this! ✏️",
    "Writing time! Let's make letters! 📝",
    "Your pencil is ready! *encouraging buzz*",
    "Let's draw some beautiful letters! ✨",
    "Writing practice! You're getting so good!"
  ],
  reading: [
    "Story time! I love stories! 📚",
    "Let's read together! *cozy buzz* 📖",
    "Once upon a time... *excited*",
    "Books are the best! Ready to read?",
    "Story adventure awaits! 🌟"
  ],
  music: [
    "Let's make some music together! 🎵",
    "Music time! *singing buzz* 🎶",
    "Ready to dance and sing? 💃",
    "La la la! Let's make beautiful sounds!",
    "Music makes me so happy! 🎼"
  ],
  stickers: [
    "Look at all your beautiful stickers! ✨",
    "Sticker collection time! So shiny! 🌟",
    "Wow, so many stickers! *amazed buzz*",
    "Your stickers are amazing! 🎨",
    "Which sticker is your favorite? 💖"
  ],
  progress: [
    "Look how far you've come! 🌟",
    "You're doing amazing! *proud buzz*",
    "So much progress! I'm so proud! 🎉",
    "Wow, look at all you've learned! ✨",
    "You're a superstar learner! ⭐"
  ],
  settings: [
    "Time to make things just right! ⚙️",
    "Settings time! *helpful buzz*",
    "Let's customize together!",
    "Making things perfect for you! ✨"
  ],
  gallery: [
    "Your beautiful creations! 🎨",
    "What amazing art! *impressed buzz*",
    "Look at all your masterpieces! ✨",
    "You're such an artist! 🖼️"
  ]
}

// Mood-specific variations
export const MOOD_GREETINGS: Record<Mood, string[]> = {
  happy: [
    "You seem happy! That makes me happy too! 🌈",
    "*joyful buzzing* What a great mood!",
    "Your smile makes my wings flutter! 💕",
    "Happy vibes! Let's have fun! ✨"
  ],
  excited: [
    "Wow, you're excited! Me too! 🎉",
    "*super fast buzzing* So much energy!",
    "Yay yay yay! Let's GO! 🚀",
    "I can feel the excitement! ⚡"
  ],
  frustrated: [
    "It's okay, friend. I'm here for you. 💙",
    "*gentle buzz* Take a deep breath with me...",
    "We can try again, no rush! 🌸",
    "You're doing your best, and that's amazing! 💪"
  ],
  curious: [
    "Ooh, what are you wondering about? 🔍",
    "*curious humming* Let's explore!",
    "Questions are the best! Ask away! 💡",
    "Curious minds are the cleverest! 🧠"
  ],
  tired: [
    "*soft, gentle buzz* Feeling sleepy? 💤",
    "It's okay to rest, little friend. 🌙",
    "We can take it slow today. ☁️",
    "Gentle learning time... no rush. 🍃"
  ]
}

// Special occasion greetings
export const SPECIAL_GREETINGS = {
  firstVisitToday: [
    "Welcome back! I missed you so much! 💕",
    "Yay, you're here! *happy dance* 🎉",
    "My favorite friend is back! 🐝✨",
    "Hello again! Today is going to be great!"
  ],
  streak3: [
    "Three days in a row! You're amazing! 🔥",
    "Wow, 3-day streak! *proud buzzing* ⭐"
  ],
  streak7: [
    "A whole week! You're a superstar! 🌟🌟🌟",
    "7 days! That's incredible! *mega buzz* 🎉"
  ],
  streak30: [
    "30 days?! You're a learning champion! 🏆",
    "A whole month! I'm SO proud of you! 👑"
  ]
}

/**
 * Get the current time of day
 */
export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

/**
 * Get activity from route path
 */
export function getActivityFromPath(path: string): Activity {
  const cleanPath = path.toLowerCase().replace(/^\//, '')
  
  if (cleanPath === '' || cleanPath === 'home') return 'home'
  if (cleanPath.includes('game')) return 'games'
  if (cleanPath.includes('shape')) return 'shapes'
  if (cleanPath.includes('writ') || cleanPath.includes('canvas')) return 'writing'
  if (cleanPath.includes('read') || cleanPath.includes('story')) return 'reading'
  if (cleanPath.includes('music')) return 'music'
  if (cleanPath.includes('sticker')) return 'stickers'
  if (cleanPath.includes('progress')) return 'progress'
  if (cleanPath.includes('setting')) return 'settings'
  if (cleanPath.includes('gallery')) return 'gallery'
  
  return 'home'
}

/**
 * Pick a random item from an array
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Personalize greeting with child's name
 */
function personalizeGreeting(greeting: string, name?: string): string {
  if (!name) return greeting
  
  // Insert name naturally into some greetings
  const patterns = [
    { pattern: /^Hello,?/, replacement: `Hello, ${name}!` },
    { pattern: /^Hey there!/, replacement: `Hey there, ${name}!` },
    { pattern: /^Welcome back!/, replacement: `Welcome back, ${name}!` },
    { pattern: /^Good morning,?/, replacement: `Good morning, ${name}!` },
    { pattern: /^Good afternoon,?/, replacement: `Good afternoon, ${name}!` },
    { pattern: /^Good evening,?/, replacement: `Good evening, ${name}!` },
  ]
  
  for (const { pattern, replacement } of patterns) {
    if (pattern.test(greeting)) {
      return greeting.replace(pattern, replacement)
    }
  }
  
  return greeting
}

/**
 * Get a contextual greeting based on all available context
 */
export function getContextualGreeting(context: GreetingContext): string {
  const { timeOfDay, activity, mood, childName, isFirstVisitToday, streak } = context
  
  // Priority 1: Special occasions (streaks, first visit)
  if (streak && streak >= 30) {
    return personalizeGreeting(pickRandom(SPECIAL_GREETINGS.streak30), childName)
  }
  if (streak && streak >= 7) {
    return personalizeGreeting(pickRandom(SPECIAL_GREETINGS.streak7), childName)
  }
  if (streak && streak >= 3) {
    return personalizeGreeting(pickRandom(SPECIAL_GREETINGS.streak3), childName)
  }
  if (isFirstVisitToday) {
    return personalizeGreeting(pickRandom(SPECIAL_GREETINGS.firstVisitToday), childName)
  }
  
  // Priority 2: Mood-based (if strong mood detected)
  if (mood === 'frustrated' || mood === 'tired') {
    return personalizeGreeting(pickRandom(MOOD_GREETINGS[mood]), childName)
  }
  
  // Priority 3: Mix of time + activity (most common case)
  // 60% activity-specific, 40% time-based
  if (Math.random() < 0.6 && activity !== 'home') {
    return personalizeGreeting(pickRandom(ACTIVITY_GREETINGS[activity]), childName)
  }
  
  // Time-based greeting with occasional mood flavor
  let greeting = pickRandom(TIME_GREETINGS[timeOfDay])
  
  // 30% chance to add mood enhancement for excited/happy
  if (mood === 'excited' && Math.random() < 0.3) {
    greeting = pickRandom(MOOD_GREETINGS.excited)
  } else if (mood === 'curious' && Math.random() < 0.3) {
    greeting = pickRandom(MOOD_GREETINGS.curious)
  }
  
  return personalizeGreeting(greeting, childName)
}

/**
 * Get a simple random greeting (legacy compatibility)
 */
export function getRandomGreeting(): string {
  const allGreetings = [
    ...TIME_GREETINGS.morning,
    ...TIME_GREETINGS.afternoon,
    ...ACTIVITY_GREETINGS.home,
    ...MOOD_GREETINGS.happy
  ]
  return pickRandom(allGreetings)
}
