#!/usr/bin/env python3
"""OG symbol refinements v2 — reference-led treatment, clean matting."""

from __future__ import annotations

import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "brand-assets-preview" / "og-refinements-v2"
MANTIS_SRC = Path(
    "/Users/brendan/.cursor/projects/Users-brendan-Documents-Claude-Projects-Imbas/assets/"
    "mantis_full_cropped-d827254c-fec0-4372-8fba-2f60c1bb6b0c.png"
)

W, H = 1200, 630
CX, CY = W // 2, H // 2

BG_DEEP = (4, 3, 3)
BG_WARM = (14, 9, 6)
INK = (248, 243, 235)
EMBER = (238, 118, 52)
EMBER_CORE = (255, 178, 95)
EMBER_SOFT = (195, 88, 38)


def luminance(r: int, g: int, b: int) -> float:
    return 0.299 * r + 0.587 * g + 0.114 * b


def extract_line_art(im: Image.Image) -> Image.Image:
    """Keep only cream line pixels + ember tips — no background matte."""
    src = im.convert("RGBA")
    px = src.load()
    out = Image.new("RGBA", src.size, (0, 0, 0, 0))
    opx = out.load()
    for y in range(src.height):
        for x in range(src.width):
            r, g, b, a = px[x, y]
            lum = luminance(r, g, b)
            # Ember tips
            if r > 120 and g < 105 and b < 95 and r > g:
                opx[x, y] = (r, g, b, 255)
            # Cream line work
            elif lum > 95:
                opx[x, y] = (min(255, r + 8), min(255, g + 8), min(255, b + 8), 255)
    return out


def content_box(im: Image.Image, pad: int = 0) -> tuple[int, int, int, int]:
    alpha = im.split()[3]
    bbox = alpha.getbbox()
    if not bbox:
        return 0, 0, im.width, im.height
    x0, y0, x1, y1 = bbox
    return (
        max(0, x0 - pad),
        max(0, y0 - pad),
        min(im.width, x1 + pad),
        min(im.height, y1 + pad),
    )


def glow_ellipse(
    size: tuple[int, int],
    center: tuple[int, int],
    radii: tuple[int, int],
    color: tuple[int, int, int],
    alpha: int,
    blur: int,
) -> Image.Image:
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = center
    rx, ry = radii
    draw.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=(*color, alpha))
    return layer.filter(ImageFilter.GaussianBlur(blur))


def build_background(*, warmth: float = 1.0) -> Image.Image:
    base = Image.new("RGBA", (W, H), (*BG_DEEP, 255))
    grad = Image.new("RGBA", (W, H))
    px = grad.load()
    for y in range(H):
        t = y / (H - 1)
        r = int(BG_DEEP[0] + (BG_WARM[0] - BG_DEEP[0]) * (t**1.25) * warmth)
        g = int(BG_DEEP[1] + (BG_WARM[1] - BG_DEEP[1]) * (t**1.25) * warmth)
        b = int(BG_DEEP[2] + (BG_WARM[2] - BG_DEEP[2]) * (t**1.25) * warmth)
        for x in range(W):
            px[x, y] = (r, g, b, 255)
    base = Image.alpha_composite(base, grad)
    base = Image.alpha_composite(
        base,
        glow_ellipse((W, H), (CX, CY - 10), (460, 340), (20, 14, 10), int(22 * warmth), 100),
    )
    base = Image.alpha_composite(
        base,
        glow_ellipse((W, H), (CX, H - 85), (380, 130), EMBER_SOFT, int(16 * warmth), 85),
    )
    return base


def add_floor_plane(canvas: Image.Image, *, strength: float = 1.0) -> Image.Image:
    floor_y = int(H * 0.705)
    floor = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(floor)
    for y in range(floor_y, H):
        t = (y - floor_y) / (H - floor_y)
        a = int(48 * t * strength)
        draw.line((0, y, W, y), fill=(18, 12, 8, a))
    floor = floor.filter(ImageFilter.GaussianBlur(1.0))
    out = Image.alpha_composite(canvas, floor)
    draw = ImageDraw.Draw(out)
    draw.line((0, floor_y, W, floor_y), fill=(48, 32, 22, int(40 * strength)), width=1)
    return out, floor_y


def prepare_mark(line_art: Image.Image, height: int) -> Image.Image:
    box = content_box(line_art, pad=2)
    art = line_art.crop(box)
    scale = height / art.height
    return art.resize(
        (max(1, int(art.width * scale)), height),
        Image.Resampling.LANCZOS,
    )


def line_glow(mark: Image.Image, *, strength: float) -> Image.Image:
    """Glow derived from line pixels only — no bounding box."""
    alpha = mark.split()[3]
    white = Image.new("RGBA", mark.size, (*INK, 0))
    white.putalpha(alpha)
    soft = white.filter(ImageFilter.GaussianBlur(4))
    wide = white.filter(ImageFilter.GaussianBlur(10))
    wide = ImageEnhance.Brightness(wide).enhance(0.55 * strength)
    soft = ImageEnhance.Brightness(soft).enhance(0.85 * strength)
    return Image.alpha_composite(wide, soft)


