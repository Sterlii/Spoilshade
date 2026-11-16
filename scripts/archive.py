#!/usr/bin/env python3
"""Build deterministic ZIPs from explicitly allowlisted project paths."""
from pathlib import Path
import sys
import zipfile

root = Path(sys.argv[1]).resolve()
output = Path(sys.argv[2]).resolve()
files = set()
private_dirs = {'.git', 'node_modules', '.test-cache', '.test-profiles', '__pycache__', 'coverage', 'release', 'dist'}
private_receipts = {'BROWSER-RESULTS.json', 'FIREFOX-TOOLBAR-RESULT.json'}

def publishable(file):
    relative = file.relative_to(root)
    if file.is_symlink() or not file.resolve().is_relative_to(root):
        return False
    if any(part in private_dirs for part in relative.parts):
        return False
    if relative.parts[:1] == ('Images',) or relative.parts[:2] == ('docs', 'evidence'):
        return False
    if file.name in private_receipts or file.name.startswith(('.env', 'PRIVATE-')) or file.name in {'.npmrc', '.git-credentials'}:
        return False
    if file.suffix in {'.key', '.pem', '.p12', '.pfx'} or file.name.endswith('-live-youtube.png'):
        return False
    return True

for name in sys.argv[3:] or ['.']:
    target = root / name
    for file in target.rglob('*') if target.is_dir() else [target]:
        if file.is_file() and publishable(file):
            files.add(file)
with zipfile.ZipFile(output, 'w') as archive:
    for file in sorted(files):
        info = zipfile.ZipInfo(file.relative_to(root).as_posix(), (2026, 1, 1, 0, 0, 0))
        info.create_system = 3
        info.external_attr = 0o100644 << 16
        archive.writestr(info, file.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
