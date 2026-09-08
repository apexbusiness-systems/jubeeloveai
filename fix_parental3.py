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

fix_file('src/components/ChildSelector.tsx', 'const children = useParentalStore(useShallow(state => state.children));\nconst { startSession } = useParentalStore(useShallow(state => ({ startSession: state.startSession })));', 'const { children, startSession } = useParentalStore(useShallow(state => ({ children: state.children, startSession: state.startSession })));')
fix_file('src/pages/ParentHub.tsx', 'const children = useParentalStore(useShallow(state => state.children));\nconst { settings } = useParentalStore(useShallow(state => ({ settings: state.settings })));', 'const { children, settings } = useParentalStore(useShallow(state => ({ children: state.children, settings: state.settings })));')
