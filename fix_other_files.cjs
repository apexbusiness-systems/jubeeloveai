const fs = require('fs');

function processFile(file) {
    let content = fs.readFileSync(file, 'utf8');

    // Replace import statement
    content = content.replace("import confetti from 'canvas-confetti';", "import type { Options as ConfettiOptions } from 'canvas-confetti';");

    let changed = content !== fs.readFileSync(file, 'utf8');

    if (file.includes('JubeePersonalization.tsx')) {
        content = content.replace(
`    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });`,
`    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    });`);
    } else if (file.includes('OnboardingTutorial.tsx')) {
        content = content.replace(
`    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#3b82f6', '#eab308', '#ec4899']
    });`,
`    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#3b82f6', '#eab308', '#ec4899']
      });
    });`);
    } else if (file.includes('JubeeDance.tsx')) {
        content = content.replace(
`      // Launch confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#ff0000', '#00ff00', '#0000ff']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#ff0000', '#00ff00', '#0000ff']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();`,
`      // Launch confetti
      import('canvas-confetti').then(({ default: confetti }) => {
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
          confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: ['#ff0000', '#00ff00', '#0000ff']
          });
          confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: ['#ff0000', '#00ff00', '#0000ff']
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        };

        frame();
      });`);
    } else if (file.includes('ComboCounter.tsx')) {
        content = content.replace(
`    if (count > 0 && count % 5 === 0) {
      confetti({
        particleCount: Math.min(count * 10, 100),
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
      });
    }`,
`    if (count > 0 && count % 5 === 0) {
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: Math.min(count * 10, 100),
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff']
        });
      });
    }`);
    }

    fs.writeFileSync(file, content);
}

const files = [
    'src/components/common/JubeePersonalization.tsx',
    'src/components/OnboardingTutorial.tsx',
    'src/modules/dance/JubeeDance.tsx',
    'src/modules/dance/ComboCounter.tsx'
];

for (const file of files) {
    if (fs.existsSync(file)) {
        processFile(file);
    }
}

console.log("Done");
