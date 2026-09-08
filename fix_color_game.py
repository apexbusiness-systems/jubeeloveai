import re

file_path = 'src/modules/games/ColorGame.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# Replace individual useJubeeStore calls with useShallow
content = content.replace(
    '  const speak = useJubeeStore(state => state.speak);\nconst triggerAnimation = useJubeeStore(state => state.triggerAnimation);',
    '  const { speak, triggerAnimation } = useJubeeStore(useShallow(state => ({\n    speak: state.speak,\n    triggerAnimation: state.triggerAnimation\n  })));'
)

with open(file_path, 'w') as f:
    f.write(content)
