#!/usr/bin/env python3
"""Compose three OG image concepts for Imbas — brand design pass."""

from __future__ import annotations

import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "brand-assets-preview" / "og-concepts"
FONTS = OUT / "fonts"
SRC = Path(
    "/Users/brendan/.cursor/projects/Users-brendan-Documents-Claude-Projects-Imbas/assets/"
    "mantis_full_cropped-d827254c-fec0-4372-8fba-2f60c1bb6b0c.png"
)

W, H = 1200, 630

# Site palette
BG_DEEP = (15, 13, 11)
BG_BASE = (27, 24, 20)
INK_LUMINOUS = (252, 248, 236)
INK_PRIMARY = (237, 232, 220)
INK_SOFT = (212, 207, 194)
INK_SECONDARY = (148, 160, 180)
INK_MUTED = (110, 118, 136)
EMBER = (222, 111, 56)
EMBER_SOFT = (240, 143, 88)
SLATE = (110, 150, 195)
LINE = (237, 228, 210)


def load_font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(FONTS / name), size)


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


def add_grain(im: Image.Image, strength: float = 0.035) -> Image.Image:
    rng = random.Random(42)
    noise = Image.new("RGBA", im.size)
    npx = noise.load()
    for y in range(im.height):
        for x in range(im.width):
            v = rng.randint(0, 255)
            a = int(255 * strength * (0.35 + 0.65 * abs(v - 128) / 128))
            npx[x, y] = (v, v, v, a)
    noise = noise.filter(ImageFilter.GaussianBlur(0.6))
    return Image.alpha_composite(im.convert("RGBA"), noise)


def vignette(im: Image.Image, strength: float = 0.55) -> Image.Image:
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    cx, cy = im.width // 2, im.height // 2
    draw.ellipse(
        (cx - im.width * 0.72, cy - im.height * 0.85, cx + im.width * 0.72, cy + im.height * 0.85),
        fill=(0, 0, 0, int(255 * strength)),
    )
    layer = layer.filter(ImageFilter.GaussianBlur(90))
    return Image.alpha_composite(im.convert("RGBA"), layer)


