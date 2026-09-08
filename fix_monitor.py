import os

def fix_file(file_path):
    if not os.path.exists(file_path):
        return

    with open(file_path, 'r') as f:
        content = f.read()

    old_str = """  // ⚡ Bolt: Memoize child object selector with useShallow to prevent unnecessary
  // re-renders when unrelated children update their session time
  const activeChild = useParentalStore(useShallow(state =>
    state.activeChildId ? state.children.find(c => c.id === state.activeChildId) : null
  ));

  const { updateSessionTime, endSession } = useParentalStore(useShallow(state => ({ updateSessionTime: state.updateSessionTime, endSession: state.endSession })));"""

    new_str = """  // ⚡ Bolt: Memoize child object selector with useShallow to prevent unnecessary
  // re-renders when unrelated children update their session time
  const { activeChild, updateSessionTime, endSession } = useParentalStore(useShallow(state => ({
    activeChild: state.activeChildId ? state.children.find(c => c.id === state.activeChildId) : null,
    updateSessionTime: state.updateSessionTime,
    endSession: state.endSession
  })));"""

    if old_str in content:
        content = content.replace(old_str, new_str)

        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Fixed {file_path}")

fix_file('src/components/SessionMonitor.tsx')
