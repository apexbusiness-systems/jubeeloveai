import { useState } from 'react';
import { useJubeeStore } from '../../store/useJubeeStore';
import { useGameStore } from '../../store/useGameStore';
import { SEO } from '../../components/SEO';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

type Shape = 'circle' | 'square' | 'triangle' | 'star';

const shapes: Shape[] = ['circle', 'square', 'triangle', 'star'];

const shapeDescriptions: Record<Shape, string> = {
  circle: 'A round shape with no corners',
  square: 'A shape with four equal sides and four corners',
  triangle: 'A shape with three sides and three corners',
  star: 'A shape with multiple points radiating from the center'
};

export default function ShapeSorter() {
  const [targetShape, setTargetShape] = useState<Shape>('circle');
  const [score, setScore] = useState(0);
  const { speak, triggerAnimation } = useJubeeStore();
  const { addScore } = useGameStore();

  const checkShape = (shape: Shape) => {
    if (shape === targetShape) {
      speak('Awesome! You found the right shape!');
      triggerAnimation('excited');
      addScore(15);
      setScore(score + 1);
      
      toast({
        title: "Correct! 🎉",
        description: `Great job finding the ${targetShape}! You earned 15 points.`,
      });

      // Pick new random shape
      const newShape = shapes[Math.floor(Math.random() * shapes.length)];
      setTargetShape(newShape);
    } else {
      speak('Try again!');
      
      toast({
        title: "Not quite!",
        description: `That's a ${shape}. Try finding the ${targetShape} instead.`,
        variant: "destructive",
      });
    }
  };

  const getShapeEmoji = (shape: Shape): string => {
    const emojis: Record<Shape, string> = {
      circle: '🔵',
      square: '🟦',
      triangle: '🔺',
      star: '⭐'
    };
    return emojis[shape];
  };

  return (
    <>
      <SEO 
        title="Jubee Love - Shape Recognition"
        description="Learn to identify shapes with Jubee! Practice recognizing circles, squares, triangles, and stars through fun interactive games."
      />
      <div className="shape-sorter-container">
        <header className="mb-8 pt-2">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-primary">
            Find the {targetShape}!
          </h1>
          <p className="text-xl text-center text-primary mb-4">
            Current Score: {score}
          </p>
          <p className="text-center text-sm text-muted-foreground max-w-md mx-auto">
            {shapeDescriptions[targetShape]}
          </p>
        </header>

        <div className="shapes-grid" role="group" aria-label="Shape selection buttons">
          {shapes.map((shape) => (
            <Button
              key={shape}
              onClick={() => checkShape(shape)}
              variant="outline"
              className="shape-button min-h-[44px] min-w-[44px] focus-visible:ring-4 focus-visible:ring-ring"
              aria-label={`Select ${shape}. ${shapeDescriptions[shape]}`}
            >
              <span className="text-8xl" aria-hidden="true">{getShapeEmoji(shape)}</span>
              <span className="text-xl mt-2 capitalize font-semibold text-primary">{shape}</span>
            </Button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-lg text-primary font-medium">
            Tap the {targetShape} <span aria-hidden="true">{getShapeEmoji(targetShape)}</span>
          </p>
        </div>
      </div>
    </>
  );
}
