import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  minBarcodeLength?: number;
  maxInterKeyDelay?: number; // Milliseconds between keystrokes to qualify as hardware scanner (typical: 15-35ms)
  enabled?: boolean;
}

export function useBarcodeScanner({
  onScan,
  minBarcodeLength = 3,
  maxInterKeyDelay = 50,
  enabled = true
}: UseBarcodeScannerOptions) {
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState<number>(0);
  const [lastScanTimestamp, setLastScanTimestamp] = useState<Date | null>(null);

  // Keep onScan in a ref to avoid recreating the listener when onScan changes
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const bufferRef = useRef<string[]>([]);
  const lastKeyTimeRef = useRef<number>(0);
  const keyTimestampsRef = useRef<number[]>([]);

  const handleScanSuccess = useCallback((barcode: string) => {
    setLastScannedBarcode(barcode);
    setScanCount(prev => prev + 1);
    setLastScanTimestamp(new Date());
    onScanRef.current(barcode);
  }, []);

  const simulateScan = useCallback((barcode: string) => {
    const cleaned = barcode.trim();
    if (cleaned) {
      handleScanSuccess(cleaned);
    }
  }, [handleScanSuccess]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore functional modifier keys alone
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(event.key)) {
        return;
      }

      // Ignore standard POS function keys (F1 - F12)
      if (/^F\d+$/.test(event.key)) {
        return;
      }

      const currentTime = performance.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // When the barcode scanner terminates the sequence with 'Enter'
      if (event.key === 'Enter') {
        const bufferLength = bufferRef.current.length;
        const timestamps = keyTimestampsRef.current;

        // Check if we have enough characters and they arrived rapidly
        if (bufferLength >= minBarcodeLength) {
          // Calculate average inter-key time for the buffered characters
          let isScannerSpeed = false;
          if (timestamps.length >= 2) {
            let totalInterval = 0;
            for (let i = 1; i < timestamps.length; i++) {
              totalInterval += (timestamps[i] - timestamps[i - 1]);
            }
            const avgInterval = totalInterval / (timestamps.length - 1);
            // Scanners consistently output characters < 50ms apart
            isScannerSpeed = avgInterval <= maxInterKeyDelay;
          }

          if (isScannerSpeed || timeDiff <= maxInterKeyDelay) {
            // Hardware scanner detected!
            event.preventDefault();
            event.stopPropagation();

            const fullBarcode = bufferRef.current.join('').trim();
            bufferRef.current = [];
            keyTimestampsRef.current = [];

            if (fullBarcode.length >= minBarcodeLength) {
              handleScanSuccess(fullBarcode);
            }
            return;
          }
        }

        // Reset buffer on manual Enter that didn't qualify as scanner
        bufferRef.current = [];
        keyTimestampsRef.current = [];
        return;
      }

      // Single printable character (letters, numbers, hyphens, periods, etc.)
      if (event.key.length === 1) {
        // If too much time elapsed since previous keystroke, reset buffer
        if (timeDiff > maxInterKeyDelay) {
          bufferRef.current = [event.key];
          keyTimestampsRef.current = [currentTime];
        } else {
          bufferRef.current.push(event.key);
          keyTimestampsRef.current.push(currentTime);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, minBarcodeLength, maxInterKeyDelay, handleScanSuccess]);

  return {
    lastScannedBarcode,
    scanCount,
    lastScanTimestamp,
    simulateScan
  };
}
