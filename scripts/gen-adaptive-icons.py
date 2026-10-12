#!/usr/bin/env python3
"""Generate adaptive icon foregrounds (safe-zone scaled) for UpdateYar."""
import os
from PIL import Image

SRC = "/home/z/my-project/public/icon.png"
RES = "/home/z/my-project/android/app/src/main/res"

# Android adaptive icon: canvas 108dp, visible 72dp -> content ~62% of canvas
DENSITIES = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}
CONTENT_RATIO = 0.62

def main():
    src = Image.open(SRC).convert("RGBA")
    side = min(src.size)
    left = (src.size[0] - side) // 2
    top = (src.size[1] - side) // 2
    src = src.crop((left, top, left + side, top + side))

    for folder, canvas in DENSITIES.items():
        out_dir = os.path.join(RES, folder)
        os.makedirs(out_dir, exist_ok=True)

        layer = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
        content_px = int(canvas * CONTENT_RATIO)
        scaled = src.resize((content_px, content_px), Image.LANCZOS)
        off = (canvas - content_px) // 2
        layer.paste(scaled, (off, off), scaled)
        layer.save(os.path.join(out_dir, "ic_launcher_foreground.png"), "PNG")
        print(f"{folder}: ic_launcher_foreground.png ({canvas}px canvas)")

if __name__ == "__main__":
    main()
