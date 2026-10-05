import React, { useMemo } from 'react';
import QRCodeLib from 'qrcode';

/**
 * Synchronously generates a crisp, standards-compliant (ISO/IEC 18004) SVG string
 * for any UPI payment URI or text without external network calls.
 */
export function generateQrSvgString(
  value: string,
  margin = 1,
  level: 'L' | 'M' | 'Q' | 'H' = 'M'
): string {
  const safeVal = value || 'upi://pay';
  try {
    const qr = QRCodeLib.create(safeVal, { errorCorrectionLevel: level });
    const size = qr.modules.size;
    const totalSize = size + margin * 2;
    let path = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (qr.modules.get(r, c)) {
          path += `M${c + margin},${r + margin}h1v1h-1z`;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#ffffff"/><path d="${path}" fill="#000000"/></svg>`;
  } catch {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25"><rect width="100%" height="100%" fill="#ffffff"/></svg>`;
  }
}

/**
 * Synchronously generates a `data:image/svg+xml;utf8,...` Data URL for `<img>` tags
 * and instant iframe printing (0ms load latency, 100% offline-ready).
 */
export function generateQrSvgDataUrl(
  value: string,
  margin = 1,
  level: 'L' | 'M' | 'Q' | 'H' = 'M'
): string {
  const svg = generateQrSvgString(value, margin, level);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Synchronously generates an inline `<svg>` element with explicit pixel dimensions
 * for direct HTML receipt printing (Thermal 80mm/58mm, A4, A5).
 */
export function generateQrSvgMarkup(
  value: string,
  sizePx = 110,
  margin = 1,
  level: 'L' | 'M' | 'Q' | 'H' = 'M',
  extraStyle = ''
): string {
  const safeVal = value || 'upi://pay';
  try {
    const qr = QRCodeLib.create(safeVal, { errorCorrectionLevel: level });
    const size = qr.modules.size;
    const totalSize = size + margin * 2;
    let path = '';
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (qr.modules.get(r, c)) {
          path += `M${c + margin},${r + margin}h1v1h-1z`;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 ${totalSize} ${totalSize}" shape-rendering="crispEdges" style="width:${sizePx}px;height:${sizePx}px;display:block;${extraStyle}"><rect width="100%" height="100%" fill="#ffffff"/><path d="${path}" fill="#000000"/></svg>`;
  } catch {
    return '';
  }
}

// Standalone React QR Code component using synchronous ISO-compliant QR matrix generation
export function QRCode({
  value,
  size = 180,
  level = 'M'
}: {
  value: string;
  size?: number;
  level?: 'L' | 'M' | 'Q' | 'H';
}) {
  const qrData = useMemo(() => {
    const safeVal = value || 'upi://pay';
    try {
      const qr = QRCodeLib.create(safeVal, { errorCorrectionLevel: level });
      const matrixSize = qr.modules.size;
      const margin = 1;
      const totalSize = matrixSize + margin * 2;
      let path = '';
      for (let r = 0; r < matrixSize; r++) {
        for (let c = 0; c < matrixSize; c++) {
          if (qr.modules.get(r, c)) {
            path += `M${c + margin},${r + margin}h1v1h-1z`;
          }
        }
      }
      return { totalSize, path };
    } catch {
      return null;
    }
  }, [value, level]);

  return (
    <div className="inline-block p-2 bg-white rounded-2xl shadow-xs border border-slate-200 print:border-slate-400 print:shadow-none">
      {qrData ? (
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${qrData.totalSize} ${qrData.totalSize}`}
          shapeRendering="crispEdges"
          className="rounded-lg block"
        >
          <rect width="100%" height="100%" fill="#ffffff" />
          <path d={qrData.path} fill="#000000" />
        </svg>
      ) : (
        <div
          style={{ width: size, height: size }}
          className="flex items-center justify-center text-xs text-slate-400 font-mono"
        >
          QR Ready
        </div>
      )}
    </div>
  );
}
