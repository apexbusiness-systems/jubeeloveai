import { SEO } from '@/components/SEO';
import { useGameStore } from '@/store/useGameStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const availableStickers = ['⭐', '🌟', '✨', '🎯', '🏆', '🎖️', '🥇', '👏', '🎉', '🎊', '🌈', '🦋', '🌺', '🌻', '🎨', '📚', '✏️', '📝'];

export default function StickersPage() {
  const { stickers, addSticker, score } = useGameStore();
  const stickerCost = 50;

  const handleBuySticker = (sticker: string) => {
    if (stickers.includes(sticker)) {
      toast({
        title: "Already Own",
        description: "You already have this sticker!",
        variant: "destructive",
      });
      return;
    }

    if (score < stickerCost) {
      toast({
        title: "Not Enough Points",
        description: `You need ${stickerCost} points to buy a sticker. Keep playing!`,
        variant: "destructive",
      });
      return;
    }

    addSticker(sticker);
    toast({
      title: "Sticker Unlocked! 🎉",
      description: `You got a new sticker! (Cost: ${stickerCost} points)`,
    });
  };

  return (
    <>
      <SEO 
        title="Jubee Love - Sticker Collection"
        description="Collect colorful stickers and rewards by completing learning activities with Jubee!"
      />
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">
            Sticker Collection
          </h1>
          <p className="text-primary">
            Collect stickers by completing activities! Each sticker costs {stickerCost} points.
          </p>
          <p className="text-2xl font-bold text-primary mt-4">
            Your Points: {score}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-4 border-primary/30">
            <CardHeader>
              <CardTitle className="text-primary">My Stickers ({stickers.length})</CardTitle>
              <CardDescription className="text-primary">Your amazing collection!</CardDescription>
            </CardHeader>
            <CardContent>
              {stickers.length === 0 ? (
                <div className="text-center py-12">
                  <Gift className="w-16 h-16 mx-auto text-primary opacity-50 mb-4" />
                  <p className="text-primary">No stickers yet. Start collecting!</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {stickers.map((sticker, index) => (
                    <div 
                      key={index}
                      className="aspect-square bg-card rounded-2xl border-4 border-primary flex items-center justify-center text-5xl hover:scale-110 transition-transform shadow-lg"
                    >
                      {sticker}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-4 border-primary/30">
            <CardHeader>
              <CardTitle className="text-primary">Available Stickers</CardTitle>
              <CardDescription className="text-primary">Earn points to unlock these!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                {availableStickers.map((sticker, index) => {
                  const owned = stickers.includes(sticker);
                  return (
                    <Button
                      key={index}
                      onClick={() => handleBuySticker(sticker)}
                      variant="outline"
                      disabled={owned}
                      className={`aspect-square text-5xl p-0 ${
                        owned ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 border-primary border-2'
                      }`}
                    >
                      {sticker}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
