/**
 * Feelings Explorer — scenarios & emotion library
 * 8 core emotions × 2 wordless storyboard scenes = 16 scenes.
 * Each panel uses an emoji "stage" (no illustrations needed) so we
 * stay dependency-free while remaining instantly recognizable to 3–5 y/os.
 */

export type EmotionKey =
  | 'happy'
  | 'sad'
  | 'angry'
  | 'scared'
  | 'surprised'
  | 'excited'
  | 'tired'
  | 'proud';

export interface EmotionDef {
  key: EmotionKey;
  label: string;          // spoken + a11y label (single word, age-appropriate)
  emoji: string;          // for picker bubbles
  sticker: string;        // for journal
  cheer: string;          // short Jubee voice line on correct pick
}

export const EMOTIONS: Record<EmotionKey, EmotionDef> = {
  happy:     { key: 'happy',     label: 'Happy',     emoji: '😊', sticker: '😊', cheer: "Yes! Feely feels happy!" },
  sad:       { key: 'sad',       label: 'Sad',       emoji: '😢', sticker: '😢', cheer: "That's right, Feely feels sad." },
  angry:     { key: 'angry',     label: 'Angry',     emoji: '😠', sticker: '😠', cheer: "Yes! Feely feels angry." },
  scared:    { key: 'scared',    label: 'Scared',    emoji: '😨', sticker: '😨', cheer: "That's right! Feely feels scared." },
  surprised: { key: 'surprised', label: 'Surprised', emoji: '😲', sticker: '😲', cheer: "Yes! Feely is surprised!" },
  excited:   { key: 'excited',   label: 'Excited',   emoji: '🤩', sticker: '🤩', cheer: "Yes! Feely feels excited!" },
  tired:     { key: 'tired',     label: 'Tired',     emoji: '😴', sticker: '😴', cheer: "That's right, Feely is tired." },
  proud:     { key: 'proud',     label: 'Proud',     emoji: '😌', sticker: '🏆', cheer: "Yes! Feely feels proud!" },
};

export const EMOTION_KEYS = Object.keys(EMOTIONS) as EmotionKey[];

export interface HelpOption {
  emoji: string;
  label: string;          // spoken on tap
  reaction: EmotionKey;   // what emotion Feely shows after help
}

export interface Scene {
  id: string;
  emotion: EmotionKey;
  panels: string[];       // 3 emoji frames telling the story
  story: string;          // narrated once at scene start (audio)
  distractors: [EmotionKey, EmotionKey]; // 2 wrong options for picker
  help: HelpOption[];     // 3 supportive choices — all "correct"
}

