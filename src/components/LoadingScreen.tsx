import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = ({ message = "Loading..." }: LoadingScreenProps) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="loading-screen min-h-[400px] flex flex-col items-center justify-center gap-6"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
      </div>
      
      <p className="text-lg font-medium text-foreground">
        {message}{dots}
      </p>
      
      <div className="flex gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};
