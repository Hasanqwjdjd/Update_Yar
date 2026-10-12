#!/usr/bin/env python3
"""Generate Android launcher icons for UpdateYar from public/icon.png"""
import os
from PIL import Image, ImageDraw

SRC = "/home/z/my-project/public/icon.png"
RES = "/home/z/my-project/android/app/src/main/res"

DENSITIES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

def rounded(im, radius_ratio=0.22):
    """Return RGBA image with rounded corners."""
    size = im.size[0]
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    r = int(size * radius_ratio)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=255)
    out = im.convert("RGBA")
    out.putalpha(mask)
    return out

def circle(im):
    """Return RGBA image masked to a circle."""
    size = im.size[0]
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.ellipse([0, 0, size - 1, size - 1], fill=255)
    out = im.convert("RGBA")
    out.putalpha(mask)
    return out

def main():
    src = Image.open(SRC).convert("RGB")
    side = min(src.size)
    left = (src.size[0] - side) // 2
    top = (src.size[1] - side) // 2
    src = src.crop((left, top, left + side, top + side))

    for folder, px in DENSITIES.items():
        out_dir = os.path.join(RES, folder)
        os.makedirs(out_dir, exist_ok=True)

        square = src.resize((px, px), Image.LANCZOS)
        square.save(os.path.join(out_dir, "ic_launcher.png"), "PNG")

        circ = circle(src.resize((px, px), Image.LANCZOS))
        circ.save(os.path.join(out_dir, "ic_launcher_round.png"), "PNG")

        print(f"{folder}: ic_launcher.png + ic_launcher_round.png ({px}px)")

    store = rounded(src.resize((512, 512), Image.LANCZOS))
    store.save("/home/z/my-project/public/play-icon.png", "PNG")
    print("public/play-icon.png (512px) for store listing")

if __name__ == "__main__":
    main()
