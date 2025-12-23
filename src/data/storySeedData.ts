export interface StoryData {
  title: string;
  category: string;
  tier: 'free' | 'premium';
  age_range: string;
  description: string;
  illustration_style: string;
  pages: { id: number; text: string; illustration: string; narration: string }[];
}

export const premiumStories: StoryData[] = [
  // --- FREE TIER (Classics) ---
  {
    title: "The Three Little Pigs",
    category: "classic",
    tier: "free",
    age_range: "3-5",
    description: "Three brothers build houses of straw, sticks, and brick. Which one will stand up to the Big Bad Wolf?",
    illustration_style: "emoji",
    pages: [
      { id: 1, text: "Three little pigs set out to build their own homes.", illustration: "🐷🐷🐷🏡", narration: "Three little pigs set out to build their own homes." },
      { id: 2, text: "The first pig built a house of straw. Swoosh!", illustration: "🐷🌾🏠", narration: "The first pig built a house of straw. Swoosh! It was done fast." },
      { id: 3, text: "The wolf huffed and puffed and blew it down!", illustration: "🐺🌬️🏚️", narration: "But the wolf huffed and puffed and blew it down!" },
      { id: 4, text: "The third pig built a strong house of bricks.", illustration: "🐷🧱🏰", narration: "The third pig built a strong house of bricks. The wolf could not blow it down!" }
    ]
  },
  {
    title: "The Tortoise and the Hare",
    category: "fable",
    tier: "free",
    age_range: "3-6",
    description: "A fast rabbit learns that slow and steady wins the race.",
    illustration_style: "emoji",
    pages: [
      { id: 1, text: "The Hare was fast. ZOOM! The Tortoise was slow.", illustration: "🐰💨🐢", narration: "The Hare was fast. ZOOM! The Tortoise was slow." },
      { id: 2, text: "They started a race. The Hare ran far ahead.", illustration: "🏁🐰🚀", narration: "They started a race. The Hare ran far ahead." },
      { id: 3, text: "The Hare took a nap. The Tortoise kept walking.", illustration: "🐰💤🐢🚶", narration: "The Hare took a nap. But the Tortoise kept walking. Plod, plod, plod." },
      { id: 4, text: "The Tortoise won the race! Hooray!", illustration: "🐢🏆🎉", narration: "The Tortoise won the race! Hooray for Tortoise!" }
    ]
  },

  // --- PREMIUM TIER (Original Life Skills) ---
  {
    title: "Jubee and the Big Mad",
    category: "emotional-growth",
    tier: "premium",
    age_range: "3-6",
    description: "Learn to manage anger with dragon breathing exercises.",
    illustration_style: "watercolor",
    pages: [
      { id: 1, text: "Sparks the Dragon was VERY mad. His tower fell!", illustration: "🐉😡🧱", narration: "Sparks the Dragon was VERY mad. His tower fell down! CRASH!" },
      { id: 2, text: "Jubee said, 'Let's be a balloon. Breathe in...'", illustration: "🐝🎈😌", narration: "Jubee said, 'Let's be a balloon. Breathe in deep... and let it out slow.'" },
      { id: 3, text: "Sparks took a deep breath. The smoke went away.", illustration: "🐉😤🌬️", narration: "Sparks took a deep breath. The smoke went away. He felt calm." }
    ]
  },
  {
    title: "The Sleepy Train",
    category: "bedtime",
    tier: "premium",
    age_range: "2-5",
    description: "A relaxing journey to help children fall asleep.",
    illustration_style: "starry",
    pages: [
      { id: 1, text: "All aboard the Sleepy Train. Chugga-chugga shhh...", illustration: "🚂🌙✨", narration: "All aboard the Sleepy Train. Chugga-chugga shhh... shhh..." },
      { id: 2, text: "First stop: Toes Town. Wiggle your toes... now stop.", illustration: "🦶💤🛑", narration: "First stop: Toes Town. Wiggle your toes... wiggle wiggle. Now stop. Let them sleep." },
      { id: 3, text: "Next stop: Tummy Hill. Breathe slow and deep.", illustration: "🛌🌬️😴", narration: "Next stop: Tummy Hill. Breathe slow and deep. Your tummy is warm and soft." }
    ]
  },
  {
    title: "Jubee in Space",
    category: "science",
    tier: "premium",
    age_range: "4-7",
    description: "Learn about gravity and the moon!",
    illustration_style: "space",
    pages: [
      { id: 1, text: "3... 2... 1... Blast off! Jubee went to space.", illustration: "🐝🚀🌌", narration: "3... 2... 1... Blast off! Jubee went to space." },
      { id: 2, text: "Look! No gravity! We are floating!", illustration: "🐝🤸‍♂️✨", narration: "Look! No gravity! We are floating in the air!" }
    ]
  }
];

export const generateStoryInsertSQL = () => {
  return premiumStories.map(s => `
    INSERT INTO stories (title, category, tier, age_range, description, illustration_style, pages)
    VALUES ('${s.title}', '${s.category}', '${s.tier}', '${s.age_range}', '${s.description}', '${s.illustration_style}', '${JSON.stringify(s.pages)}');
  `).join('\n');
};

