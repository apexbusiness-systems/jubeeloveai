import { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useJubeeStore } from '@/store/useJubeeStore';
import { useShallow } from 'zustand/react/shallow';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

export function VolumeControlDialog() {
  const {
    soundEffectsVolume,
    voiceVolume,
    setSoundEffectsVolume,
    setVoiceVolume,
    speak
  } = useJubeeStore(useShallow(state => ({
    soundEffectsVolume: state.soundEffectsVolume,
    voiceVolume: state.voiceVolume,
    setSoundEffectsVolume: state.setSoundEffectsVolume,
    setVoiceVolume: state.setVoiceVolume,
    speak: state.speak
  })));
  const [open, setOpen] = useState(false);

  const handleSoundEffectsChange = (value: number[]) => {
    setSoundEffectsVolume(value[0]);
  };

  const handleVoiceChange = (value: number[]) => {
    setVoiceVolume(value[0]);
  };

  const handleTestVoice = () => {
    speak('This is how my voice sounds!');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          aria-label="Open volume controls"
          title="Open volume controls"
          variant="outline"
          size="lg"
          className="w-full"
        >
          <Volume2 className="w-5 h-5 mr-2" aria-hidden="true" />
          Volume Controls
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2">
            <Volume2 className="w-6 h-6" aria-hidden="true" />
            Volume Controls
          </DialogTitle>
          <DialogDescription className="text-primary">
            Adjust or mute Jubee's sound effects and voice independently
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Sound Effects Volume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-effects" className="text-base font-semibold text-primary flex items-center gap-2">
                {soundEffectsVolume === 0 ? (
                  <VolumeX className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-5 h-5" aria-hidden="true" />
                )}
                Sound Effects
              </Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(soundEffectsVolume * 100)}%
              </span>
            </div>
            <Slider
              id="sound-effects"
              aria-label="Sound Effects Volume"
              title="Adjust sound effects volume"
              value={[soundEffectsVolume]}
              onValueChange={handleSoundEffectsChange}
              max={1}
              step={0.01}
              className="w-full"
            />
          </div>

          {/* Voice Volume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="voice" className="text-base font-semibold text-primary flex items-center gap-2">
                {voiceVolume === 0 ? (
                  <VolumeX className="w-5 h-5" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-5 h-5" aria-hidden="true" />
                )}
                Voice
              </Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(voiceVolume * 100)}%
              </span>
            </div>
            <Slider
              id="voice"
              aria-label="Voice Volume"
              title="Adjust voice volume"
              value={[voiceVolume]}
              onValueChange={handleVoiceChange}
              max={1}
              step={0.01}
              className="w-full"
            />
            <Button
              aria-label="Test voice volume"
              title="Test voice volume"
              onClick={handleTestVoice}
              variant="outline"
              size="sm"
              className="w-full mt-2"
              disabled={voiceVolume === 0}
            >
              Test Voice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