def ember_bloom(mark: Image.Image, *, intensity: float) -> Image.Image:
    w, h = mark.size
    px = mark.load()
    tips: list[tuple[int, int]] = []
    # Find ember tip pixels (top corners of artwork)
    for y in range(int(h * 0.05)):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 0 and r > 120 and g < 105:
                tips.append((x, y))
    if len(tips) < 2:
        tips = [(int(w * 0.02), int(h * 0.02)), (int(w * 0.98), int(h * 0.02))]

    # Cluster to two tip centers
    left = [p for p in tips if p[0] < w // 2]
    right = [p for p in tips if p[0] >= w // 2]
    centers = []
    for group in (left, right):
        if group:
            cx = sum(p[0] for p in group) // len(group)
            cy = sum(p[1] for p in group) // len(group)
            centers.append((cx, cy))

    glow = Image.new("RGBA", mark.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    for x, y in centers:
        draw.ellipse((x - 36, y - 36, x + 36, y + 36), fill=(*EMBER_SOFT, int(42 * intensity)))
        draw.ellipse((x - 20, y - 20, x + 20, y + 20), fill=(*EMBER, int(75 * intensity)))
        draw.ellipse((x - 9, y - 9, x + 9, y + 9), fill=(*EMBER_CORE, int(130 * intensity)))
    glow = glow.filter(ImageFilter.GaussianBlur(7))
    out = Image.alpha_composite(glow, mark)
    sharp = Image.new("RGBA", mark.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sharp)
    for x, y in centers:
        sd.ellipse((x - 3, y - 3, x + 3, y + 3), fill=(*EMBER_CORE, int(220 * intensity)))
    return Image.alpha_composite(out, sharp)


def scatter_particles(canvas: Image.Image, *, count: int, spread: float, seed: int) -> Image.Image:
    rng = random.Random(seed)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    for _ in range(count):
        x = rng.randint(int(W * 0.06), int(W * 0.94))
        y = rng.randint(int(H * 0.52), int(H * 0.96))
        r = rng.uniform(0.6, 2.4) * spread
        a = int(rng.randint(35, 100) * spread)
        c = EMBER_CORE if rng.random() > 0.4 else EMBER
        draw.ellipse((x - r, y - r, x + r, y + r), fill=(*c, a))
    layer = layer.filter(ImageFilter.GaussianBlur(rng.uniform(1.0, 2.0)))
    return Image.alpha_composite(canvas, layer)


def floor_reflection(
    canvas: Image.Image,
    mark: Image.Image,
    pos: tuple[int, int],
    floor_y: int,
    *,
    strength: float,
) -> Image.Image:
    x, y = pos
    chin = y + int(mark.height * 0.88)
    visible_h = min(mark.height, max(0, chin - floor_y + int(mark.height * 0.08)))
    if visible_h <= 0:
        return canvas
    crop = mark.crop((0, mark.height - visible_h, mark.width, mark.height))
    refl = ImageEnhance.Brightness(crop.transpose(Image.Transpose.FLIP_TOP_BOTTOM)).enhance(0.32)
    fade = Image.new("L", refl.size, 255)
    fpx = fade.load()
    for row in range(refl.height):
        t = int(255 * (1 - row / max(1, refl.height - 1)) ** 1.5 * strength)
        for col in range(refl.width):
            fpx[col, row] = t
    refl.putalpha(fade)
    refl = refl.filter(ImageFilter.GaussianBlur(2.5))
    canvas.alpha_composite(refl, (x, floor_y - 2))
    return canvas


def finish(canvas: Image.Image) -> Image.Image:
    rng = random.Random(11)
    noise = Image.new("RGBA", (W, H))
    npx = noise.load()
    for y in range(H):
        for x in range(W):
            v = rng.randint(0, 255)
            npx[x, y] = (v, v, v, int(255 * 0.01 * (0.5 + abs(v - 128) / 128)))
    noise = noise.filter(ImageFilter.GaussianBlur(0.35))
    return Image.alpha_composite(canvas, noise).convert("RGB")


def compose(
    line_art: Image.Image,
    *,
    height: int,
    center: tuple[int, int],
    line_glow_strength: float,
    ember: float,
    warmth: float,
    floor: float,
    particles: int,
    particle_spread: float,
    seed: int,
) -> Image.Image:
    canvas = build_background(warmth=warmth)
    canvas, floor_y = add_floor_plane(canvas, strength=floor)
    canvas = scatter_particles(canvas, count=particles, spread=particle_spread, seed=seed)

    mark = prepare_mark(line_art, height)
    mark = ember_bloom(mark, intensity=ember)

    x = center[0] - mark.width // 2
    y = center[1] - mark.height // 2

    canvas.alpha_composite(line_glow(mark, strength=line_glow_strength), (x, y))
    canvas.alpha_composite(mark, (x, y))
    canvas = floor_reflection(canvas, mark, (x, y), floor_y, strength=floor)
    return finish(canvas)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    line_art = extract_line_art(Image.open(MANTIS_SRC))

    compose(
        line_art,
        height=568,
        center=(CX, CY + 6),
        line_glow_strength=1.0,
        ember=1.0,
        warmth=1.0,
        floor=1.0,
        particles=48,
        particle_spread=1.0,
        seed=19,
    ).save(OUT / "v2-a-reference.png", optimize=True)

    compose(
        line_art,
        height=582,
        center=(CX, CY + 2),
        line_glow_strength=1.15,
        ember=0.92,
        warmth=0.95,
        floor=0.9,
        particles=38,
        particle_spread=0.92,
        seed=23,
    ).save(OUT / "v2-b-larger.png", optimize=True)

    compose(
        line_art,
        height=560,
        center=(CX, CY + 8),
        line_glow_strength=0.95,
        ember=1.1,
        warmth=1.06,
        floor=1.12,
        particles=58,
        particle_spread=1.05,
        seed=31,
    ).save(OUT / "v2-c-atmosphere.png", optimize=True)

    for name in ("v2-a-reference", "v2-b-larger", "v2-c-atmosphere"):
        im = Image.open(OUT / f"{name}.png")
        im.resize((504, 264), Image.Resampling.LANCZOS).save(
            OUT / f"{name}-504w.png", optimize=True
        )

    print("Wrote", OUT)


if __name__ == "__main__":
    main()
