#!/usr/bin/env python3
"""Validate optimized artwork without changing files."""
import runpy
from pathlib import Path
from PIL import Image

config = runpy.run_path(str(Path(__file__).with_name('optimize-images.py')))
before = after = count = 0
for directory in config['TARGET_DIRS'][1:]:
    for source in directory.rglob('*'):
        if not source.is_file() or source.suffix.lower() not in config['SOURCE_EXTENSIONS']:
            continue
        target = source.with_suffix('.webp')
        with Image.open(source) as original, Image.open(target) as optimized:
            optimized.load()
            assert original.size == optimized.size, f'Size changed: {target}'
            if 'A' in original.getbands():
                assert original.getchannel('A').tobytes() == optimized.convert('RGBA').getchannel('A').tobytes(), f'Alpha changed: {target}'
        count += 1
        before += source.stat().st_size
        after += min(source.stat().st_size, target.stat().st_size)
print(f'{count} images verified: dimensions and alpha preserved; {before} -> {after} bytes ({(1-after/before)*100:.1f}% smaller).')