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

fix_file('src/components/ChildSelector.tsx', 'const startSession = useParentalStore(state => state.startSession);', 'const { startSession } = useParentalStore(useShallow(state => ({ startSession: state.startSession })));', True)
fix_file('src/components/SessionMonitor.tsx', 'const updateSessionTime = useParentalStore(state => state.updateSessionTime);\n  const endSession = useParentalStore(state => state.endSession);', 'const { updateSessionTime, endSession } = useParentalStore(useShallow(state => ({ updateSessionTime: state.updateSessionTime, endSession: state.endSession })));', True)
fix_file('src/components/auth/DevAuthOverride.tsx', 'const setPremiumStatus = useParentalStore(state => state.setPremiumStatus);\nconst isPremium = useParentalStore(state => state.isPremium);', 'const { setPremiumStatus, isPremium } = useParentalStore(useShallow(state => ({ setPremiumStatus: state.setPremiumStatus, isPremium: state.isPremium })));', True)
fix_file('src/pages/ParentHub.tsx', 'const settings = useParentalStore(useShallow(state => state.settings));', 'const { settings } = useParentalStore(useShallow(state => ({ settings: state.settings })));', True)
fix_file('src/modules/dance/JubeeDance.tsx', 'const isPremium = useParentalStore(state => state.isPremium);', 'const { isPremium } = useParentalStore(useShallow(state => ({ isPremium: state.isPremium })));', True)
fix_file('src/pages/Music.tsx', 'const isPremium = useParentalStore((state) => state.isPremium);', 'const { isPremium } = useParentalStore(useShallow(state => ({ isPremium: state.isPremium })));', True)
