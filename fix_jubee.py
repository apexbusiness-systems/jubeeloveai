import os

def fix_file(file_path, old_str, new_str, needs_import=False):
    if not os.path.exists(file_path):
        return

    with open(file_path, 'r') as f:
        content = f.read()

    if old_str in content:
        content = content.replace(old_str, new_str)
        if needs_import and "import { useShallow }" not in content and "import { useShallow } from 'zustand/react/shallow'" not in content:
             content = content.replace("import { useJubeeStore }", "import { useShallow } from 'zustand/react/shallow'\nimport { useJubeeStore }")

        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Fixed {file_path}")

fix_file('src/components/DailyQuestCard.tsx', 'const triggerAnimation = useJubeeStore(s => s.triggerAnimation);', 'const { triggerAnimation } = useJubeeStore(useShallow(s => ({ triggerAnimation: s.triggerAnimation })));', True)
fix_file('src/components/VoiceFallbackIndicator.tsx', 'const usingFallbackVoice = useJubeeStore((s) => s.usingFallbackVoice)', 'const { usingFallbackVoice } = useJubeeStore(useShallow(s => ({ usingFallbackVoice: s.usingFallbackVoice })));', True)
fix_file('src/components/OnboardingTutorial.tsx', 'const interactionCount = useJubeeStore(state => state.interactionCount);', 'const { interactionCount } = useJubeeStore(useShallow(state => ({ interactionCount: state.interactionCount })));', True)
fix_file('src/components/PageTransition.tsx', 'const triggerAnimation = useJubeeStore(state => state.triggerAnimation);', 'const { triggerAnimation } = useJubeeStore(useShallow(state => ({ triggerAnimation: state.triggerAnimation })));', True)
fix_file('src/modules/feelings/FeelingsGame.tsx', 'const speak = useJubeeStore(s => s.speak);', 'const { speak } = useJubeeStore(useShallow(s => ({ speak: s.speak })));', True)
fix_file('src/hooks/useSmartAudioPreloader.ts', 'const voice = useJubeeStore(state => state.voice);', 'const { voice } = useJubeeStore(useShallow(state => ({ voice: state.voice })));', True)
fix_file('src/hooks/useJubeeGreeting.ts', 'const currentMood = useJubeeStore(state => state.currentMood);', 'const { currentMood } = useJubeeStore(useShallow(state => ({ currentMood: state.currentMood })));', True)
fix_file('src/hooks/useAchievementTracker.ts', 'const speak = useJubeeStore(state => state.speak);', 'const { speak } = useJubeeStore(useShallow(state => ({ speak: state.speak })));', True)
fix_file('src/App.tsx', 'const containerPosition = useJubeeStore(state => state.containerPosition);', 'const { containerPosition } = useJubeeStore(useShallow(state => ({ containerPosition: state.containerPosition })));', True)
fix_file('src/pages/GamesMenu.tsx', 'const triggerAnimation = useJubeeStore((state) => state.triggerAnimation);', 'const { triggerAnimation } = useJubeeStore(useShallow(state => ({ triggerAnimation: state.triggerAnimation })));', True)
fix_file('src/pages/Home.tsx', 'const triggerAnimation = useJubeeStore((state) => state.triggerAnimation);', 'const { triggerAnimation } = useJubeeStore(useShallow(state => ({ triggerAnimation: state.triggerAnimation })));', True)
fix_file('src/pages/Gallery.tsx', 'const speak = useJubeeStore(state => state.speak);', 'const { speak } = useJubeeStore(useShallow(state => ({ speak: state.speak })));', True)
