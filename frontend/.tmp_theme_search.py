from pathlib import Path
import re
root = Path('frontend/src')
patterns = [
    r'backgroundColor:\s*"#fff"',
    r'backgroundColor:\s*"#ffffff"',
    r'background:\s*"#fff"',
    r'background:\s*"#ffffff"',
    r'color:\s*"#0f172a"',
    r'color:\s*"#1f2937"',
    r'color:\s*"#334155"',
    r'color:\s*"#475569"',
    r'color:\s*"#64748b"',
    r'color:\s*"#075985"',
    r'background:\s*"linear-gradient\(180deg, #ffffff',
    r'background:\s*"linear-gradient\(145deg, #0f172a',
    r'background:\s*"linear-gradient\(135deg, #0f172a',
    r'background:\s*"linear-gradient\(135deg, #b45309',
]
for p in patterns:
    print('PATTERN', p)
    for f in root.rglob('*.js'):
        txt = f.read_text(encoding='utf-8')
        m = len(re.findall(p, txt))
        if m:
            print(' ', f.relative_to(root), m)
