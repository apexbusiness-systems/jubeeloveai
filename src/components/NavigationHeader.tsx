import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { VoiceCommandButton } from './VoiceCommandButton';
import { useParentalStore } from '@/store/useParentalStore';

interface NavigationHeaderProps {
  onPersonalizeClick: () => void;
  onVoiceClick: () => void;
  onChildSelectorClick: () => void;
}

export const NavigationHeader = memo(function NavigationHeader({
  onPersonalizeClick,
  onVoiceClick,
  onChildSelectorClick
}: NavigationHeaderProps) {
  const activeChildId = useParentalStore(state => state.activeChildId);
  const children = useParentalStore(state => state.children);

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] glass-effect border-b border-border/20">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-primary logo-text">
            Jubee Love
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <VoiceCommandButton />
          
          {children.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onChildSelectorClick}
              className="text-foreground"
            >
              {activeChildId 
                ? children.find(c => c.id === activeChildId)?.name 
                : 'Select Child'}
            </Button>
          )}
          
          <button
            onClick={onPersonalizeClick}
            className="p-2 rounded-lg hover:bg-accent/10 transition-colors text-foreground"
            aria-label="Personalize Jubee"
          >
            🎨
          </button>
          
          <button
            onClick={onVoiceClick}
            className="p-2 rounded-lg hover:bg-accent/10 transition-colors text-foreground"
            aria-label="Change voice"
          >
            🔊
          </button>
        </div>
      </div>
    </header>
  );
});
