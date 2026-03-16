/**
 * generate_icons.mjs — LifePlan app icon generator (pure Node.js, no dependencies)
 *
 * Generates Android launcher PNGs at all required densities.
 * Run from project root:
 *   node infra/generate_icons.mjs
 */

import { createWriteStream, mkdirSync } from "fs";
import { deflateSync } from "zlib";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const RES = join(PROJECT_ROOT, "frontend/android/app/src/main/res");

// ─── Output targets ────────────────────────────────────────────────────────
const LAUNCHER_TARGETS = [
  [48,  "mipmap-mdpi"],
  [72,  "mipmap-hdpi"],
  [96,  "mipmap-xhdpi"],
  [144, "mipmap-xxhdpi"],
  [192, "mipmap-xxxhdpi"],
];

// ─── Design constants (at 1024px scale) ───────────────────────────────────
const CANVAS = 1024;
const BG_STOPS = [
  [0.00, [55,  48,  163]],   // #3730a3 deep indigo
  [0.65, [79,  62,  184]],   // mid blend
  [0.88, [124, 58,  237]],   // #7c3aed violet-purple
  [1.00, [91,  33,  182]],   // #5b21b6 darker ring
];
const ARM_HW   = 40;   // arm half-width
const ARM_VR   = 400;  // vertical arm reach from center
const ARM_HR   = 370;  // horizontal arm reach from center
const ARM_IO   = 60;   // inner offset (arm starts here)
const CR       = 55;   // center circle radius
const TDR      = 20;   // tip dot radius
const MARK_A   = 0.92; // mark opacity

