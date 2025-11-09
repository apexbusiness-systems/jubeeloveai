import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary/30">
      <div className="text-center space-y-6 px-4 animate-in fade-in duration-700">
        <div className="space-y-3">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Your Blank Canvas
          </h1>
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            Start building something amazing
          </p>
        </div>
        
        <div className="flex gap-3 justify-center pt-4">
          <Button size="lg" className="transition-all hover:scale-105">
            Get Started
          </Button>
          <Button size="lg" variant="outline" className="transition-all hover:scale-105">
            Learn More
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
