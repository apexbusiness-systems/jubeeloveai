const fs = require('fs');
const file = 'src/modules/writing/WritingCanvas.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace import statement
content = content.replace("import confetti from 'canvas-confetti';", "import type { Options as ConfettiOptions } from 'canvas-confetti';");

// Make handleSaveDrawing trigger confetti using dynamic import
content = content.replace(
`      triggerAnimation('celebrate');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });`,
`      triggerAnimation('celebrate');
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      });`);

// Update triggerConfetti
content = content.replace(
`  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };`,
`  const triggerConfetti = () => {
    import('canvas-confetti').then(({ default: confetti }) => {
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
      };

      function fire(particleRatio: number, opts: ConfettiOptions) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });

      fire(0.2, {
        spread: 60,
      });

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    });
  };`);

fs.writeFileSync(file, content);
console.log('Done');
