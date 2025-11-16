/**
 * Reading word library with categories and difficulty levels
 * Optimized for 2-4 year olds
 */

export type WordCategory = 'animals' | 'colors' | 'food' | 'body' | 'family' | 'toys' | 'nature' | 'home';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface ReadingWord {
  word: string;
  image: string;
  pronunciation: string;
  category: WordCategory;
  difficulty: DifficultyLevel;
  hint?: string;
}

export const wordLibrary: Record<WordCategory, ReadingWord[]> = {
  animals: [
    // Easy
    { word: 'cat', image: '🐱', pronunciation: 'kat', category: 'animals', difficulty: 'easy', hint: 'meow!' },
    { word: 'dog', image: '🐶', pronunciation: 'dawg', category: 'animals', difficulty: 'easy', hint: 'woof!' },
    { word: 'cow', image: '🐮', pronunciation: 'kow', category: 'animals', difficulty: 'easy', hint: 'moo!' },
    { word: 'pig', image: '🐷', pronunciation: 'pig', category: 'animals', difficulty: 'easy', hint: 'oink!' },
    { word: 'bee', image: '🐝', pronunciation: 'bee', category: 'animals', difficulty: 'easy', hint: 'buzz!' },
    // Medium
    { word: 'lion', image: '🦁', pronunciation: 'ly-on', category: 'animals', difficulty: 'medium', hint: 'roar!' },
    { word: 'bear', image: '🐻', pronunciation: 'bair', category: 'animals', difficulty: 'medium', hint: 'grr!' },
    { word: 'fish', image: '🐠', pronunciation: 'fish', category: 'animals', difficulty: 'medium', hint: 'swims in water' },
    { word: 'frog', image: '🐸', pronunciation: 'frawg', category: 'animals', difficulty: 'medium', hint: 'ribbit!' },
    // Hard
    { word: 'monkey', image: '🐵', pronunciation: 'mun-kee', category: 'animals', difficulty: 'hard', hint: 'ooh ooh ah ah!' },
    { word: 'elephant', image: '🐘', pronunciation: 'el-uh-funt', category: 'animals', difficulty: 'hard', hint: 'very big!' },
    { word: 'butterfly', image: '🦋', pronunciation: 'but-er-fly', category: 'animals', difficulty: 'hard', hint: 'pretty wings' },
  ],
  
  colors: [
    // Easy
    { word: 'red', image: '🔴', pronunciation: 'red', category: 'colors', difficulty: 'easy', hint: 'like an apple' },
    { word: 'blue', image: '🔵', pronunciation: 'bloo', category: 'colors', difficulty: 'easy', hint: 'like the sky' },
    { word: 'green', image: '🟢', pronunciation: 'green', category: 'colors', difficulty: 'easy', hint: 'like grass' },
    // Medium
    { word: 'yellow', image: '🟡', pronunciation: 'yel-oh', category: 'colors', difficulty: 'medium', hint: 'like the sun' },
    { word: 'orange', image: '🟠', pronunciation: 'or-inj', category: 'colors', difficulty: 'medium', hint: 'like a pumpkin' },
    { word: 'purple', image: '🟣', pronunciation: 'pur-pul', category: 'colors', difficulty: 'medium', hint: 'like grapes' },
    // Hard
    { word: 'pink', image: '🩷', pronunciation: 'pink', category: 'colors', difficulty: 'hard', hint: 'like a pig' },
    { word: 'brown', image: '🟤', pronunciation: 'brown', category: 'colors', difficulty: 'hard', hint: 'like chocolate' },
  ],
  
  food: [
    // Easy
    { word: 'milk', image: '🥛', pronunciation: 'milk', category: 'food', difficulty: 'easy', hint: 'from cows' },
    { word: 'egg', image: '🥚', pronunciation: 'eg', category: 'food', difficulty: 'easy', hint: 'from chickens' },
    { word: 'bread', image: '🍞', pronunciation: 'bred', category: 'food', difficulty: 'easy', hint: 'for sandwiches' },
    { word: 'cake', image: '🍰', pronunciation: 'kayk', category: 'food', difficulty: 'easy', hint: 'for birthdays!' },
    // Medium
    { word: 'apple', image: '🍎', pronunciation: 'ap-ul', category: 'food', difficulty: 'medium', hint: 'crunchy fruit' },
    { word: 'banana', image: '🍌', pronunciation: 'buh-nan-uh', category: 'food', difficulty: 'medium', hint: 'yellow fruit' },
    { word: 'pizza', image: '🍕', pronunciation: 'peet-suh', category: 'food', difficulty: 'medium', hint: 'yummy!' },
    { word: 'cookie', image: '🍪', pronunciation: 'kook-ee', category: 'food', difficulty: 'medium', hint: 'sweet treat' },
    // Hard
    { word: 'strawberry', image: '🍓', pronunciation: 'straw-bair-ee', category: 'food', difficulty: 'hard', hint: 'red berry' },
    { word: 'watermelon', image: '🍉', pronunciation: 'waw-ter-mel-un', category: 'food', difficulty: 'hard', hint: 'big green fruit' },
  ],
  
  body: [
    // Easy
    { word: 'eye', image: '👁️', pronunciation: 'eye', category: 'body', difficulty: 'easy', hint: 'you see with it' },
    { word: 'ear', image: '👂', pronunciation: 'eer', category: 'body', difficulty: 'easy', hint: 'you hear with it' },
    { word: 'nose', image: '👃', pronunciation: 'nohz', category: 'body', difficulty: 'easy', hint: 'you smell with it' },
    { word: 'hand', image: '✋', pronunciation: 'hand', category: 'body', difficulty: 'easy', hint: 'you wave with it' },
    // Medium
    { word: 'foot', image: '🦶', pronunciation: 'foot', category: 'body', difficulty: 'medium', hint: 'you walk with it' },
    { word: 'mouth', image: '👄', pronunciation: 'mowth', category: 'body', difficulty: 'medium', hint: 'you eat with it' },
    { word: 'teeth', image: '🦷', pronunciation: 'teeth', category: 'body', difficulty: 'medium', hint: 'you brush them' },
    // Hard
    { word: 'finger', image: '👆', pronunciation: 'fing-ger', category: 'body', difficulty: 'hard', hint: 'you point with it' },
    { word: 'tummy', image: '🤰', pronunciation: 'tum-ee', category: 'body', difficulty: 'hard', hint: 'where food goes' },
  ],
  
  family: [
    // Easy
    { word: 'mom', image: '👩', pronunciation: 'mom', category: 'family', difficulty: 'easy', hint: 'mama' },
    { word: 'dad', image: '👨', pronunciation: 'dad', category: 'family', difficulty: 'easy', hint: 'papa' },
    { word: 'baby', image: '👶', pronunciation: 'bay-bee', category: 'family', difficulty: 'easy', hint: 'little one' },
    // Medium
    { word: 'sister', image: '👧', pronunciation: 'sis-ter', category: 'family', difficulty: 'medium', hint: 'girl sibling' },
    { word: 'brother', image: '👦', pronunciation: 'bruth-er', category: 'family', difficulty: 'medium', hint: 'boy sibling' },
    // Hard
    { word: 'grandma', image: '👵', pronunciation: 'grand-mah', category: 'family', difficulty: 'hard', hint: 'nana' },
    { word: 'grandpa', image: '👴', pronunciation: 'grand-pah', category: 'family', difficulty: 'hard', hint: 'papa' },
  ],
  
  toys: [
    // Easy
    { word: 'ball', image: '⚽', pronunciation: 'bawl', category: 'toys', difficulty: 'easy', hint: 'you kick it' },
    { word: 'doll', image: '🪆', pronunciation: 'doll', category: 'toys', difficulty: 'easy', hint: 'baby toy' },
    { word: 'car', image: '🚗', pronunciation: 'kar', category: 'toys', difficulty: 'easy', hint: 'vroom vroom!' },
    { word: 'train', image: '🚂', pronunciation: 'trayn', category: 'toys', difficulty: 'easy', hint: 'choo choo!' },
    // Medium
    { word: 'blocks', image: '🧱', pronunciation: 'bloks', category: 'toys', difficulty: 'medium', hint: 'you build with them' },
    { word: 'puzzle', image: '🧩', pronunciation: 'puz-ul', category: 'toys', difficulty: 'medium', hint: 'you solve it' },
    { word: 'teddy', image: '🧸', pronunciation: 'ted-ee', category: 'toys', difficulty: 'medium', hint: 'stuffed bear' },
    // Hard
    { word: 'bicycle', image: '🚲', pronunciation: 'by-si-kul', category: 'toys', difficulty: 'hard', hint: 'you ride it' },
  ],
  
  nature: [
    // Easy
    { word: 'sun', image: '☀️', pronunciation: 'sun', category: 'nature', difficulty: 'easy', hint: 'bright and warm' },
    { word: 'moon', image: '🌙', pronunciation: 'moon', category: 'nature', difficulty: 'easy', hint: 'at night' },
    { word: 'star', image: '⭐', pronunciation: 'star', category: 'nature', difficulty: 'easy', hint: 'twinkle twinkle' },
    { word: 'tree', image: '🌳', pronunciation: 'tree', category: 'nature', difficulty: 'easy', hint: 'tall and green' },
    // Medium
    { word: 'flower', image: '🌸', pronunciation: 'flow-er', category: 'nature', difficulty: 'medium', hint: 'pretty and smells nice' },
    { word: 'cloud', image: '☁️', pronunciation: 'klowd', category: 'nature', difficulty: 'medium', hint: 'white and fluffy' },
    { word: 'rain', image: '🌧️', pronunciation: 'rayn', category: 'nature', difficulty: 'medium', hint: 'wet drops' },
    // Hard
    { word: 'rainbow', image: '🌈', pronunciation: 'rayn-boh', category: 'nature', difficulty: 'hard', hint: 'colorful arc' },
    { word: 'mountain', image: '⛰️', pronunciation: 'mown-tin', category: 'nature', difficulty: 'hard', hint: 'very tall' },
  ],
  
  home: [
    // Easy
    { word: 'bed', image: '🛏️', pronunciation: 'bed', category: 'home', difficulty: 'easy', hint: 'you sleep in it' },
    { word: 'door', image: '🚪', pronunciation: 'dor', category: 'home', difficulty: 'easy', hint: 'you open it' },
    { word: 'chair', image: '🪑', pronunciation: 'chair', category: 'home', difficulty: 'easy', hint: 'you sit on it' },
    { word: 'lamp', image: '💡', pronunciation: 'lamp', category: 'home', difficulty: 'easy', hint: 'gives light' },
    // Medium
    { word: 'table', image: '🪑', pronunciation: 'tay-bul', category: 'home', difficulty: 'medium', hint: 'you eat at it' },
    { word: 'window', image: '🪟', pronunciation: 'win-doh', category: 'home', difficulty: 'medium', hint: 'you look out of it' },
    { word: 'pillow', image: '🛏️', pronunciation: 'pil-oh', category: 'home', difficulty: 'medium', hint: 'soft for head' },
    // Hard
    { word: 'television', image: '📺', pronunciation: 'tel-uh-vizh-un', category: 'home', difficulty: 'hard', hint: 'you watch shows' },
  ],
};

