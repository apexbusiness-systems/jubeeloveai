import os

def fix_file(file_path):
    if not os.path.exists(file_path):
        return

    with open(file_path, 'r') as f:
        content = f.read()

    old_str = """  const hasChildren = useParentalStore(state => state.children.length > 0);
  const activeChildName = useParentalStore(
    state => state.activeChildId ? state.children.find(c => c.id === state.activeChildId)?.name : null
  );"""

    new_str = """  const { hasChildren, activeChildName } = useParentalStore(useShallow(state => ({
    hasChildren: state.children.length > 0,
    activeChildName: state.activeChildId ? state.children.find(c => c.id === state.activeChildId)?.name : null
  })));"""

    if old_str in content:
        content = content.replace(old_str, new_str)
        content = content.replace("import { useParentalStore }", "import { useShallow } from 'zustand/react/shallow'\nimport { useParentalStore }")

        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Fixed {file_path}")

fix_file('src/components/NavigationHeader.tsx')
