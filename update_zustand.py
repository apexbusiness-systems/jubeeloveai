import os
import re

directories = ['src/modules', 'src/components', 'src/pages']

def refactor_file(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Find sequences of multiple zustand hooks from the same store and convert to useShallow

    # Store names to look for
    stores = ['useJubeeStore', 'useGameStore', 'useParentalStore', 'useActivityStore']

    modified = False

    # Very rudimentary regex for finding multiple adjacent store calls
    # For a real implementation, AST parsing is better, but since this is targeted:
    # let's just specifically target ColorGame.tsx and FeelingsGame.tsx for now

    if 'ColorGame.tsx' in file_path:
        if 'const speak = useJubeeStore(state => state.speak);' in content:
            content = content.replace(
                "  const speak = useJubeeStore(state => state.speak);\nconst triggerAnimation = useJubeeStore(state => state.triggerAnimation);",
                "  const { speak, triggerAnimation } = useJubeeStore(useShallow(state => ({\n    speak: state.speak,\n    triggerAnimation: state.triggerAnimation\n  })));"
            )
            # Add import if not present
            if 'import { useShallow } from' not in content:
                content = content.replace("import { useJubeeStore }", "import { useShallow } from 'zustand/react/shallow'\nimport { useJubeeStore }")
            modified = True

    if 'FeelingsGame.tsx' in file_path:
        if 'const speak = useJubeeStore(s => s.speak);' in content and 'const calmMode =' in content:
            # We already have useShallow imported in FeelingsGame, let's replace the whole block

            # The exact block in FeelingsGame:
            old_block = """  const speak = useJubeeStore(s => s.speak);
  const addScore = useGameStore(s => s.addScore);
  const calmMode = useParentalStore(s => s.settings?.calmMode ?? false);"""

            new_block = """  // ⚡ Bolt Optimization: Wrap individual selectors to avoid multiple re-renders
  const { speak } = useJubeeStore(useShallow(s => ({ speak: s.speak })));
  const { addScore } = useGameStore(useShallow(s => ({ addScore: s.addScore })));
  const { calmMode } = useParentalStore(useShallow(s => ({ calmMode: s.settings?.calmMode ?? false })));"""

            if old_block in content:
                content = content.replace(old_block, new_block)
                modified = True

    if modified:
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Updated {file_path}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            refactor_file(os.path.join(root, file))
