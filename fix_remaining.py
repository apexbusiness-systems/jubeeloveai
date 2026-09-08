import os

def fix_file(file_path, old_str, new_str, needs_import=False):
    if not os.path.exists(file_path):
        return

    with open(file_path, 'r') as f:
        content = f.read()

    if old_str in content:
        content = content.replace(old_str, new_str)
        if needs_import and "import { useShallow }" not in content and "import { useShallow } from 'zustand/react/shallow'" not in content:
             content = content.replace("import { useGameStore }", "import { useShallow } from 'zustand/react/shallow'\nimport { useGameStore }")
             # Special case for App.tsx if useGameStore is imported with others or differently
             if 'App.tsx' in file_path:
                 if "import { useGameStore }" not in content:
                     content = "import { useShallow } from 'zustand/react/shallow'\n" + content

        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Fixed {file_path}")

fix_file('src/modules/reading/StoryTime.tsx', 'const addScore = useGameStore(state => state.addScore);', 'const { addScore } = useGameStore(useShallow(state => ({ addScore: state.addScore })));', True)
fix_file('src/modules/games/ColorGame.tsx', 'const addScore = useGameStore(state => state.addScore);', 'const { addScore } = useGameStore(useShallow(state => ({ addScore: state.addScore })));', True)
fix_file('src/App.tsx', 'const setActivityCompleteCallback = useGameStore(state => state.setActivityCompleteCallback);', 'const { setActivityCompleteCallback } = useGameStore(useShallow(state => ({ setActivityCompleteCallback: state.setActivityCompleteCallback })));', True)
fix_file('src/pages/Home.tsx', 'const currentTheme = useGameStore(state => state.currentTheme);', 'const { currentTheme } = useGameStore(useShallow(state => ({ currentTheme: state.currentTheme })));', True)
