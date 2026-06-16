#!/usr/bin/env python3
"""Generate temporary brand assets from the mantis source artwork."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(
    "/Users/brendan/.cursor/projects/Users-brendan-Documents-Claude-Projects-Imbas/assets/"
    "mantis_full_cropped-d827254c-fec0-4372-8fba-2f60c1bb6b0c.png"
)
PREVIEW = ROOT / "brand-assets-preview"

# Site palette (--bg-deep, --ember)
BG = (15, 13, 11)
EMBER = (222, 111, 56)


def load_normalized() -> Image.Image:
    im = Image.open(SRC).convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if abs(r - 42) + abs(g - 32) + abs(b - 30) < 36:
                px[x, y] = (*BG, 255)
    return im


def content_box(im: Image.Image, pad: int = 0) -> tuple[int, int, int, int]:
    bg = Image.new("RGBA", im.size, (*BG, 255))
    diff = ImageChops.difference(im, bg)
    bbox = diff.getbbox()
    if not bbox:
        return 0, 0, im.width, im.height
    x0, y0, x1, y1 = bbox
    return (
        max(0, x0 - pad),
        max(0, y0 - pad),
        min(im.width, x1 + pad),
        min(im.height, y1 + pad),
    )


def fit_on_canvas(
    im: Image.Image,
    size: tuple[int, int],
    *,
    fill: float = 0.82,
    crop_box: tuple[int, int, int, int] | None = None,
) -> Image.Image:
    canvas = Image.new("RGBA", size, (*BG, 255))
    art = im.crop(crop_box) if crop_box else im
    box = content_box(art, pad=8)
    art = art.crop(box)
    target_w = int(size[0] * fill)
    target_h = int(size[1] * fill)
    scale = min(target_w / art.width, target_h / art.height)
    resized = art.resize(
        (max(1, int(art.width * scale)), max(1, int(art.height * scale))),
        Image.Resampling.LANCZOS,
    )
    x = (size[0] - resized.width) // 2
    y = (size[1] - resized.height) // 2
    canvas.alpha_composite(resized, (x, y))
    return canvas.convert("RGB")


def add_ember_glow(im: Image.Image) -> Image.Image:
    """Barely perceptible warm signal at antenna tips only."""
    rgba = im.convert("RGBA")
    glow = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    w, h = rgba.size
    # Antenna tips from source artwork analysis (normalized coords).
    tips = [(int(w * 0.021), int(h * 0.020)), (int(w * 0.977), int(h * 0.020))]
    for x, y in tips:
        draw.ellipse((x - 18, y - 18, x + 18, y + 18), fill=(*EMBER, 18))
        draw.ellipse((x - 8, y - 8, x + 8, y + 8), fill=(*EMBER, 28))
    glow = glow.filter(ImageFilter.GaussianBlur(radius=6))
    return Image.alpha_composite(rgba, glow).convert("RGB")


def save_favicon(im: Image.Image, path: Path, preview_dir: Path) -> None:
    # Head-focused crop keeps eyes readable at 16px.
    box = content_box(im, pad=12)
    x0, y0, x1, y1 = box
    head_h = y1 - y0
    crop = im.crop((x0, y0, x1, y0 + int(head_h * 0.72)))
    square = fit_on_canvas(crop, (256, 256), fill=0.92).convert("RGBA")
    sizes = [16, 32, 48]
    square.resize((48, 48), Image.Resampling.LANCZOS).save(
        path,
        format="ICO",
        sizes=[(s, s) for s in sizes],
    )
    square.resize((128, 128), Image.Resampling.LANCZOS).save(preview_dir / "favicon-preview-128.png")


def main() -> None:
    PREVIEW.mkdir(exist_ok=True)
    src = load_normalized()
    full_box = content_box(src, pad=16)

    og_plain = fit_on_canvas(src, (1200, 630), fill=0.78, crop_box=full_box)
    og_ember = add_ember_glow(og_plain)
    icon_plain = fit_on_canvas(src, (180, 180), fill=0.86, crop_box=full_box)
    icon_ember = add_ember_glow(icon_plain)

    og_plain.save(PREVIEW / "og-image-plain.png")
    og_ember.save(PREVIEW / "og-image-ember.png")
    icon_plain.save(PREVIEW / "apple-touch-icon-plain.png")
    icon_ember.save(PREVIEW / "apple-touch-icon-ember.png")

    # Production: plain artwork (line art stays primary; source already has ember tips).
    og_plain.save(ROOT / "og-image.png")
    icon_plain.save(ROOT / "apple-touch-icon.png")
    save_favicon(src, ROOT / "favicon.ico", PREVIEW)

    # Optional ember variants alongside production for review.
    og_ember.save(PREVIEW / "og-image-production-ember-alt.png")
    icon_ember.save(PREVIEW / "apple-touch-icon-production-ember-alt.png")

    print("Generated production assets and preview variants.")


if __name__ == "__main__":
    main()
