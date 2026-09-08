import os
import re

def refactor_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    modified = False

    # Standard replacement for the 3-store calls
    old_pattern = """  const addScore = useGameStore(state => state.addScore);"""

    # We want to find multiple individual useGameStore, useJubeeStore calls.
    # Let's target the exact string sequences we know exist in the files from grep.

    if "PatternGame.tsx" in file_path or "MemoryGame.tsx" in file_path or "AlphabetGame.tsx" in file_path or "NumberGame.tsx" in file_path or "PuzzleGame.tsx" in file_path or "ShapeSorter.tsx" in file_path or "WritingCanvas.tsx" in file_path:
        # Most of these have:
        # const { speak, triggerAnimation } = useJubeeStore(useShallow(state => ({...})));
        # const addScore = useGameStore(state => state.addScore);

        # We can just change addScore to useShallow if it's not already
        if "const addScore = useGameStore(state => state.addScore);" in content:
            content = content.replace(
                "const addScore = useGameStore(state => state.addScore);",
                "const { addScore } = useGameStore(useShallow(state => ({ addScore: state.addScore })));"
            )
            # Make sure useShallow is imported and we don't duplicate it
            if "import { useShallow } from 'zustand/react/shallow'" not in content and "import { useShallow }" not in content:
                content = content.replace("import { useGameStore }", "import { useShallow } from 'zustand/react/shallow'\nimport { useGameStore }")
            modified = True

    if modified:
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Updated {file_path}")

files_to_fix = [
    'src/modules/games/MemoryGame.tsx',
    'src/modules/games/PatternGame.tsx',
    'src/modules/games/AlphabetGame.tsx',
    'src/modules/games/NumberGame.tsx',
    'src/modules/games/PuzzleGame.tsx',
    'src/modules/writing/WritingCanvas.tsx',
    'src/modules/shapes/ShapeSorter.tsx',
    'src/modules/reading/StoryTime.tsx'
]

for file in files_to_fix:
    if os.path.exists(file):
        refactor_file(file)
