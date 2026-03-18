"""
generate_icons.py — Loadout app icon generator

Generates Android launcher PNGs at all required densities using Pillow.
No SVG renderer required — the icon is drawn directly via PIL drawing primitives.

Run from the project root:
    python infra/generate_icons.py

Requires:
    pip install Pillow
"""

import os
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

# ---------------------------------------------------------------------------
# Project root — resolve relative to this script's location
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
RES_DIR = PROJECT_ROOT / "frontend" / "android" / "app" / "src" / "main" / "res"

# ---------------------------------------------------------------------------
# Output targets
# ---------------------------------------------------------------------------
LAUNCHER_TARGETS = [
    (48,   RES_DIR / "mipmap-mdpi"),
    (72,   RES_DIR / "mipmap-hdpi"),
    (96,   RES_DIR / "mipmap-xhdpi"),
    (144,  RES_DIR / "mipmap-xxhdpi"),
    (192,  RES_DIR / "mipmap-xxxhdpi"),
]

FOREGROUND_TARGET = (1024, RES_DIR / "drawable")

# ---------------------------------------------------------------------------
# Design constants (all defined at 1024px scale, scaled linearly)
# ---------------------------------------------------------------------------
CANVAS = 1024

# Background gradient stops  (indigo center → violet edges → subtle darker ring)
BG_GRADIENT_STOPS = [
    (0.00, (55,  48, 163)),   # #3730a3  deep indigo
    (0.65, (79,  62, 184)),   # midpoint blend
    (0.88, (124, 58, 237)),   # #7c3aed  violet-purple
    (1.00, (91,  33, 182)),   # #5b21b6  darker outer ring
]

# Mark dimensions (at 1024px scale)
ARM_HALF_WIDTH   = 40    # half of 80px arm width
ARM_V_REACH      = 400   # top/bottom arm: tip distance from center (vertical)
ARM_H_REACH      = 370   # left/right arm: tip distance from center (horizontal)
ARM_INNER_OFFSET = 60    # arm starts this far from center
CENTER_RADIUS    = 55    # center circle radius
TIP_DOT_RADIUS   = 20    # tip dot radius
MARK_OPACITY     = 0.90  # white mark opacity

# Glow parameters (at 1024px scale)
GLOW_RADIUS      = 180   # radial extent of inner glow
GLOW_BLUR        = 60    # gaussian blur sigma for glow
GLOW_OPACITY     = 0.22  # peak opacity of glow


# ---------------------------------------------------------------------------
# Helper: lerp between two RGB colours
# ---------------------------------------------------------------------------
def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def gradient_color_at(t, stops):
    """Return interpolated RGB for position t in [0,1] given gradient stops."""
    t = max(0.0, min(1.0, t))
    for i in range(len(stops) - 1):
        t0, c0 = stops[i]
        t1, c1 = stops[i + 1]
        if t0 <= t <= t1:
            local_t = (t - t0) / (t1 - t0) if t1 != t0 else 0
            return lerp_color(c0, c1, local_t)
    return stops[-1][1]


