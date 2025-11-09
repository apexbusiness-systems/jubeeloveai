import { useRef, useState, useEffect } from 'react';
import { useJubeeStore } from '../../store/useJubeeStore';
import { useGameStore } from '../../store/useGameStore';
import { SEO } from '../../components/SEO';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { Eraser, SkipForward, Palette } from 'lucide-react';
import { useAudioEffects } from '@/hooks/useAudioEffects';

const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

const colors = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Black', value: '#000000' },
];

export default function WritingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentLetter, setCurrentLetter] = useState('A');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#3b82f6');
  const { speak, triggerAnimation } = useJubeeStore();
  const { addScore } = useGameStore();
  const { playDrawSound, playClearSound, playSuccessSound } = useAudioEffects();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 800;
    canvas.height = 400;

    // Draw guide letter
    ctx.strokeStyle = 'hsl(var(--muted))';
    ctx.lineWidth = 8;
    ctx.font = 'bold 200px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(currentLetter, canvas.width / 2, canvas.height / 2);
  }, [currentLetter]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    playDrawSound();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    playClearSound();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw guide
    ctx.strokeStyle = 'hsl(var(--muted))';
    ctx.lineWidth = 8;
    ctx.font = 'bold 200px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(currentLetter, canvas.width / 2, canvas.height / 2);

    toast({
      title: "Canvas cleared",
      description: "Try tracing the letter again!",
    });
  };

  const nextLetter = () => {
    playSuccessSound();
    const currentIndex = letters.indexOf(currentLetter);
    const nextIndex = (currentIndex + 1) % letters.length;
    const nextLetterValue = letters[nextIndex];
    
    setCurrentLetter(nextLetterValue);
    speak(`Great job! Now let's try ${nextLetterValue}!`);
    triggerAnimation('excited');
    addScore(10);
    clearCanvas();

    toast({
      title: "Excellent work!",
      description: `You earned 10 points! Now try letter ${nextLetterValue}.`,
    });
  };

  return (
    <>
      <SEO 
        title="Jubee Love - Writing Practice"
        description="Practice writing letters with Jubee! Trace letters and improve your handwriting skills through interactive drawing activities."
      />
      <div className="writing-canvas-container">
        <header>
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-primary">
            Trace the Letter: {currentLetter}
          </h1>
          <p className="text-center text-primary mb-4">
            Use your finger or mouse to trace the letter outline
          </p>
        </header>
        
        <canvas
          ref={canvasRef}
          className="writing-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          aria-label={`Writing canvas for tracing letter ${currentLetter}`}
          role="img"
        />

        <div className="flex gap-4 justify-center mt-6 flex-wrap" role="group" aria-label="Canvas controls">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline"
                size="lg"
                className="min-h-[44px] min-w-[44px]"
                aria-label="Choose color"
              >
                <Palette className="mr-2 h-5 w-5" style={{ color: drawColor }} />
                Color
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3">
              <div className="grid grid-cols-4 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => {
                      setDrawColor(color.value);
                      toast({
                        title: `${color.name} selected!`,
                        description: "Start drawing with your new color.",
                      });
                    }}
                    className="w-12 h-12 rounded-full border-2 border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.value }}
                    aria-label={`Select ${color.name} color`}
                    title={color.name}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            onClick={clearCanvas} 
            variant="destructive"
            size="lg"
            className="min-h-[44px] min-w-[44px]"
            aria-label="Clear canvas"
          >
            <Eraser className="mr-2 h-5 w-5" />
            Clear
          </Button>
          <Button 
            onClick={nextLetter} 
            variant="default"
            size="lg"
            className="min-h-[44px] min-w-[44px]"
            aria-label="Move to next letter"
          >
            <SkipForward className="mr-2 h-5 w-5" />
            Next Letter
          </Button>
        </div>
      </div>
    </>
  );
}