/** 16 wordless scenarios. Distractors chosen to be plausible-but-clearly-different. */
export const SCENES: Scene[] = [
  {
    id: 'happy-cake',
    emotion: 'happy',
    panels: ['🎂', '🎉', '😊'],
    story: "Feely got a birthday cake!",
    distractors: ['sad', 'angry'],
    help: [
      { emoji: '🎵', label: 'Sing a song!',  reaction: 'excited' },
      { emoji: '🤗', label: 'Give a hug!',   reaction: 'happy' },
      { emoji: '💃', label: 'Dance!',        reaction: 'excited' },
    ],
  },
  {
    id: 'happy-puppy',
    emotion: 'happy',
    panels: ['🐶', '❤️', '😊'],
    story: "Feely met a friendly puppy!",
    distractors: ['scared', 'tired'],
    help: [
      { emoji: '🦴', label: 'Give a treat!', reaction: 'happy' },
      { emoji: '🤗', label: 'Pet softly!',   reaction: 'happy' },
      { emoji: '🎾', label: 'Play ball!',    reaction: 'excited' },
    ],
  },
  {
    id: 'sad-icecream',
    emotion: 'sad',
    panels: ['🍦', '⬇️', '😢'],
    story: "Oh no, Feely's ice cream fell down.",
    distractors: ['happy', 'angry'],
    help: [
      { emoji: '🤗', label: 'Give a hug.',         reaction: 'happy' },
      { emoji: '🍦', label: 'Get a new one.',      reaction: 'happy' },
      { emoji: '💬', label: "Say it's okay.",      reaction: 'happy' },
    ],
  },
  {
    id: 'sad-balloon',
    emotion: 'sad',
    panels: ['🎈', '☁️', '😢'],
    story: "Feely's balloon floated away.",
    distractors: ['proud', 'surprised'],
    help: [
      { emoji: '🤗', label: 'Hug Feely.',     reaction: 'happy' },
      { emoji: '🎈', label: 'Share yours.',   reaction: 'happy' },
      { emoji: '🌈', label: 'Look up high.',  reaction: 'surprised' },
    ],
  },
  {
    id: 'angry-tower',
    emotion: 'angry',
    panels: ['🧱', '💥', '😠'],
    story: "Feely's block tower fell down!",
    distractors: ['happy', 'tired'],
    help: [
      { emoji: '🌬️', label: 'Take a big breath.', reaction: 'happy' },
      { emoji: '🧱', label: 'Build again.',        reaction: 'proud' },
      { emoji: '🤗', label: 'Give a hug.',         reaction: 'happy' },
    ],
  },
  {
    id: 'angry-toy',
    emotion: 'angry',
    panels: ['🧸', '🚫', '😠'],
    story: "Feely can't find a favorite toy.",
    distractors: ['surprised', 'excited'],
    help: [
      { emoji: '🌬️', label: 'Breathe slow.', reaction: 'happy' },
      { emoji: '🔍', label: 'Look together.', reaction: 'happy' },
      { emoji: '🧸', label: 'Share a toy.',   reaction: 'happy' },
    ],
  },
  {
    id: 'scared-thunder',
    emotion: 'scared',
    panels: ['⛈️', '⚡', '😨'],
    story: "BOOM! Feely heard loud thunder.",
    distractors: ['happy', 'proud'],
    help: [
      { emoji: '🤗', label: 'Give a hug.',     reaction: 'happy' },
      { emoji: '🛋️', label: 'Sit together.',   reaction: 'happy' },
      { emoji: '🎵', label: 'Sing a song.',    reaction: 'happy' },
    ],
  },
  {
    id: 'scared-dark',
    emotion: 'scared',
    panels: ['🌙', '🚪', '😨'],
    story: "The room is very dark.",
    distractors: ['excited', 'tired'],
    help: [
      { emoji: '💡', label: 'Turn on a light.', reaction: 'happy' },
      { emoji: '🧸', label: 'Hold a teddy.',    reaction: 'happy' },
      { emoji: '🤗', label: 'Hold a hand.',     reaction: 'happy' },
    ],
  },
  {
    id: 'surprised-gift',
    emotion: 'surprised',
    panels: ['🚪', '🎁', '😲'],
    story: "A present is at the door!",
    distractors: ['sad', 'angry'],
    help: [
      { emoji: '🎁', label: 'Open it!',      reaction: 'excited' },
      { emoji: '👋', label: 'Wave hello!',   reaction: 'happy' },
      { emoji: '💃', label: 'Dance!',        reaction: 'excited' },
    ],
  },
  {
    id: 'surprised-friend',
    emotion: 'surprised',
    panels: ['🌳', '👋', '😲'],
    story: "A friend popped out to say hi!",
    distractors: ['sad', 'tired'],
    help: [
      { emoji: '🤗', label: 'Hug your friend!', reaction: 'happy' },
      { emoji: '😆', label: 'Laugh together!',  reaction: 'happy' },
      { emoji: '🎾', label: 'Play a game!',     reaction: 'excited' },
    ],
  },
  {
    id: 'excited-present',
    emotion: 'excited',
    panels: ['🎁', '✨', '🤩'],
    story: "Feely is opening a big present!",
    distractors: ['scared', 'sad'],
    help: [
      { emoji: '🎉', label: 'Cheer!',     reaction: 'excited' },
      { emoji: '💃', label: 'Dance!',     reaction: 'excited' },
      { emoji: '🎵', label: 'Sing!',      reaction: 'happy' },
    ],
  },
  {
    id: 'excited-park',
    emotion: 'excited',
    panels: ['🌳', '🛝', '🤩'],
    story: "Time to go to the park!",
    distractors: ['tired', 'angry'],
    help: [
      { emoji: '🏃', label: 'Run fast!',  reaction: 'excited' },
      { emoji: '🛝', label: 'Go on slide!', reaction: 'happy' },
      { emoji: '👋', label: 'Wave hi!',     reaction: 'happy' },
    ],
  },
  {
    id: 'tired-play',
    emotion: 'tired',
    panels: ['🏃', '☀️', '😴'],
    story: "Feely played all day long.",
    distractors: ['angry', 'surprised'],
    help: [
      { emoji: '🛌', label: 'Take a nap.',    reaction: 'happy' },
      { emoji: '🥛', label: 'Drink water.',   reaction: 'happy' },
      { emoji: '🤗', label: 'Cuddle up.',     reaction: 'happy' },
    ],
  },
  {
    id: 'tired-night',
    emotion: 'tired',
    panels: ['🌙', '🛏️', '😴'],
    story: "It's bedtime for Feely.",
    distractors: ['excited', 'scared'],
    help: [
      { emoji: '📖', label: 'Read a story.', reaction: 'happy' },
      { emoji: '🎵', label: 'Soft music.',   reaction: 'happy' },
      { emoji: '🤗', label: 'Goodnight hug.', reaction: 'happy' },
    ],
  },
  {
    id: 'proud-drawing',
    emotion: 'proud',
    panels: ['🎨', '🖼️', '😌'],
    story: "Feely finished a beautiful drawing!",
    distractors: ['sad', 'angry'],
    help: [
      { emoji: '👏', label: 'Clap for Feely!', reaction: 'happy' },
      { emoji: '🖼️', label: 'Show it off!',     reaction: 'proud' },
      { emoji: '🤗', label: 'Give a hug!',      reaction: 'happy' },
    ],
  },
  {
    id: 'proud-puzzle',
    emotion: 'proud',
    panels: ['🧩', '✨', '😌'],
    story: "Feely solved the whole puzzle!",
    distractors: ['tired', 'scared'],
    help: [
      { emoji: '👏', label: 'Cheer!',         reaction: 'excited' },
      { emoji: '⭐', label: 'Give a star!',    reaction: 'proud' },
      { emoji: '🤗', label: 'Big hug!',        reaction: 'happy' },
    ],
  },
];

/** Stable, total ordering used to compute "next unplayed" scene per child. */
export function pickNextScene(playedIds: string[]): Scene {
  const remaining = SCENES.filter(s => !playedIds.includes(s.id));
  const pool = remaining.length > 0 ? remaining : SCENES;
  // Random within pool so repeats don't always start at scene 1
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Build the 3-option picker (correct + 2 distractors), shuffled deterministically per render. */
export function buildEmotionChoices(scene: Scene): EmotionDef[] {
  const choices = [scene.emotion, ...scene.distractors].map(k => EMOTIONS[k]);
  // Fisher–Yates
  for (let i = choices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}
