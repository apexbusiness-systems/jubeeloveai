import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { getSavedDrawings, deleteDrawing, clearAllDrawings, type SavedDrawing } from '@/types/drawing';
import { Trash2, Download, ArrowLeft, ImageIcon } from 'lucide-react';
import { useJubeeStore } from '@/store/useJubeeStore';
import { Skeleton } from '@/components/ui/skeleton';
import { useOptimizedList } from '@/hooks/useOptimizedList';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Memoized drawing card component
const DrawingCard = memo(({ 
  drawing, 
  onDelete, 
  onDownload 
}: { 
  drawing: SavedDrawing; 
  onDelete: (id: string) => void; 
  onDownload: (drawing: SavedDrawing) => void;
}) => (
  <div className="bg-card rounded-2xl shadow-xl border-4 border-primary/30 overflow-hidden hover:scale-105 transition-transform">
    <div className="aspect-square bg-background p-4">
      <img
        src={drawing.imageData}
        alt={`Drawing of ${drawing.type} ${drawing.character}`}
        className="w-full h-full object-contain"
        loading="lazy"
      />
    </div>
    <div className="p-4 bg-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-2xl font-bold text-primary">
            {drawing.character}
          </h3>
          <p className="text-sm text-muted-foreground">
            {drawing.type} • {drawing.dateString}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => onDownload(drawing)}
          variant="secondary"
          size="sm"
          className="flex-1"
        >
          <Download className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this drawing?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this drawing of "{drawing.character}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(drawing.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  </div>
));
DrawingCard.displayName = 'DrawingCard';

export default function Gallery() {
  const [drawings, setDrawings] = useState<SavedDrawing[]>([]);
  const [filter, setFilter] = useState<'all' | 'letter' | 'number'>(() => {
    return (localStorage.getItem('jubee-gallery-filter') as 'all' | 'letter' | 'number') || 'all';
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { speak } = useJubeeStore();

  useEffect(() => {
    loadDrawings();
  }, []);

  // Persist filter selection
  useEffect(() => {
    localStorage.setItem('jubee-gallery-filter', filter);
  }, [filter]);

  const loadDrawings = useCallback(async () => {
    setIsLoading(true);
    try {
      const saved = await getSavedDrawings();
      setDrawings(saved);
    } catch (error) {
      console.error('Failed to load drawings:', error);
      toast({
        title: "Error",
        description: "Failed to load drawings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteDrawing(id);
      await loadDrawings();
      toast({
        title: "Drawing deleted",
        description: "Your drawing has been removed from the gallery.",
      });
    } catch (error) {
      console.error('Failed to delete drawing:', error);
      toast({
        title: "Error",
        description: "Failed to delete drawing. Please try again.",
        variant: "destructive"
      });
    }
  }, [loadDrawings]);

  const handleClearAll = useCallback(async () => {
    try {
      await clearAllDrawings();
      await loadDrawings();
      toast({
        title: "Gallery cleared",
        description: "All drawings have been removed.",
      });
      speak("All drawings cleared!");
    } catch (error) {
      console.error('Failed to clear gallery:', error);
      toast({
        title: "Error",
        description: "Failed to clear gallery. Please try again.",
        variant: "destructive"
      });
    }
  }, [loadDrawings, speak]);

  const handleDownload = useCallback((drawing: SavedDrawing) => {
    try {
      const link = document.createElement('a');
      link.download = `${drawing.type}-${drawing.character}-${drawing.timestamp}.png`;
      link.href = drawing.imageData;
      link.click();
      
      toast({
        title: "Drawing downloaded!",
        description: `${drawing.character} has been saved to your device.`,
      });
    } catch (error) {
      console.error('Failed to download drawing:', error);
      toast({
        title: "Error",
        description: "Failed to download drawing. Please try again.",
        variant: "destructive"
      });
    }
  }, []);

  // Memoize filtered drawings
  const filteredDrawings = useMemo(() => 
    drawings.filter(d => filter === 'all' || d.type === filter),
    [drawings, filter]
  );

  // Memoize filter counts to avoid recalculation on every render
  const filterCounts = useMemo(() => ({
    all: drawings.length,
    letter: drawings.filter(d => d.type === 'letter').length,
    number: drawings.filter(d => d.type === 'number').length
  }), [drawings]);

  // Use optimized list for virtual scrolling with large galleries
  const { visibleItems, hasMore, loadMore } = useOptimizedList(filteredDrawings, {
    initialBatchSize: 20,
    batchIncrement: 10,
    enableVirtualization: true
  });

  return (
    <>
      <SEO 
        title="Jubee Love - My Gallery"
        description="View all your saved letter and number drawings. Download, share, or delete your artwork."
      />
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <header className="mb-8 pt-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => navigate('/write')}
              variant="outline"
              size="lg"
              className="min-h-[44px]"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Writing
            </Button>
            
            {drawings.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="destructive"
                    size="lg"
                    className="min-h-[44px]"
                  >
                    <Trash2 className="mr-2 h-5 w-5" />
                    Clear All
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your saved drawings. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAll}>
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-center text-primary mb-4">
            🎨 My Drawing Gallery
          </h1>
          <p className="text-center text-primary text-lg mb-6">
            {drawings.length === 0 
              ? "No drawings yet! Start creating some artwork!"
              : `You have ${drawings.length} amazing ${drawings.length === 1 ? 'drawing' : 'drawings'}!`}
          </p>

          {/* Filter buttons */}
          {drawings.length > 0 && (
            <div className="flex gap-3 justify-center flex-wrap">
              <Button
                onClick={() => setFilter('all')}
                variant={filter === 'all' ? 'default' : 'outline'}
                size="lg"
              >
                All ({filterCounts.all})
              </Button>
              <Button
                onClick={() => setFilter('letter')}
                variant={filter === 'letter' ? 'default' : 'outline'}
                size="lg"
              >
                Letters ({filterCounts.letter})
              </Button>
              <Button
                onClick={() => setFilter('number')}
                variant={filter === 'number' ? 'default' : 'outline'}
                size="lg"
              >
                Numbers ({filterCounts.number})
              </Button>
            </div>
          )}
        </header>

        {isLoading ? (
          // Loading skeletons
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl shadow-xl border-4 border-primary/30 overflow-hidden">
                <Skeleton className="aspect-square w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2 mt-3">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 flex-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredDrawings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ImageIcon className="w-32 h-32 text-muted mb-4" />
            <p className="text-2xl text-muted-foreground text-center">
              {filter === 'all' 
                ? "Start drawing to fill your gallery!"
                : `No ${filter}s yet! Try drawing some!`}
            </p>
            <Button
              onClick={() => navigate('/write')}
              variant="default"
              size="lg"
              className="mt-6"
            >
              Start Drawing
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {visibleItems.map((drawing) => (
                <DrawingCard
                  key={drawing.id}
                  drawing={drawing}
                  onDelete={handleDelete}
                  onDownload={handleDownload}
                />
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button
                  onClick={loadMore}
                  variant="outline"
                  size="lg"
                >
                  Load More Drawings
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
