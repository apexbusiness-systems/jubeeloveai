import os
import re

directories = ['src']
exclude = ['performance', '__tests__', 'logger.ts']

pattern_log = re.compile(r'console\.log\(')

def process_file(filepath):
    if any(ex in filepath for ex in exclude):
        return

    try:
        with open(filepath, 'r') as f:
            content = f.read()

        if not pattern_log.search(content):
            return

        if "import { logger }" not in content and "import {logger}" not in content:
            import_str = "import { logger } from '@/lib/logger';\n"
            first_import_match = re.search(r'^import ', content, re.MULTILINE)
            if first_import_match:
                content = content[:first_import_match.start()] + import_str + content[first_import_match.start():]
            else:
                content = import_str + content

        content = pattern_log.sub('logger.dev(', content)

        with open(filepath, 'w') as f:
            f.write(content)

    except Exception as e:
        print(f"Error processing {filepath}: {e}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            process_file(os.path.join(root, file))
