import os

files_to_commit = [
    'src/App.tsx',
    'src/components/ChildSelector.tsx',
    'src/components/DailyQuestCard.tsx',
    'src/components/NavigationHeader.tsx',
    'src/components/OnboardingTutorial.tsx',
    'src/components/PageTransition.tsx',
    'src/components/SessionMonitor.tsx',
    'src/components/VoiceFallbackIndicator.tsx',
    'src/components/auth/DevAuthOverride.tsx',
    'src/components/rewards/RewardAnimation.tsx',
    'src/hooks/useAchievementTracker.ts',
    'src/hooks/useJubeeGreeting.ts',
    'src/hooks/useScreenTimeEnforcement.ts',
    'src/hooks/useSmartAudioPreloader.ts',
    'src/modules/dance/JubeeDance.tsx',
    'src/modules/feelings/FeelingsGame.tsx',
    'src/modules/games/AlphabetGame.tsx',
    'src/modules/games/ColorGame.tsx',
    'src/modules/games/MemoryGame.tsx',
    'src/modules/games/NumberGame.tsx',
    'src/modules/games/PatternGame.tsx',
    'src/modules/games/PuzzleGame.tsx',
    'src/modules/reading/StoryTime.tsx',
    'src/modules/shapes/ShapeSorter.tsx',
    'src/modules/writing/WritingCanvas.tsx',
    'src/pages/Gallery.tsx',
    'src/pages/GamesMenu.tsx',
    'src/pages/Home.tsx',
    'src/pages/Music.tsx',
    'src/pages/ParentHub.tsx',
    'src/pages/Settings.tsx'
]

for file in files_to_commit:
    os.system(f'git add {file}')
