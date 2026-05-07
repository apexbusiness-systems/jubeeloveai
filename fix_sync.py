with open('src/lib/syncService.ts', 'r') as f:
    content = f.read()

content = content.replace("startAutoSync(intervalMs: number = 60000)", "startAutoSync(intervalMs: number = 300000)")

with open('src/lib/syncService.ts', 'w') as f:
    f.write(content)
