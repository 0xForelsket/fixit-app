
import os

target_dir = "src/tests"
compat_import = '@/tests/bun-compat'

for root, dirs, files in os.walk(target_dir):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx'):
            if file == 'bun-compat.ts' or file == 'setup.ts' or file == 'hoist-test.ts' or file == 'math.ts':
                continue
            
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
            
            if 'from "vitest"' in content or "from 'vitest'" in content:
                print(f"Updating {path}")
                content = content.replace('from "vitest"', f'from "{compat_import}"')
                content = content.replace("from 'vitest'", f"from '{compat_import}'")
                
                with open(path, 'w') as f:
                    f.write(content)
