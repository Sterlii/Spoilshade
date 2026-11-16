#!/usr/bin/env python3
"""Export original Spoilshade SVG artwork; no network or Python dependencies.

Requires the system commands rsvg-convert and magick (ImageMagick).
Run from any directory: python3 scripts/assets.py
"""
from pathlib import Path
import shutil
import struct
import subprocess

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'


def run(*arguments):
    subprocess.run([str(arg) for arg in arguments], check=True)


def check_png(path, expected):
    with path.open('rb') as stream:
        header = stream.read(24)
    if header[:8] != b'\x89PNG\r\n\x1a\n' or struct.unpack('>II', header[16:24]) != expected:
        raise RuntimeError(f'Invalid PNG dimensions: {path}')
    print(f'{path.relative_to(ROOT)} — {expected[0]}×{expected[1]} PNG')


def main():
    for command in ('rsvg-convert', 'magick'):
        if not shutil.which(command):
            raise SystemExit(f'Required local rendering tool is missing: {command}')
    icons = ASSETS / 'icons'
    icons.mkdir(parents=True, exist_ok=True)
    logo = ASSETS / 'brand' / 'logo.svg'
    for size in (16, 32, 48, 64, 96, 128, 256, 512):
        output = icons / f'icon-{size}.png'
        # Chrome's 128px icon has a 96px square image with 16px transparent padding.
        # Keep toolbar icons full size for legibility; apply the same store padding
        # proportion to the larger press/store exports.
        artwork_size = size if size < 128 else size * 3 // 4
        rendered = subprocess.run(
            ['rsvg-convert', '-w', str(artwork_size), '-h', str(artwork_size), str(logo)],
            check=True, capture_output=True).stdout
        subprocess.run(['magick', 'png:-', '-gravity', 'center', '-background', 'none',
                        '-extent', f'{size}x{size}', '-strip', f'PNG32:{output}'],
                       input=rendered, check=True)
        check_png(output, (size, size))
    for source, width, height in (
        ('promo-small-440x280', 440, 280),
        ('promo-marquee-1400x560', 1400, 560),
    ):
        svg = ASSETS / 'promo' / f'{source}.svg'
        output = svg.with_suffix('.png')
        rendered = subprocess.run(['rsvg-convert', str(svg)], check=True, capture_output=True).stdout
        subprocess.run(['magick', 'png:-', '-background', '#111318', '-alpha', 'remove',
                        '-alpha', 'off', '-strip', f'PNG24:{output}'], input=rendered, check=True)
        check_png(output, (width, height))


if __name__ == '__main__':
    main()
