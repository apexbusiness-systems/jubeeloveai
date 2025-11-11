import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { getSavedDrawings, deleteDrawing, clearAllDrawings, type SavedDrawing } from '@/types/drawing';
import { Trash2, Download, ArrowLeft, ImageIcon } from 'lucide-react';
import { useJubeeStore } from '@/store/useJubeeStore';
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

export default function Gallery() {
  const [drawings, setDrawings] = useState<SavedDrawing[]>([]);
  const [filter, setFilter] = useState<'all' | 'letter' | 'number'>('all');
  const navigate = useNavigate();
  const { speak } = useJubeeStore();

  useEffect(() => {
    loadDrawings();
  }, []);

  const loadDrawings = () => {
    const saved = getSavedDrawings();
    setDrawings(saved.sort((a, b) => b.timestamp - a.timestamp));
  };

  const handleDelete = (id: string) => {
    deleteDrawing(id);
    loadDrawings();
    toast({
      title: "Drawing deleted",
      description: "Your drawing has been removed from the gallery.",
    });
  };

  const handleClearAll = () => {
    clearAllDrawings();
    setDrawings([]);
    speak("All drawings cleared!");
    toast({
      title: "Gallery cleared",
      description: "All your drawings have been removed.",
    });
  };

  const handleDownload = (drawing: SavedDrawing) => {
    const link = document.createElement('a');
    link.download = `${drawing.type}-${drawing.character}-${drawing.timestamp}.png`;
    link.href = drawing.imageData;
    link.click();
    
    toast({
      title: "Drawing downloaded!",
      description: `${drawing.character} has been saved to your device.`,
    });
  };

  const filteredDrawings = drawings.filter(d => 
    filter === 'all' || d.type === filter
  );

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
                All ({drawings.length})
              </Button>
              <Button
                onClick={() => setFilter('letter')}
                variant={filter === 'letter' ? 'default' : 'outline'}
                size="lg"
              >
                Letters ({drawings.filter(d => d.type === 'letter').length})
              </Button>
              <Button
                onClick={() => setFilter('number')}
                variant={filter === 'number' ? 'default' : 'outline'}
                size="lg"
              >
                Numbers ({drawings.filter(d => d.type === 'number').length})
              </Button>
            </div>
          )}
        </header>

        {filteredDrawings.length === 0 ? (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDrawings.map((drawing) => (
              <div
                key={drawing.id}
                className="bg-card rounded-2xl shadow-xl border-4 border-primary/30 overflow-hidden hover:scale-105 transition-transform"
              >
                <div className="aspect-square bg-background p-4">
                  <img
                    src={drawing.imageData}
                    alt={`Drawing of ${drawing.type} ${drawing.character}`}
                    className="w-full h-full object-contain"
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
                      onClick={() => handleDownload(drawing)}
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
                          <AlertDialogAction onClick={() => handleDelete(drawing.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