// ─── PNG encoder ─────────────────────────────────────────────────────────
function crc32(buf) {
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[i] = c;
    }
    return t;
  })());
  let c = 0xFFFFFFFF;
  for (const b of buf) c = table[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(pixels, width, height) {
  // pixels: Uint8ClampedArray of RGBA, row-major
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width,  0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8]  = 8;  // bit depth
  ihdr[9]  = 6;  // RGBA color type
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Build filtered scanlines (filter byte 0 = None per row)
  const rowLen = width * 4;
  const raw = Buffer.alloc(height * (rowLen + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (rowLen + 1)] = 0; // filter type None
    for (let x = 0; x < rowLen; x++) {
      raw[y * (rowLen + 1) + 1 + x] = pixels[y * rowLen + x];
    }
  }

  const compressed = deflateSync(raw, { level: 6 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ─── Drawing helpers ──────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }

function lerpColor(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

function gradientAt(t, stops) {
  t = Math.max(0, Math.min(1, t));
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (t >= t0 && t <= t1) {
      const lt = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
      return lerpColor(c0, c1, lt);
    }
  }
  return stops[stops.length - 1][1];
}

// ─── Render full icon ─────────────────────────────────────────────────────
function renderIcon(size) {
  const sc = size / CANVAS;
  const pixels = new Uint8ClampedArray(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;

  // Helper: set RGBA at (x,y) with alpha-over blend
  function blendPixel(px, py, r, g, b, a) {
    if (px < 0 || py < 0 || px >= size || py >= size) return;
    const idx = (Math.round(py) * size + Math.round(px)) * 4;
    const af = a / 255;
    const ar = pixels[idx + 3] / 255;
    const ao = af + ar * (1 - af);
    if (ao < 1e-6) return;
    pixels[idx]     = Math.round((r * af + pixels[idx]   * ar * (1 - af)) / ao);
    pixels[idx + 1] = Math.round((g * af + pixels[idx+1] * ar * (1 - af)) / ao);
    pixels[idx + 2] = Math.round((b * af + pixels[idx+2] * ar * (1 - af)) / ao);
    pixels[idx + 3] = Math.round(ao * 255);
  }

  // ── Background radial gradient ──
  const maxR = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const t = Math.sqrt(dx * dx + dy * dy) / maxR;
      const [r, g, b] = gradientAt(t, BG_STOPS);
      const idx = (y * size + x) * 4;
      pixels[idx]   = Math.round(r);
      pixels[idx+1] = Math.round(g);
      pixels[idx+2] = Math.round(b);
      pixels[idx+3] = 255;
    }
  }

  // ── Glow (soft white halo at center) ──
  const glowR = 160 * sc;
  const glowA = 0.18;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < glowR) {
        const t = 1 - dist / glowR;
        const a = Math.round(glowA * t * t * 255);
        blendPixel(x, y, 255, 255, 255, a);
      }
    }
  }

  // ── Mark drawing ──
  const markA = Math.round(MARK_A * 255);
  function s(v) { return v * sc; }

  // Draw filled anti-aliased rounded rectangle via pixel scan
  function fillRoundRect(x1, y1, x2, y2, radius) {
    const r = Math.min(radius, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2);
    const X1 = Math.min(x1, x2), Y1 = Math.min(y1, y2);
    const X2 = Math.max(x1, x2), Y2 = Math.max(y1, y2);
    for (let py = Math.floor(Y1); py <= Math.ceil(Y2); py++) {
      for (let px = Math.floor(X1); px <= Math.ceil(X2); px++) {
        // Check if pixel center is inside rounded rect
        const inside = isInsideRoundRect(px + 0.5, py + 0.5, X1, Y1, X2, Y2, r);
        if (inside > 0) {
          blendPixel(px, py, 255, 255, 255, Math.round(markA * inside));
        }
      }
    }
  }

  function isInsideRoundRect(px, py, x1, y1, x2, y2, r) {
    // Returns coverage [0,1]
    if (px < x1 || px > x2 || py < y1 || py > y2) return 0;
    // Corner checks
    const corners = [
      [x1 + r, y1 + r], [x2 - r, y1 + r],
      [x1 + r, y2 - r], [x2 - r, y2 - r],
    ];
    for (const [cx2, cy2] of corners) {
      if (px < x1 + r && py < y1 + r && (px === cx2 && py === cy2 ? 0 : 1)) {
        // top-left corner
        if (px < x1 + r && py < y1 + r) {
          const d = Math.sqrt((px - (x1+r))**2 + (py - (y1+r))**2);
          if (d > r + 1) return 0;
          if (d > r - 1) return Math.max(0, r + 0.5 - d);
          break;
        }
      }
    }
    // Simplified: use distance to nearest corner circle
    const nearX = Math.max(x1 + r, Math.min(x2 - r, px));
    const nearY = Math.max(y1 + r, Math.min(y2 - r, py));
    const dx = px - nearX, dy = py - nearY;
    if (dx === 0 && dy === 0) return 1; // fully inside
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > r + 0.7) return 0;
    if (d < r - 0.7) return 1;
    return Math.max(0, Math.min(1, (r + 0.5 - d)));
  }

  function fillCircle(ocx, ocy, radius) {
    for (let py = Math.floor(ocy - radius - 1); py <= Math.ceil(ocy + radius + 1); py++) {
      for (let px = Math.floor(ocx - radius - 1); px <= Math.ceil(ocx + radius + 1); px++) {
        const d = Math.sqrt((px + 0.5 - ocx) ** 2 + (py + 0.5 - ocy) ** 2);
        if (d < radius + 0.7) {
          const coverage = Math.max(0, Math.min(1, radius + 0.5 - d));
          blendPixel(px, py, 255, 255, 255, Math.round(markA * coverage));
        }
      }
    }
  }

  // Top arm
  fillRoundRect(cx - s(ARM_HW), cy - s(ARM_VR), cx + s(ARM_HW), cy - s(ARM_IO), s(ARM_HW));
  // Bottom arm
  fillRoundRect(cx - s(ARM_HW), cy + s(ARM_IO), cx + s(ARM_HW), cy + s(ARM_VR), s(ARM_HW));
  // Left arm
  fillRoundRect(cx - s(ARM_HR), cy - s(ARM_HW), cx - s(ARM_IO), cy + s(ARM_HW), s(ARM_HW));
  // Right arm
  fillRoundRect(cx + s(ARM_IO), cy - s(ARM_HW), cx + s(ARM_HR), cy + s(ARM_HW), s(ARM_HW));
  // Center circle
  fillCircle(cx, cy, s(CR));
  // Tip dots
  fillCircle(cx, cy - s(ARM_VR - ARM_HW), s(TDR));
  fillCircle(cx, cy + s(ARM_VR - ARM_HW), s(TDR));
  fillCircle(cx - s(ARM_HR - ARM_HW), cy, s(TDR));
  fillCircle(cx + s(ARM_HR - ARM_HW), cy, s(TDR));

  return pixels;
}