// Helper function to get words by difficulty
export function getWordsByDifficulty(difficulty: DifficultyLevel, category?: WordCategory): ReadingWord[] {
  if (category) {
    return wordLibrary[category].filter(w => w.difficulty === difficulty);
  }
  
  const allWords: ReadingWord[] = [];
  Object.values(wordLibrary).forEach(categoryWords => {
    allWords.push(...categoryWords.filter(w => w.difficulty === difficulty));
  });
  return allWords;
}

// Helper function to get all words from a category
export function getWordsByCategory(category: WordCategory): ReadingWord[] {
  return wordLibrary[category];
}

// Get random words for practice
export function getRandomWords(count: number, difficulty?: DifficultyLevel, category?: WordCategory): ReadingWord[] {
  let pool: ReadingWord[] = [];
  
  if (category) {
    pool = difficulty ? getWordsByDifficulty(difficulty, category) : wordLibrary[category];
  } else {
    pool = difficulty ? getWordsByDifficulty(difficulty) : Object.values(wordLibrary).flat();
  }
  
  // Shuffle and select
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export const categoryLabels: Record<WordCategory, { label: string; emoji: string }> = {
  animals: { label: 'Animals', emoji: '🐾' },
  colors: { label: 'Colors', emoji: '🎨' },
  food: { label: 'Food', emoji: '🍎' },
  body: { label: 'Body Parts', emoji: '👋' },
  family: { label: 'Family', emoji: '👨‍👩‍👧‍👦' },
  toys: { label: 'Toys', emoji: '🧸' },
  nature: { label: 'Nature', emoji: '🌳' },
  home: { label: 'Home', emoji: '🏠' },
};
