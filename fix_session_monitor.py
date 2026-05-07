with open('src/components/SessionMonitor.tsx', 'r') as f:
    content = f.read()

import_add = """import { useParentalStore } from '@/store/useParentalStore';"""
if "const settings = useParentalStore(" not in content:
    content = content.replace("const children = useParentalStore", "const settings = useParentalStore((state) => state.settings);\n  const children = useParentalStore")

content = content.replace("        toast({", "        if (!settings?.calmMode) toast({")

with open('src/components/SessionMonitor.tsx', 'w') as f:
    f.write(content)
