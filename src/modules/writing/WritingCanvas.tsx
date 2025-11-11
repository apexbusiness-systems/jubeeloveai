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
  const [mode, setMode] = useState<'letter' | 'number'>('letter');
  const [currentLetter, setCurrentLetter] = useState('A');
  const [currentNumber, setCurrentNumber] = useState('0');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#3b82f6');
  const navigate = useNavigate();
  const { speak, triggerAnimation } = useJubeeStore();
  const { addScore } = useGameStore();
  const { playDrawSound, playClearSound, playSuccessSound } = useAudioEffects();

  const currentCharacter = mode === 'letter' ? currentLetter : currentNumber;

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
    ctx.strokeText(currentCharacter, canvas.width / 2, canvas.height / 2);
  }, [currentCharacter]);

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
    ctx.strokeText(currentCharacter, canvas.width / 2, canvas.height / 2);

    toast({
      title: "Canvas cleared",
      description: "Try tracing the letter again!",
    });
  };

  const handleSaveDrawing = () => {
    playSuccessSound();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL('image/png');
    
    // Save to localStorage via helper function
    saveDrawing(currentCharacter, mode, imageData);

    // Also trigger download
    const link = document.createElement('a');
    link.download = `${mode}-${currentCharacter}-${Date.now()}.png`;
    link.href = imageData;
    link.click();

    toast({
      title: "Drawing saved!",
      description: `Your ${mode} "${currentCharacter}" has been saved to your gallery!`,
    });
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
        <header>
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-primary">
                Trace the {mode === 'letter' ? 'Letter' : 'Number'}: {currentCharacter}
              </h1>
              <p className="text-center text-primary mb-4">
                Use your finger or mouse to trace the {mode} outline
              </p>
            </div>
            <Button
              onClick={() => navigate('/gallery')}
              variant="outline"
              size="lg"
              className="min-h-[44px]"
              aria-label="View gallery"
            >
              <ImageIcon className="mr-2 h-5 w-5" />
              Gallery
            </Button>
          </div>

          <Tabs value={mode} onValueChange={(v) => handleModeChange(v as 'letter' | 'number')} className="w-full max-w-md mx-auto mb-6">
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
