const fs = require('fs');

// Fix masteryEngine.ts
let f1 = 'src/learning/masteryEngine.ts';
let src1 = fs.readFileSync(f1, 'utf8');
src1 = src1.replace(/let overdueWeight/g, 'const overdueWeight');
src1 = src1.replace(/let weaknessWeight/g, 'const weaknessWeight');
src1 = src1.replace(/let confidenceTrendWeight/g, 'const confidenceTrendWeight');
src1 = src1.replace(/let calmModeFit/g, 'const calmModeFit');
fs.writeFileSync(f1, src1);

// Fix App.tsx
let f2 = 'src/App.tsx';
let src2 = fs.readFileSync(f2, 'utf8');
src2 = src2.replace(/\(window as any\)/g, '(window as unknown as { requestIdleCallback: (cb: () => void) => void })');
fs.writeFileSync(f2, src2);

// Fix nativePerformanceMonitor.test.ts
let f3 = 'src/performance/nativePerformanceMonitor.test.ts';
let src3 = fs.readFileSync(f3, 'utf8');
src3 = src3.replace(/\(global as any\)/g, '(global as unknown as { PerformanceObserver?: typeof PerformanceObserver })');
fs.writeFileSync(f3, src3);
