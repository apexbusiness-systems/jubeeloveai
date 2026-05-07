with open('src/store/useParentalStore.ts', 'r') as f:
    content = f.read()

# Add calmMode to ParentalSettings interface
if "calmMode: boolean;" not in content:
    content = content.replace("requirePinForSettings: boolean;", "requirePinForSettings: boolean;\n  calmMode: boolean;")

# Add to DEFAULT_SETTINGS
if "calmMode: false" not in content:
    content = content.replace("requirePinForSettings: true,", "requirePinForSettings: true,\n  calmMode: false,")
    content = content.replace("requirePinForSettings: false,", "requirePinForSettings: false,\n  calmMode: false,")

with open('src/store/useParentalStore.ts', 'w') as f:
    f.write(content)
