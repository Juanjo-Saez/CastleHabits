"""Extract the castle and foreground ground from the authorised reference image.

Usage (requires `pip install pillow numpy`):

    python scripts/extract-castle.py [--preview DIR]

Reads  art/references/castle-reference.png (738x414, untouched original).
Writes src/assets/castle.png: same size, the sky, clouds, moon and distant
mountains made transparent so the app can draw its own sky, weather and moon.
"""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "art" / "references" / "castle-reference.png"
TARGET = ROOT / "src" / "assets" / "castle.png"

# Rows from HORIZON down are ground (plain + rocks) and are always kept.
HORIZON = 341
# Above the horizon only the castle columns can be opaque; the rest is sky/mountains.
CASTLE_X0, CASTLE_X1 = 270, 548
# Enclosed sky pockets smaller than this are JPEG noise inside the stone.
MAX_NOISE_HOLE = 60
# The painted moon (centre x, centre y, radius) is removed; the app draws its own.
MOON = (451, 89, 49)
# Indexed colours kept for the stone and ground (one more slot is transparency).
PALETTE_SIZE = 160


def neighbour_count(mask: np.ndarray, radius: int = 1) -> np.ndarray:
    padded = np.pad(mask.astype(np.int32), radius)
    size = 2 * radius + 1
    total = np.zeros(mask.shape, dtype=np.int32)
    for dy in range(size):
        for dx in range(size):
            total += padded[dy : dy + mask.shape[0], dx : dx + mask.shape[1]]
    return total


def neighbour_count_values(values: np.ndarray, mask: np.ndarray, radius: int = 1) -> np.ndarray:
    """Sum of `values` over the masked neighbours of each pixel."""
    masked = np.where(mask, values, 0).astype(np.int64)
    padded = np.pad(masked, radius)
    size = 2 * radius + 1
    total = np.zeros(values.shape, dtype=np.int64)
    for dy in range(size):
        for dx in range(size):
            total += padded[dy : dy + values.shape[0], dx : dx + values.shape[1]]
    return total


def components(mask: np.ndarray):
    """Yield (pixels, touches_border) for each 4-connected component of mask."""
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    for y in range(height):
        for x in range(width):
            if not mask[y, x] or seen[y, x]:
                continue
            queue = deque([(y, x)])
            seen[y, x] = True
            pixels = []
            border = False
            while queue:
                cy, cx = queue.popleft()
                pixels.append((cy, cx))
                if cy in (0, height - 1) or cx in (0, width - 1):
                    border = True
                for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                    if 0 <= ny < height and 0 <= nx < width and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        queue.append((ny, nx))
            yield pixels, border


def build_mask(rgb: np.ndarray) -> np.ndarray:
    r, g, b = (rgb[..., i].astype(np.int32) for i in range(3))
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    height, width = r.shape

    rows = np.arange(height)[:, None]
    cols = np.arange(width)[None, :]

    warm_cloud = (r - b > 14) & (lum > 34)
    moon_x, moon_y, moon_r = MOON
    in_moon = (cols - moon_x) ** 2 + (rows - moon_y) ** 2 <= moon_r**2
    bright = (lum > 150) | (in_moon & (lum > 42) & (r >= b - 2))
    # The night sky is a smooth magenta gradient; stone is neutral or textured.
    magenta = (r - g >= 7) & (b - g >= 7)
    window = np.lib.stride_tricks.sliding_window_view(np.pad(lum, 2, mode="edge"), (5, 5))
    smooth = window.std(axis=(-1, -2)) < 2.5
    # Large flat maroon stone is darker than the sky behind it; low down that sky is
    # cloud shadow, which is brighter than the night sky above the spires.
    purple_sky = magenta & smooth & (lum > np.where(rows < 200, 18, 30))
    # Dark cloud wisps are textured but stay magenta, while lit stone leans blue.
    wisp = (r - g >= 10) & (b - g >= 8) & (b - r <= 2) & (lum > 28) & (rows < HORIZON)
    stone = ~(warm_cloud | bright | purple_sky | wisp)

    # Majority filter smooths the 8x8 JPEG blocks without moving real edges much.
    stone = neighbour_count(stone) >= 5

    # The texture window spreads 2px into the sky around the stone: peel that fringe back.
    colour = rgb.astype(np.int32)
    for _ in range(2):
        sky = ~stone
        sky_count = np.maximum(neighbour_count(sky), 1)
        local_sky = np.stack([neighbour_count_values(colour[..., i], sky) for i in range(3)], axis=-1)
        local_sky = local_sky / sky_count[..., None]
        close = np.abs(colour - local_sky).max(axis=-1) <= 5
        stone &= ~(magenta & close & (neighbour_count(sky) > 0))

    in_castle = (cols >= CASTLE_X0) & (cols <= CASTLE_X1)
    ground = rows >= HORIZON
    candidate = (stone & in_castle) | ground

    # Keep only stone that is connected to the ground: floating specks are cloud noise.
    keep = np.zeros_like(candidate)
    queue = deque((HORIZON, x) for x in range(width))
    for y, x in queue:
        keep[y, x] = True
    while queue:
        cy, cx = queue.popleft()
        for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
            if 0 <= ny < height and 0 <= nx < width and candidate[ny, nx] and not keep[ny, nx]:
                keep[ny, nx] = True
                queue.append((ny, nx))

    # Fill tiny enclosed pockets, but keep real openings where clouds show through.
    for pixels, border in components(~keep):
        if border or len(pixels) > MAX_NOISE_HOLE:
            continue
        ys, xs = zip(*pixels)
        if (warm_cloud[ys, xs] | bright[ys, xs]).mean() > 0.5:
            continue
        keep[ys, xs] = True

    return keep


