import os

def fix_file(file_path, old_str, new_str, needs_import=False):
    if not os.path.exists(file_path):
        return

    with open(file_path, 'r') as f:
        content = f.read()

    if old_str in content:
        content = content.replace(old_str, new_str)
        if needs_import and "import { useShallow }" not in content and "import { useShallow } from 'zustand/react/shallow'" not in content:
             content = content.replace("import { useParentalStore }", "import { useShallow } from 'zustand/react/shallow'\nimport { useParentalStore }")

        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Fixed {file_path}")

fix_file('src/components/NavigationHeader.tsx', 'const hasChildren = useParentalStore(state => state.children.length > 0);\n  const activeChildName = useParentalStore(\n    state => state.children.find(c => c.id === state.activeChildId)?.name\n  );', 'const { hasChildren, activeChildName } = useParentalStore(useShallow(state => ({\n    hasChildren: state.children.length > 0,\n    activeChildName: state.children.find(c => c.id === state.activeChildId)?.name\n  })));', True)
fix_file('src/hooks/useScreenTimeEnforcement.ts', 'const updateSessionTime = useParentalStore(state => state.updateSessionTime);\nconst endSession = useParentalStore(state => state.endSession);', 'const { updateSessionTime, endSession } = useParentalStore(useShallow(state => ({ updateSessionTime: state.updateSessionTime, endSession: state.endSession })));', True)
fix_file('src/components/rewards/RewardAnimation.tsx', 'const isCalmMode = useParentalStore(state => state.settings?.calmMode ?? false);', 'const { isCalmMode } = useParentalStore(useShallow(state => ({ isCalmMode: state.settings?.calmMode ?? false })));', True)
fix_file('src/pages/Settings.tsx', 'const hasChildren = useParentalStore(state => state.children.length > 0);', 'const { hasChildren } = useParentalStore(useShallow(state => ({ hasChildren: state.children.length > 0 })));', True)
