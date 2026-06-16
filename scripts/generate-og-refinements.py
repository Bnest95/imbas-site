#!/usr/bin/env python3
"""Three refinements of the pure-symbol OG direction (Concept 1)."""

from __future__ import annotations

import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "brand-assets-preview" / "og-refinements"
SRC = Path(
    "/Users/brendan/.cursor/projects/Users-brendan-Documents-Claude-Projects-Imbas/assets/"
    "mantis_full_cropped-d827254c-fec0-4372-8fba-2f60c1bb6b0c.png"
)

W, H = 1200, 630
CX, CY = W // 2, H // 2

BG_DEEP = (15, 13, 11)
BG_BASE = (27, 24, 20)
BG_WARM = (22, 18, 15)
INK_LUMINOUS = (252, 248, 236)
EMBER = (222, 111, 56)
EMBER_SOFT = (240, 143, 88)
EMBER_TRACE = (222, 111, 56)
LINE = (237, 228, 210)


def normalize_mantis() -> Image.Image:
    im = Image.open(SRC).convert("RGBA")
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if abs(r - 42) + abs(g - 32) + abs(b - 30) < 36:
                px[x, y] = (*BG_DEEP, 255)
    return im


def content_box(im: Image.Image, pad: int = 0) -> tuple[int, int, int, int]:
    bg = Image.new("RGBA", im.size, (*BG_DEEP, 255))
    bbox = ImageChops.difference(im, bg).getbbox()
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


def vertical_warmth() -> Image.Image:
    """Editorial dark-brown lift — not flat black."""
    base = Image.new("RGBA", (W, H), (*BG_DEEP, 255))
    grad = Image.new("RGBA", (W, H))
    px = grad.load()
    for y in range(H):
        t = y / (H - 1)
        # Quiet warm floor, deep top
        r = int(BG_DEEP[0] + (BG_WARM[0] - BG_DEEP[0]) * (t**1.6))
        g = int(BG_DEEP[1] + (BG_WARM[1] - BG_DEEP[1]) * (t**1.6))
        b = int(BG_DEEP[2] + (BG_WARM[2] - BG_DEEP[2]) * (t**1.6))
        for x in range(W):
            px[x, y] = (r, g, b, 255)
    return Image.alpha_composite(base, grad)


def add_grain(im: Image.Image, strength: float = 0.022) -> Image.Image:
    rng = random.Random(7)
    noise = Image.new("RGBA", im.size)
    npx = noise.load()
    for y in range(im.height):
        for x in range(im.width):
            v = rng.randint(0, 255)
            a = int(255 * strength * (0.4 + 0.6 * abs(v - 128) / 128))
            npx[x, y] = (v, v, v, a)
    noise = noise.filter(ImageFilter.GaussianBlur(0.5))
    return Image.alpha_composite(im.convert("RGBA"), noise)


def edge_vignette(im: Image.Image, strength: float, spread: float) -> Image.Image:
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.ellipse(
        (
            CX - W * spread,
            CY - H * spread * 1.05,
            CX + W * spread,
            CY + H * spread * 1.05,
        ),
        fill=(0, 0, 0, int(255 * strength)),
    )
    layer = layer.filter(ImageFilter.GaussianBlur(85))
    return Image.alpha_composite(im.convert("RGBA"), layer)


def ember_tips(mantis: Image.Image, *, intensity: float = 1.0) -> Image.Image:
    rgba = mantis.convert("RGBA")
    glow = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    w, h = rgba.size
    tips = [(int(w * 0.021), int(h * 0.020)), (int(w * 0.977), int(h * 0.020))]
    outer_a = int(11 * intensity)
    inner_a = int(18 * intensity)
    for x, y in tips:
        draw.ellipse((x - 16, y - 16, x + 16, y + 16), fill=(*EMBER, outer_a))
        draw.ellipse((x - 7, y - 7, x + 7, y + 7), fill=(*EMBER_SOFT, inner_a))
    glow = glow.filter(ImageFilter.GaussianBlur(5))
    return Image.alpha_composite(rgba, glow)


def prepare_mantis(mantis: Image.Image, height: int, intensity: float = 1.0) -> Image.Image:
    art = ember_tips(mantis, intensity=intensity)
    box = content_box(art, pad=6)
    art = art.crop(box)
    scale = height / art.height
    return art.resize(
        (max(1, int(art.width * scale)), height),
        Image.Resampling.LANCZOS,
    )


def place_mantis(
    canvas: Image.Image,
    resized: Image.Image,
    *,
    center: tuple[int, int] = (CX, CY),
) -> tuple[Image.Image, tuple[int, int]]:
    x = center[0] - resized.width // 2
    y = center[1] - resized.height // 2
    out = canvas.copy()
    out.alpha_composite(resized, (x, y))
    return out, (x, y)