# ---------------------------------------------------------------------------
# Build radial gradient background image (RGBA, size x size)
# ---------------------------------------------------------------------------
def make_background(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pixels = img.load()
    cx = cy = size / 2.0
    max_r = size / 2.0
    for y in range(size):
        for x in range(size):
            dx = x - cx
            dy = y - cy
            r = math.sqrt(dx * dx + dy * dy)
            t = r / max_r
            color = gradient_color_at(t, BG_GRADIENT_STOPS)
            pixels[x, y] = color + (255,)
    return img


# ---------------------------------------------------------------------------
# Build the compass mark as an RGBA image (white mark on transparent bg)
# size: output pixel dimension
# Returns RGBA image with the compass mark only.
# ---------------------------------------------------------------------------
def make_mark(size):
    scale = size / CANVAS
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx = cy = size / 2.0
    alpha = int(255 * MARK_OPACITY)
    white = (255, 255, 255, alpha)

    def s(v):
        """Scale a design value from 1024-canvas to output size."""
        return v * scale

    # ── Vertical arm (top) ──────────────────────────────────────────────────
    # Spans from (cy - ARM_V_REACH) to (cy - ARM_INNER_OFFSET), centred on cx
    top_arm_rect = [
        cx - s(ARM_HALF_WIDTH),
        cy - s(ARM_V_REACH),
        cx + s(ARM_HALF_WIDTH),
        cy - s(ARM_INNER_OFFSET),
    ]
    draw.rounded_rectangle(top_arm_rect, radius=s(ARM_HALF_WIDTH), fill=white)

    # ── Vertical arm (bottom) ───────────────────────────────────────────────
    bot_arm_rect = [
        cx - s(ARM_HALF_WIDTH),
        cy + s(ARM_INNER_OFFSET),
        cx + s(ARM_HALF_WIDTH),
        cy + s(ARM_V_REACH),
    ]
    draw.rounded_rectangle(bot_arm_rect, radius=s(ARM_HALF_WIDTH), fill=white)

    # ── Horizontal arm (left) ───────────────────────────────────────────────
    left_arm_rect = [
        cx - s(ARM_H_REACH),
        cy - s(ARM_HALF_WIDTH),
        cx - s(ARM_INNER_OFFSET),
        cy + s(ARM_HALF_WIDTH),
    ]
    draw.rounded_rectangle(left_arm_rect, radius=s(ARM_HALF_WIDTH), fill=white)

    # ── Horizontal arm (right) ──────────────────────────────────────────────
    right_arm_rect = [
        cx + s(ARM_INNER_OFFSET),
        cy - s(ARM_HALF_WIDTH),
        cx + s(ARM_H_REACH),
        cy + s(ARM_HALF_WIDTH),
    ]
    draw.rounded_rectangle(right_arm_rect, radius=s(ARM_HALF_WIDTH), fill=white)

    # ── Center circle ───────────────────────────────────────────────────────
    cr = s(CENTER_RADIUS)
    draw.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=white)

    # ── Tip dots ────────────────────────────────────────────────────────────
    tr = s(TIP_DOT_RADIUS)
    # Tip dot centers: inset from the extreme tip by TIP_DOT_RADIUS so the
    # dot is visually centered on the rounded cap center.
    tip_center_offset_v = s(ARM_V_REACH - ARM_HALF_WIDTH)   # vertical tips
    tip_center_offset_h = s(ARM_H_REACH - ARM_HALF_WIDTH)   # horizontal tips

    # Top tip
    draw.ellipse([cx - tr, cy - tip_center_offset_v - tr,
                  cx + tr, cy - tip_center_offset_v + tr], fill=white)
    # Bottom tip
    draw.ellipse([cx - tr, cy + tip_center_offset_v - tr,
                  cx + tr, cy + tip_center_offset_v + tr], fill=white)
    # Left tip
    draw.ellipse([cx - tip_center_offset_h - tr, cy - tr,
                  cx - tip_center_offset_h + tr, cy + tr], fill=white)
    # Right tip
    draw.ellipse([cx + tip_center_offset_h - tr, cy - tr,
                  cx + tip_center_offset_h + tr, cy + tr], fill=white)

    return img


# ---------------------------------------------------------------------------
# Build soft inner glow as a blurred radial white halo (RGBA)
# ---------------------------------------------------------------------------
def make_glow(size):
    scale = size / CANVAS
    glow_r = int(GLOW_RADIUS * scale)
    blur_sigma = max(1, int(GLOW_BLUR * scale))

    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    cx = cy = size // 2

    # Draw a soft white radial circle that we'll blur
    glow_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow_img)

    # Build concentric circles from outside in for a radial falloff
    steps = 30
    for i in range(steps, 0, -1):
        t = i / steps                          # 1 at edge, ~0 at center
        r = int(glow_r * t)
        alpha = int(255 * GLOW_OPACITY * (1 - t))  # brightest at center
        gd.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=(255, 255, 255, alpha),
        )

    # Blur for the soft-glow effect
    glow_blurred = glow_img.filter(ImageFilter.GaussianBlur(radius=blur_sigma))
    img.paste(glow_blurred, (0, 0), glow_blurred)
    return img


# ---------------------------------------------------------------------------
# Compose the full icon (background + glow + mark)
# ---------------------------------------------------------------------------
def make_full_icon(size):
    bg   = make_background(size)
    glow = make_glow(size)
    mark = make_mark(size)

    # Composite: background → glow → mark
    result = bg.copy()
    result = Image.alpha_composite(result, glow)
    result = Image.alpha_composite(result, mark)
    return result.convert("RGBA")


# ---------------------------------------------------------------------------
# Save helper
# ---------------------------------------------------------------------------
def save_png(img, path):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(path), "PNG", optimize=True)
    print(f"  Saved: {path.relative_to(PROJECT_ROOT)}  ({img.size[0]}x{img.size[1]})")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("Loadout Icon Generator")
    print("=" * 50)

    # ── Launcher icons (square, all densities) ─────────────────────────────
    print("\nGenerating launcher icons...")
    for size, folder in LAUNCHER_TARGETS:
        icon = make_full_icon(size)
        save_png(icon, folder / "ic_launcher.png")
        save_png(icon, folder / "ic_launcher_round.png")

    # ── Adaptive icon foreground (1024px, mark on transparent bg) ──────────
    print("\nGenerating adaptive icon foreground layer (1024x1024, transparent bg)...")
    size, folder = FOREGROUND_TARGET
    foreground = make_mark(size)
    save_png(foreground, folder / "ic_launcher_foreground.png")

    print("\nDone. All icons generated successfully.")


if __name__ == "__main__":
    main()