def atmosphere_observatory() -> Image.Image:
    """Dark mineral field with observatory lighting — not a flat fill."""
    base = Image.new("RGBA", (W, H), (*BG_DEEP, 255))

    # Warm ember pool beneath specimen
    base = Image.alpha_composite(
        base,
        glow_ellipse((W, H), (W // 2 + 20, H - 40), (420, 180), EMBER, 22, 80),
    )
    base = Image.alpha_composite(
        base,
        glow_ellipse((W, H), (W // 2, H // 2 + 40), (280, 320), EMBER_SOFT, 14, 60),
    )

    # Cool slate atmosphere — frontier / nocturnal read
    base = Image.alpha_composite(
        base,
        glow_ellipse((W, H), (180, 80), (320, 220), SLATE, 16, 100),
    )
    base = Image.alpha_composite(
        base,
        glow_ellipse((W, H), (W - 160, 90), (300, 200), SLATE, 12, 90),
    )

    # Specimen spotlight from above
    base = Image.alpha_composite(
        base,
        glow_ellipse((W, H), (W // 2, 120), (220, 280), INK_LUMINOUS, 10, 70),
    )

    # Subtle base lift
    draw = ImageDraw.Draw(base)
    for y in range(H):
        t = y / H
        overlay = Image.new("RGBA", (W, 1), (*BG_BASE, int(18 * t)))
        base.paste(overlay, (0, y))

    # Instrument horizon
    draw = ImageDraw.Draw(base)
    draw.line((0, 548, W, 548), fill=(*LINE, 18), width=1)
    draw.line((0, 549, W, 549), fill=(*SLATE, 8), width=1)

    return base


def atmosphere_split() -> Image.Image:
    base = atmosphere_observatory()
    draw = ImageDraw.Draw(base)
    # Left panel lift — specimen chamber
    panel = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(panel)
    pd.rectangle((0, 0, 560, H), fill=(*BG_BASE, 38))
    panel = panel.filter(ImageFilter.GaussianBlur(1))
    base = Image.alpha_composite(base, panel)
    # Vertical seam
    draw = ImageDraw.Draw(base)
    draw.line((560, 48, 560, H - 48), fill=(*LINE, 28), width=1)
    draw.line((561, 48, 561, H - 48), fill=(*SLATE, 10), width=1)
    return base


def atmosphere_editorial() -> Image.Image:
    base = atmosphere_observatory()
    # Stronger top-down editorial light for stacked layout
    base = Image.alpha_composite(
        base,
        glow_ellipse((W, H), (W // 2, 0), (500, 260), INK_LUMINOUS, 8, 85),
    )
    return base


def ember_tips(mantis: Image.Image) -> Image.Image:
    rgba = mantis.convert("RGBA")
    glow = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    w, h = rgba.size
    tips = [(int(w * 0.021), int(h * 0.020)), (int(w * 0.977), int(h * 0.020))]
    for x, y in tips:
        draw.ellipse((x - 22, y - 22, x + 22, y + 22), fill=(*EMBER, 16))
        draw.ellipse((x - 10, y - 10, x + 10, y + 10), fill=(*EMBER_SOFT, 24))
    glow = glow.filter(ImageFilter.GaussianBlur(8))
    return Image.alpha_composite(rgba, glow)


def paste_mantis(
    canvas: Image.Image,
    mantis: Image.Image,
    *,
    height: int,
    center: tuple[int, int],
    shadow: bool = False,
) -> Image.Image:
    art = ember_tips(mantis)
    box = content_box(art, pad=8)
    art = art.crop(box)
    scale = height / art.height
    resized = art.resize(
        (max(1, int(art.width * scale)), height),
        Image.Resampling.LANCZOS,
    )
    x = center[0] - resized.width // 2
    y = center[1] - resized.height // 2
    out = canvas.copy()
    if shadow:
        shadow_layer = Image.new("RGBA", out.size, (0, 0, 0, 0))
        mask = resized.split()[3]
        silhouette = Image.new("RGBA", resized.size, (0, 0, 0, 55))
        silhouette.putalpha(mask)
        shadow_layer.paste(silhouette, (x + 6, y + 12), silhouette)
        shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(18))
        out = Image.alpha_composite(out, shadow_layer)
    out.alpha_composite(resized, (x, y))
    return out, resized, (x, y)


def gradient_text(
    text: str,
    font: ImageFont.FreeTypeFont,
    width: int,
    top: tuple[int, int, int],
    bottom: tuple[int, int, int],
) -> Image.Image:
    bbox = font.getbbox(text)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad = 8
    layer = Image.new("RGBA", (tw + pad * 2, th + pad * 2), (0, 0, 0, 0))
    mask = Image.new("L", layer.size, 0)
    ImageDraw.Draw(mask).text((pad - bbox[0], pad - bbox[1]), text, fill=255, font=font)
    grad = Image.new("RGBA", layer.size)
    gpx = grad.load()
    for y in range(grad.height):
        t = y / max(1, grad.height - 1)
        r = int(top[0] * (1 - t) + bottom[0] * t)
        g = int(top[1] * (1 - t) + bottom[1] * t)
        b = int(top[2] * (1 - t) + bottom[2] * t)
        for x in range(grad.width):
            gpx[x, y] = (r, g, b, 255)
    grad.putalpha(mask)
    return grad


def finish(canvas: Image.Image) -> Image.Image:
    canvas = vignette(canvas, strength=0.42)
    canvas = add_grain(canvas, strength=0.028)
    return canvas.convert("RGB")


def concept_1_pure_symbol(mantis: Image.Image) -> Image.Image:
    """Specimen on the observatory floor — symbol as institution mark."""
    canvas = atmosphere_observatory()
    canvas, resized, (x, y) = paste_mantis(
        canvas,
        mantis,
        height=530,
        center=(W // 2 - 36, H // 2 + 18),
    )
    # Floor reflection — mantis only, not UI card shadow
    refl = ImageEnhance.Brightness(resized.transpose(Image.Transpose.FLIP_TOP_BOTTOM)).enhance(0.22)
    refl.putalpha(36)
    refl = refl.filter(ImageFilter.GaussianBlur(2))
    canvas.alpha_composite(refl, (x, y + resized.height - 12))
    return finish(canvas)


def concept_2_symbol_wordmark(mantis: Image.Image) -> Image.Image:
    """Split chamber: symbol left, IMBAS wordmark right."""
    canvas = atmosphere_split()
    canvas, _, _ = paste_mantis(canvas, mantis, height=470, center=(278, H // 2 + 6))

    word = gradient_text(
        "IMBAS",
        load_font("Fraunces-Regular.ttf", 132),
        W,
        INK_LUMINOUS,
        (180, 196, 220),
    )
    canvas.alpha_composite(word, (620, H // 2 - 95))

    label = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(label)
    mono = load_font("JetBrainsMono-Regular.ttf", 15)
    d.text((624, H // 2 + 62), "IMBAS LABS", fill=(*INK_MUTED, 220), font=mono)
    d.text((624, H // 2 + 88), "Frontier AI behavior · measured", fill=(*INK_SECONDARY, 180), font=mono)
    canvas = Image.alpha_composite(canvas, label)

    return finish(canvas)


def concept_3_symbol_tagline(mantis: Image.Image) -> Image.Image:
    """Editorial stack: symbol, wordmark, positioning line."""
    canvas = atmosphere_editorial()
    canvas, _, _ = paste_mantis(canvas, mantis, height=300, center=(W // 2, 172))

    word = gradient_text(
        "IMBAS",
        load_font("Fraunces-Regular.ttf", 108),
        W,
        INK_LUMINOUS,
        INK_PRIMARY,
    )
    canvas.alpha_composite(word, (W // 2 - word.width // 2, 300))

    tag = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(tag)
    italic = load_font("Fraunces-Italic.ttf", 36)
    line = "Inspect what AI surfaces — and what it leaves out."
    bbox = italic.getbbox(line)
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) // 2, 430), line, fill=(*INK_SOFT, 235), font=italic)

    mono = load_font("JetBrainsMono-Regular.ttf", 14)
    sub = "Measuring frontier AI behavior"
    sb = mono.getbbox(sub)
    sw = sb[2] - sb[0]
    d.text(((W - sw) // 2, 488), sub, fill=(*INK_MUTED, 200), font=mono)
    canvas = Image.alpha_composite(canvas, tag)

    return finish(canvas)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    mantis = normalize_mantis()

    c1 = concept_1_pure_symbol(mantis)
    c2 = concept_2_symbol_wordmark(mantis)
    c3 = concept_3_symbol_tagline(mantis)

    c1.save(OUT / "concept-1-pure-symbol.png", optimize=True)
    c2.save(OUT / "concept-2-symbol-wordmark.png", optimize=True)
    c3.save(OUT / "concept-3-symbol-tagline.png", optimize=True)
    print("Wrote 3 OG concepts to", OUT)


if __name__ == "__main__":
    main()