def floor_reflection(canvas: Image.Image, resized: Image.Image, pos: tuple[int, int], alpha: int = 28) -> Image.Image:
    x, y = pos
    refl = ImageEnhance.Brightness(resized.transpose(Image.Transpose.FLIP_TOP_BOTTOM)).enhance(0.18)
    refl.putalpha(alpha)
    refl = refl.filter(ImageFilter.GaussianBlur(1.5))
    canvas.alpha_composite(refl, (x, y + resized.height - 8))
    return canvas


def head_presence(resized: Image.Image) -> Image.Image:
    """Subtle local lift behind the head — depth without a pasted look."""
    w, h = resized.size
    halo = Image.new("RGBA", resized.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(halo)
    draw.ellipse((w * 0.18, h * 0.08, w * 0.82, h * 0.62), fill=(*INK_LUMINOUS, 16))
    halo = halo.filter(ImageFilter.GaussianBlur(18))
    return Image.alpha_composite(halo, resized)


def finish(im: Image.Image, *, grain: float = 0.022) -> Image.Image:
    return add_grain(im, strength=grain).convert("RGB")


def refinement_a_monolith(mantis: Image.Image) -> Image.Image:
    """
    Largest mark, dead center, maximum negative space.
    Depth from warmth gradient + tight head halo only.
    """
    canvas = vertical_warmth()
    canvas = Image.alpha_composite(
        canvas,
        glow_ellipse((W, H), (CX, CY - 30), (190, 240), INK_LUMINOUS, 7, 55),
    )
    resized = head_presence(prepare_mantis(mantis, height=592, intensity=0.85))
    canvas, pos = place_mantis(canvas, resized, center=(CX, CY + 4))
    canvas = edge_vignette(canvas, strength=0.28, spread=0.62)
    return finish(canvas, grain=0.018)


def refinement_b_specimen(mantis: Image.Image) -> Image.Image:
    """
    Large centered mark with quiet floor plane and reflection.
    Restrained ember pool anchors the icon without decoration.
    """
    canvas = vertical_warmth()
    canvas = Image.alpha_composite(
        canvas,
        glow_ellipse((W, H), (CX, H - 52), (300, 95), EMBER, 10, 70),
    )
    canvas = Image.alpha_composite(
        canvas,
        glow_ellipse((W, H), (CX, CY - 20), (210, 260), INK_LUMINOUS, 8, 60),
    )
    draw = ImageDraw.Draw(canvas)
    draw.line((120, 556, W - 120, 556), fill=(*LINE, 14), width=1)

    resized = head_presence(prepare_mantis(mantis, height=578, intensity=1.0))
    canvas, pos = place_mantis(canvas, resized, center=(CX, CY - 6))
    canvas = floor_reflection(canvas, resized, pos, alpha=22)
    canvas = edge_vignette(canvas, strength=0.34, spread=0.58)
    return finish(canvas, grain=0.022)


def refinement_c_preview(mantis: Image.Image) -> Image.Image:
    """
    Thumbnail-first: strong center contrast, darker edges,
    mark reads at ~300px link-preview width.
    """
    canvas = vertical_warmth()
    # Center lift for small-preview legibility
    canvas = Image.alpha_composite(
        canvas,
        glow_ellipse((W, H), (CX, CY), (360, 300), INK_LUMINOUS, 9, 75),
    )
    canvas = Image.alpha_composite(
        canvas,
        glow_ellipse((W, H), (CX, H - 70), (240, 80), EMBER, 8, 55),
    )

    resized = prepare_mantis(mantis, height=586, intensity=0.9)
    # Slight contrast lift on artwork only
    rgb = ImageEnhance.Contrast(ImageEnhance.Brightness(resized).enhance(1.04)).enhance(1.06)
    rgba = rgb.convert("RGBA")
    rgba.putalpha(resized.split()[3])
    resized = head_presence(rgba)

    canvas, pos = place_mantis(canvas, resized, center=(CX, CY))
    canvas = floor_reflection(canvas, resized, pos, alpha=16)
    canvas = edge_vignette(canvas, strength=0.42, spread=0.52)
    return finish(canvas, grain=0.02)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    mantis = normalize_mantis()

    refinement_a_monolith(mantis).save(OUT / "refinement-a-monolith.png", optimize=True)
    refinement_b_specimen(mantis).save(OUT / "refinement-b-specimen.png", optimize=True)
    refinement_c_preview(mantis).save(OUT / "refinement-c-preview.png", optimize=True)

    # Small-preview simulation for review
    for name in ("refinement-a-monolith", "refinement-b-specimen", "refinement-c-preview"):
        im = Image.open(OUT / f"{name}.png")
        im.resize((504, 264), Image.Resampling.LANCZOS).save(
            OUT / f"{name}-at-504w.png", optimize=True
        )

    print("Wrote refinements to", OUT)


if __name__ == "__main__":
    main()
