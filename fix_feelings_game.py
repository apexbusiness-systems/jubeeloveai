import re

file_path = 'src/modules/feelings/FeelingsGame.tsx'

with open(file_path, 'r') as f:
    content = f.read()

# Replace individual useJubeeStore calls with useShallow
content = content.replace(
    '  const speak = useJubeeStore(s => s.speak);\n  const addScore = useGameStore(s => s.addScore);\n  const calmMode = useParentalStore(s => s.settings?.calmMode ?? false);',
    '  const { speak } = useJubeeStore(useShallow(s => ({ speak: s.speak })));\n  const { addScore } = useGameStore(useShallow(s => ({ addScore: s.addScore })));\n  const { calmMode } = useParentalStore(useShallow(s => ({ calmMode: s.settings?.calmMode ?? false })));'
)

with open(file_path, 'w') as f:
    f.write(content)
