/**
 * Writing Canvas Module
 * 
 * Interactive canvas for tracing letters and numbers.
 * Optimized for touch and mouse input with efficient drawing operations.
 * 
 * Performance optimizations:
 * - Canvas rendering outside React lifecycle
 * - Async save operations with IndexedDB
 * - Error boundaries for graceful degradation
 * - Efficient event handlers with try-catch blocks
 * 
 * @component
 */

import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJubeeStore } from '../../store/useJubeeStore';
import { useGameStore } from '../../store/useGameStore';
import { SEO } from '../../components/SEO';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Eraser, SkipForward, Palette, Download, Image as ImageIcon } from 'lucide-react';
import { useAudioEffects } from '@/hooks/useAudioEffects';
import { saveDrawing } from '@/types/drawing';
import confetti from 'canvas-confetti';

const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const colors = [
  { name: 'Red', value: 'hsl(0 85% 60%)' },
  { name: 'Orange', value: 'hsl(20 95% 55%)' },
  { name: 'Yellow', value: 'hsl(45 93% 47%)' },
  { name: 'Green', value: 'hsl(142 71% 45%)' },
  { name: 'Blue', value: 'hsl(217 91% 60%)' },
  { name: 'Purple', value: 'hsl(271 81% 56%)' },
  { name: 'Pink', value: 'hsl(330 81% 60%)' },
  { name: 'Black', value: 'hsl(0 0% 0%)' },
];

export default function WritingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<'letter' | 'number'>('letter');
  const [currentLetter, setCurrentLetter] = useState('A');
  const [currentNumber, setCurrentNumber] = useState('0');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('hsl(217 91% 60%)');
  const navigate = useNavigate();
  const { speak, triggerAnimation } = useJubeeStore();
  const { addScore } = useGameStore();
  const { playDrawSound, playClearSound, playSuccessSound } = useAudioEffects();

  const currentCharacter = mode === 'letter' ? currentLetter : currentNumber;

  useEffect(() => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.warn('Canvas element not found');
        return;
      }
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get canvas context');
        toast({
          title: "Canvas Error",
          description: "Unable to initialize drawing canvas.",
          variant: "destructive"
        });
        return;
      }

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
      ctx.strokeText(currentCharacter, canvas.width / 2, canvas.height / 2);
    } catch (error) {
      console.error('Canvas initialization error:', error);
      toast({
        title: "Canvas Error",
        description: "Failed to initialize drawing canvas.",
        variant: "destructive"
      });
    }
  }, [currentCharacter]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
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
    } catch (error) {
      console.error('Drawing start error:', error);
      setIsDrawing(false);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    try {
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
    } catch (error) {
      console.error('Drawing error:', error);
      setIsDrawing(false);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    try {
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
      ctx.strokeText(currentCharacter, canvas.width / 2, canvas.height / 2);

      toast({
        title: "Canvas cleared",
        description: "Try tracing the letter again!",
      });
    } catch (error) {
      console.error('Clear canvas error:', error);
      toast({
        title: "Error",
        description: "Failed to clear canvas.",
        variant: "destructive"
      });
    }
  };

  const handleSaveDrawing = async () => {
    try {
      playSuccessSound();
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas not found');
      }

      const imageData = canvas.toDataURL('image/png');
      
      // Save to IndexedDB via helper function
      await saveDrawing(currentCharacter, mode, imageData);

      // Also trigger download
      const link = document.createElement('a');
      link.download = `${mode}-${currentCharacter}-${Date.now()}.png`;
      link.href = imageData;
      link.click();

      toast({
        title: "Drawing saved!",
        description: `Your ${mode} "${currentCharacter}" has been saved to your gallery!`,
      });

      addScore(20);
      triggerAnimation('celebrate');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error) {
      console.error('Save drawing error:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save your drawing. Please try again.",
        variant: "destructive"
      });
    }
  };

  const triggerConfetti = () => {
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
  };

  const nextCharacter = () => {
    playSuccessSound();
    triggerConfetti();
    
    if (mode === 'letter') {
      const currentIndex = letters.indexOf(currentLetter);
      const nextIndex = (currentIndex + 1) % letters.length;
      const nextLetterValue = letters[nextIndex];
      
      setCurrentLetter(nextLetterValue);
      speak(`Amazing! Now let's try ${nextLetterValue}!`);
    } else {
      const currentIndex = numbers.indexOf(currentNumber);
      const nextIndex = (currentIndex + 1) % numbers.length;
      const nextNumberValue = numbers[nextIndex];
      
      setCurrentNumber(nextNumberValue);
      speak(`Fantastic! Now let's try ${nextNumberValue}!`);
    }
    
    triggerAnimation('excited');
    addScore(10);
    clearCanvas();

    toast({
      title: "🎉 Excellent work!",
      description: `You earned 10 points! Keep going!`,
    });
  };

  const handleModeChange = (newMode: 'letter' | 'number') => {
    setMode(newMode);
    clearCanvas();
    speak(newMode === 'letter' ? `Let's practice letters!` : `Let's practice numbers!`);
  };

  return (
    <>
      <SEO 
        title="Jubee Love - Writing Practice"
        description="Practice writing letters and numbers with Jubee! Trace characters and improve your handwriting skills through interactive drawing activities."
      />
      <div className="writing-canvas-container">
        <header className="mb-6">
          <div className="flex justify-between items-center gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-2 text-primary leading-tight">
                Trace the {mode === 'letter' ? 'Letter' : 'Number'}: {currentCharacter}
              </h1>
              <p className="text-center text-primary text-sm sm:text-base">
                Use your finger or mouse to trace the {mode} outline
              </p>
            </div>
            <Button
              onClick={() => navigate('/gallery')}
              variant="outline"
              size="lg"
              className="min-h-[44px] flex-shrink-0"
              aria-label="View gallery"
            >
              <ImageIcon className="sm:mr-2 h-5 w-5" />
              <span className="hidden sm:inline">Gallery</span>
            </Button>
          </div>

          <Tabs value={mode} onValueChange={(v) => handleModeChange(v as 'letter' | 'number')} className="w-full max-w-md mx-auto mb-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="letter" className="text-lg">
                Letters (A-Z)
              </TabsTrigger>
              <TabsTrigger value="number" className="text-lg">
                Numbers (0-9)
              </TabsTrigger>
            </TabsList>
          </Tabs>
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
          aria-label={`Writing canvas for tracing ${mode} ${currentCharacter}`}
          role="img"
          style={{
            touchAction: 'none',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
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
            onClick={handleSaveDrawing} 
            variant="secondary"
            size="lg"
            className="min-h-[44px] min-w-[44px]"
            aria-label="Save drawing"
          >
            <Download className="mr-2 h-5 w-5" />
            Save
          </Button>
          <Button 
            onClick={nextCharacter} 
            variant="default"
            size="lg"
            className="min-h-[44px] min-w-[44px]"
            aria-label={`Move to next ${mode}`}
          >
            <SkipForward className="mr-2 h-5 w-5" />
            Next {mode === 'letter' ? 'Letter' : 'Number'}
          </Button>
        </div>
      </div>
    </>
  );
}
