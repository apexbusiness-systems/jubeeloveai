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
  const hasChildren = useParentalStore(state => state.children.length > 0);
  const activeChildName = useParentalStore(
    state => state.activeChildId ? state.children.find(c => c.id === state.activeChildId)?.name : null
  );

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
          
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onChildSelectorClick}
              className="text-foreground"
            >
              {activeChildName || 'Select Child'}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onPersonalizeClick}
            className="text-foreground"
            aria-label="Personalize Jubee"
            title="Personalize Jubee"
          >
            🎨
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onVoiceClick}
            className="text-foreground"
            aria-label="Change voice"
            title="Change voice"
          >
            🔊
          </Button>
        </div>
      </div>
    </header>
  );
});