def decontaminate(rgb: np.ndarray, mask: np.ndarray) -> np.ndarray:
    """Replace warm cloud colour bleeding into edge pixels with nearby stone colour."""
    out = rgb.copy()
    r, b = rgb[..., 0].astype(np.int32), rgb[..., 2].astype(np.int32)
    clean = mask & (r - b <= 6)
    edge = mask & (neighbour_count(mask) < 9)
    height, width = mask.shape
    for y, x in zip(*np.nonzero(edge & (r - b > 6))):
        y0, y1, x0, x1 = max(0, y - 2), min(height, y + 3), max(0, x - 2), min(width, x + 3)
        sample = rgb[y0:y1, x0:x1][clean[y0:y1, x0:x1]]
        if len(sample):
            out[y, x] = sample.mean(axis=0)
    return out


def to_palette(rgb: np.ndarray, mask: np.ndarray) -> Image.Image:
    """Indexed PNG: a pixel-art palette for the stone plus one transparent slot.

    Transparent pixels are blanked first so the palette is spent on the castle,
    not on the discarded sky. This also flattens most of the JPEG noise.
    """
    opaque = np.where(mask[..., None], rgb, 0).astype(np.uint8)
    quantized = Image.fromarray(opaque).quantize(
        colors=PALETTE_SIZE, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE
    )
    indices = np.array(quantized, dtype=np.uint8)
    indices[~mask] = PALETTE_SIZE
    art = Image.fromarray(indices, "P")
    art.putpalette(quantized.getpalette()[: PALETTE_SIZE * 3] + [0, 0, 0])
    art.info["transparency"] = PALETTE_SIZE
    return art


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", type=Path, help="write review composites to this folder")
    args = parser.parse_args()

    rgb = np.array(Image.open(SOURCE).convert("RGB"))
    mask = build_mask(rgb)
    art = to_palette(decontaminate(rgb, mask), mask)
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    art.save(TARGET, optimize=True, transparency=PALETTE_SIZE)
    print(f"wrote {TARGET.relative_to(ROOT)} {art.width}x{art.height} ({TARGET.stat().st_size} bytes)")

    if args.preview:
        args.preview.mkdir(parents=True, exist_ok=True)
        rgba = art.convert("RGBA")
        for name, colour_bg in (("night", (10, 11, 36)), ("leak", (0, 255, 120))):
            canvas = Image.new("RGBA", rgba.size, colour_bg + (255,))
            canvas.alpha_composite(rgba)
            canvas.resize((rgba.width * 2, rgba.height * 2), Image.NEAREST).save(args.preview / f"preview-{name}.png")


if __name__ == "__main__":
    main()
