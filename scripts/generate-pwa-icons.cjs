const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    let byte = buf[i];
    for (let j = 0; j < 8; j++) {
      const bit = (crc ^ (byte >> j)) & 1;
      crc = (crc >>> 1) ^ (bit ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(width, height, drawPixel) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8-bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const offset = y * rowSize;
    rawData[offset] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      const pxOffset = offset + 1 + x * 4;
      rawData[pxOffset] = Math.round(r);
      rawData[pxOffset + 1] = Math.round(g);
      rawData[pxOffset + 2] = Math.round(b);
      rawData[pxOffset + 3] = Math.round(a);
    }
  }

  const idatData = zlib.deflateSync(rawData);
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Distance helper
function dist(x1, y1, x2, y2) {
  return Math.hypot(x1 - x2, y1 - y2);
}

// Painter for City Medical Pharmacy icon
function renderPharmacyIcon(isMaskable) {
  return (x, y, width, height) => {
    const nx = x / width;
    const ny = y / height;
    const cx = 0.5;
    const cy = 0.5;

    // Corner radius for standard icon (maskable is full bleed)
    if (!isMaskable) {
      const cornerR = 0.22;
      const dx = Math.abs(nx - cx) - (0.5 - cornerR);
      const dy = Math.abs(ny - cy) - (0.5 - cornerR);
      if (dx > 0 && dy > 0 && Math.hypot(dx, dy) > cornerR) {
        return [0, 0, 0, 0]; // transparent outside rounded rect
      }
    }

    // Background gradient: Rich Teal (#0f766e = 15, 118, 110) to Emerald (#047857 = 4, 120, 87)
    const gradT = (nx + ny) / 2;
    let bgR = 15 * (1 - gradT) + 4 * gradT;
    let bgG = 118 * (1 - gradT) + 120 * gradT;
    let bgB = 110 * (1 - gradT) + 87 * gradT;

    // Safe zone scale: maskable icons keep symbols inside central 65% area
    const scale = isMaskable ? 0.65 : 0.78;
    const sx = (nx - cx) / scale;
    const sy = (ny - cy) / scale;

    // Medical Cross coordinates:
    // Vertical arm: sx in [-0.15, 0.15], sy in [-0.42, 0.42]
    // Horizontal arm: sx in [-0.42, 0.42], sy in [-0.15, 0.15]
    const inVertArm = Math.abs(sx) <= 0.15 && Math.abs(sy) <= 0.42;
    const inHorizArm = Math.abs(sx) <= 0.42 && Math.abs(sy) <= 0.15;

    // Rounded caps on arms
    const capR = 0.15;
    const inTopCap = Math.abs(sx) <= 0.15 && sy < -0.27 && Math.hypot(sx, sy - (-0.27)) <= capR;
    const inBottomCap = Math.abs(sx) <= 0.15 && sy > 0.27 && Math.hypot(sx, sy - 0.27) <= capR;
    const inLeftCap = Math.abs(sy) <= 0.15 && sx < -0.27 && Math.hypot(sx - (-0.27), sy) <= capR;
    const inRightCap = Math.abs(sy) <= 0.15 && sx > 0.27 && Math.hypot(sx - 0.27, sy) <= capR;

    const inCross = (inVertArm && Math.abs(sy) <= 0.35) ||
                    (inHorizArm && Math.abs(sx) <= 0.35) ||
                    inTopCap || inBottomCap || inLeftCap || inRightCap;

    if (inCross) {
      // Center circle badge cutout or emerald heart / pill accent
      // Accent: A pill / capsule diagonal in center with cyan glow
      const pillX = sx * 0.707 + sy * 0.707;
      const pillY = -sx * 0.707 + sy * 0.707;
      
      if (Math.abs(pillX) <= 0.14 && Math.abs(pillY) <= 0.08) {
        if (pillX < 0) {
          // Left half of capsule: Emerald
          return [16, 185, 129, 255];
        } else {
          // Right half of capsule: Sky blue
          return [14, 165, 233, 255];
        }
      }

      // Crisp White Medical Cross
      return [255, 255, 255, 255];
    }

    // Subtle outer ring in background
    const ringDist = Math.hypot(sx, sy);
    if (ringDist > 0.52 && ringDist < 0.54) {
      return [bgR + 25, bgG + 30, bgB + 30, 255];
    }

    return [bgR, bgG, bgB, 255];
  };
}

const pubDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

// 1. 192x192 PNG
console.log('Generating pwa-192x192.png...');
fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), makePng(192, 192, renderPharmacyIcon(false)));

// 2. 512x512 PNG
console.log('Generating pwa-512x512.png...');
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), makePng(512, 512, renderPharmacyIcon(false)));

// 3. 512x512 Maskable PNG (Android safe-zone compliant)
console.log('Generating pwa-maskable-512x512.png...');
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), makePng(512, 512, renderPharmacyIcon(true)));

// 4. Apple Touch Icon 180x180
console.log('Generating apple-touch-icon.png...');
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), makePng(180, 180, renderPharmacyIcon(false)));

// 5. Favicon 64x64
console.log('Generating favicon.png...');
fs.writeFileSync(path.join(pubDir, 'favicon.png'), makePng(64, 64, renderPharmacyIcon(false)));

// 6. SVG Icon
console.log('Generating icon.svg...');
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="pharmGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-opacity="0.25"/>
    </filter>
  </defs>
  <!-- Background Card -->
  <rect width="512" height="512" rx="112" fill="url(#pharmGrad)"/>
  <circle cx="256" cy="256" r="190" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="4"/>
  <!-- White Medical Cross -->
  <g filter="url(#shadow)">
    <rect x="216" y="112" width="80" height="288" rx="40" fill="#ffffff"/>
    <rect x="112" y="216" width="288" height="80" rx="40" fill="#ffffff"/>
  </g>
  <!-- Inner Capsule Accent -->
  <g transform="translate(256, 256) rotate(-45)">
    <rect x="-44" y="-22" width="44" height="44" rx="22" fill="#10b981"/>
    <rect x="0" y="-22" width="44" height="44" rx="22" fill="#0ea5e9"/>
    <line x1="0" y1="-22" x2="0" y2="22" stroke="#ffffff" stroke-width="3"/>
  </g>
</svg>`;
fs.writeFileSync(path.join(pubDir, 'icon.svg'), svgContent);

console.log('All PWA and Play Store asset icons generated successfully!');
