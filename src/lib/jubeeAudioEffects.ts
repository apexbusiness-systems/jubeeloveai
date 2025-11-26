/**
 * Jubee Audio Effects
 * Generates contextual sound effects for Jubee's page transitions
 */

let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

/**
 * Play a cheerful buzz sound (for games/excited mood)
 */
export const playCheerfulBuzz = (volume: number = 0.3) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Cheerful buzz: quick ascending frequency sweep
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  } catch (error) {
    console.warn('Failed to play cheerful buzz:', error);
  }
};

/**
 * Play a gentle hum sound (for stories/curious mood)
 */
export const playGentleHum = (volume: number = 0.2) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Gentle hum: soft sine wave with slight vibrato
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(220, ctx.currentTime);
    oscillator.frequency.setValueAtTime(225, ctx.currentTime + 0.15);
    oscillator.frequency.setValueAtTime(220, ctx.currentTime + 0.3);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime + 0.25);
    gainNode.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch (error) {
    console.warn('Failed to play gentle hum:', error);
  }
};

/**
 * Play a yawn sound (for settings/tired mood)
 */
export const playYawnSound = (volume: number = 0.25) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Yawn: descending frequency with slow release
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(350, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.6);
  } catch (error) {
    console.warn('Failed to play yawn sound:', error);
  }
};

/**
 * Play a happy chirp sound (for general happy mood)
 */
export const playHappyChirp = (volume: number = 0.25) => {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Happy chirp: quick ascending tone
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
    
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.12);
  } catch (error) {
    console.warn('Failed to play happy chirp:', error);
  }
};

/**
 * Play sound effect based on mood
 */
export const playMoodSound = (mood: string, volume?: number) => {
  switch (mood) {
    case 'excited':
      playCheerfulBuzz(volume);
      break;
    case 'curious':
      playGentleHum(volume);
      break;
    case 'tired':
      playYawnSound(volume);
      break;
    case 'happy':
      playHappyChirp(volume);
      break;
    default:
      // No sound for other moods
      break;
  }
};
