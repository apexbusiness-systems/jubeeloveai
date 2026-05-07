with open('src/components/rewards/RewardAnimation.tsx', 'r') as f:
    content = f.read()

import_add = """import { useParentalStore } from '@/store/useParentalStore';
"""
if "useParentalStore" not in content:
    content = content.replace("import { useEffect, useState } from 'react'", "import { useEffect, useState } from 'react'\n" + import_add)

replace_start = "  const [confetti, setConfetti] = useState<Confetti[]>([])"
replace_with = """  const [confetti, setConfetti] = useState<Confetti[]>([])
  const isCalmMode = useParentalStore(state => state.settings?.calmMode ?? false);"""

if "isCalmMode" not in content:
    content = content.replace(replace_start, replace_with)

content = content.replace("for (let i = 0; i < 50; i++) {", "const particleCount = isCalmMode ? 10 : 50;\n      for (let i = 0; i < particleCount; i++) {")

with open('src/components/rewards/RewardAnimation.tsx', 'w') as f:
    f.write(content)
