const fs = require('fs');
const file = 'src/App.tsx';
let src = fs.readFileSync(file, 'utf8');

// Insert import
if (!src.includes('initNativePerformanceMonitor')) {
    src = "import { initNativePerformanceMonitor } from './performance/nativePerformanceMonitor';\n" + src;
}

// Insert initialization near other early useEffects or after mount
if (!src.includes('initNativePerformanceMonitor()')) {
    const hook = `
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => initNativePerformanceMonitor());
    } else {
      setTimeout(initNativePerformanceMonitor, 1000);
    }
  }, []);
`;
    // Just inject it inside the component function App() {
    src = src.replace('function App() {', 'function App() {' + hook);
    fs.writeFileSync(file, src);
}