// ─── Also render foreground-only (transparent bg) ─────────────────────────
function renderForeground(size) {
  const sc = size / CANVAS;
  const pixels = new Uint8ClampedArray(size * size * 4); // starts transparent
  const cx = size / 2;
  const cy = size / 2;
  const markA = Math.round(MARK_A * 255);
  function s(v) { return v * sc; }

  function blendPixel(px, py, r, g, b, a) {
    if (px < 0 || py < 0 || px >= size || py >= size) return;
    const idx = (Math.round(py) * size + Math.round(px)) * 4;
    const af = a / 255;
    const ar = pixels[idx + 3] / 255;
    const ao = af + ar * (1 - af);
    if (ao < 1e-6) return;
    pixels[idx]     = Math.round((r * af + pixels[idx]   * ar * (1 - af)) / ao);
    pixels[idx + 1] = Math.round((g * af + pixels[idx+1] * ar * (1 - af)) / ao);
    pixels[idx + 2] = Math.round((b * af + pixels[idx+2] * ar * (1 - af)) / ao);
    pixels[idx + 3] = Math.round(ao * 255);
  }

  function isInsideRoundRect(px, py, x1, y1, x2, y2, r) {
    if (px < x1 || px > x2 || py < y1 || py > y2) return 0;
    const nearX = Math.max(x1 + r, Math.min(x2 - r, px));
    const nearY = Math.max(y1 + r, Math.min(y2 - r, py));
    const dx = px - nearX, dy = py - nearY;
    if (dx === 0 && dy === 0) return 1;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > r + 0.7) return 0;
    if (d < r - 0.7) return 1;
    return Math.max(0, Math.min(1, (r + 0.5 - d)));
  }

  function fillRoundRect(x1, y1, x2, y2, radius) {
    const r = Math.min(radius, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2);
    const X1 = Math.min(x1, x2), Y1 = Math.min(y1, y2);
    const X2 = Math.max(x1, x2), Y2 = Math.max(y1, y2);
    for (let py = Math.floor(Y1); py <= Math.ceil(Y2); py++) {
      for (let px = Math.floor(X1); px <= Math.ceil(X2); px++) {
        const inside = isInsideRoundRect(px + 0.5, py + 0.5, X1, Y1, X2, Y2, r);
        if (inside > 0) blendPixel(px, py, 255, 255, 255, Math.round(markA * inside));
      }
    }
  }

  function fillCircle(ocx, ocy, radius) {
    for (let py = Math.floor(ocy - radius - 1); py <= Math.ceil(ocy + radius + 1); py++) {
      for (let px = Math.floor(ocx - radius - 1); px <= Math.ceil(ocx + radius + 1); px++) {
        const d = Math.sqrt((px + 0.5 - ocx) ** 2 + (py + 0.5 - ocy) ** 2);
        if (d < radius + 0.7) {
          const coverage = Math.max(0, Math.min(1, radius + 0.5 - d));
          blendPixel(px, py, 255, 255, 255, Math.round(markA * coverage));
        }
      }
    }
  }

  fillRoundRect(cx - s(ARM_HW), cy - s(ARM_VR), cx + s(ARM_HW), cy - s(ARM_IO), s(ARM_HW));
  fillRoundRect(cx - s(ARM_HW), cy + s(ARM_IO), cx + s(ARM_HW), cy + s(ARM_VR), s(ARM_HW));
  fillRoundRect(cx - s(ARM_HR), cy - s(ARM_HW), cx - s(ARM_IO), cy + s(ARM_HW), s(ARM_HW));
  fillRoundRect(cx + s(ARM_IO), cy - s(ARM_HW), cx + s(ARM_HR), cy + s(ARM_HW), s(ARM_HW));
  fillCircle(cx, cy, s(CR));
  fillCircle(cx, cy - s(ARM_VR - ARM_HW), s(TDR));
  fillCircle(cx, cy + s(ARM_VR - ARM_HW), s(TDR));
  fillCircle(cx - s(ARM_HR - ARM_HW), cy, s(TDR));
  fillCircle(cx + s(ARM_HR - ARM_HW), cy, s(TDR));

  return pixels;
}

// ─── Save PNG ─────────────────────────────────────────────────────────────
function savePNG(pixels, width, height, filePath) {
  mkdirSync(dirname(filePath), { recursive: true });
  const pngBuf = encodePNG(pixels, width, height);
  const ws = createWriteStream(filePath);
  ws.write(pngBuf);
  ws.end();
  const rel = filePath.replace(PROJECT_ROOT + "/", "").replace(PROJECT_ROOT + "\\", "");
  console.log(`  Saved: ${rel}  (${width}x${height})`);
}

// ─── Main ─────────────────────────────────────────────────────────────────
console.log("LifePlan Icon Generator");
console.log("=".repeat(50));

console.log("\nGenerating launcher icons...");
for (const [size, folder] of LAUNCHER_TARGETS) {
  console.log(`  Rendering ${size}x${size}...`);
  const pixels = renderIcon(size);
  const dir = join(RES, folder);
  savePNG(pixels, size, size, join(dir, "ic_launcher.png"));
  savePNG(pixels, size, size, join(dir, "ic_launcher_round.png"));
}

console.log("\nGenerating adaptive icon foreground (1024x1024, transparent bg)...");
const fgPixels = renderForeground(256); // 256 is enough for foreground layer
savePNG(fgPixels, 256, 256, join(RES, "drawable", "ic_launcher_foreground.png"));

console.log("\nDone.");
