export const triggerConfetti = async (options?: Record<string, unknown>) => {
  const confetti = (await import('canvas-confetti')).default;
  return confetti(options);
};
