/**
 * ESC/POS Thermal Receipt Printer Utilities & Web Hardware Bridges
 * Supports Web Bluetooth, Web Serial, Web USB, and High-Definition Thermal Browser Spooler
 */
import { PrinterSettings, PharmacyProfile, SaleTransaction } from '../types';

export const DEFAULT_PRINTER_SETTINGS: PrinterSettings = {
  printerType: 'thermal',
  connectionType: 'browser',
  deviceName: 'System Thermal Receipt Spooler (80mm/58mm)',
  deviceAddress: '',
  paperWidth: '80mm',
  autoCut: true,
  openCashDrawer: false,
  autoPrintOnComplete: true,
  printCopies: 1,
  printLogo: true,
  printQrCode: true,
  printPharmacistSign: true,
  showPrintTime: true,
  timeFormat: '12h',
  showSeconds: false,
  billTimeSource: 'invoice_time',
  customBillTime: '',
  customBillDate: '',
  printDelayMs: 60,
  dualCopyIntervalMs: 800,
  headerCustomNote: 'Fast Counter Billing • Tax Invoice',
  footerCustomNote: 'Thank you! Get Well Soon • No Return without Cash Bill',
  status: 'ready'
};

// Standard ESC/POS Command Byte Sequences
export const ESC_POS = {
  INIT: new Uint8Array([0x1b, 0x40]), // ESC @
  ALIGN_LEFT: new Uint8Array([0x1b, 0x61, 0x00]), // ESC a 0
  ALIGN_CENTER: new Uint8Array([0x1b, 0x61, 0x01]), // ESC a 1
  ALIGN_RIGHT: new Uint8Array([0x1b, 0x61, 0x02]), // ESC a 2
  BOLD_ON: new Uint8Array([0x1b, 0x45, 0x01]), // ESC E 1
  BOLD_OFF: new Uint8Array([0x1b, 0x45, 0x00]), // ESC E 0
  DOUBLE_HEIGHT: new Uint8Array([0x1d, 0x21, 0x01]), // GS ! 1
  DOUBLE_WIDTH: new Uint8Array([0x1d, 0x21, 0x10]), // GS ! 16
  DOUBLE_SIZE: new Uint8Array([0x1d, 0x21, 0x11]), // GS ! 17
  NORMAL_SIZE: new Uint8Array([0x1d, 0x21, 0x00]), // GS ! 0
  FEED_3_LINES: new Uint8Array([0x1b, 0x64, 0x03]), // ESC d 3
  FEED_5_LINES: new Uint8Array([0x1b, 0x64, 0x05]), // ESC d 5
  CUT_FULL: new Uint8Array([0x1d, 0x56, 0x00]), // GS V 0
  CUT_PARTIAL: new Uint8Array([0x1d, 0x56, 0x01]), // GS V 1
  CUT_FEED: new Uint8Array([0x1d, 0x56, 0x42, 0x00]), // GS V 'B' 0
  PULSE_DRAWER_PIN2: new Uint8Array([0x1b, 0x70, 0x00, 0x19, 0xfa]), // ESC p 0 25 250
  PULSE_DRAWER_PIN5: new Uint8Array([0x1b, 0x70, 0x01, 0x19, 0xfa]) // ESC p 1 25 250
};

/**
 * Encodes string to UTF-8 / ASCII Uint8Array
 */
export function encodeText(text: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(text);
}

/**
 * Combines multiple Uint8Arrays into a single buffer
 */
export function concatByteArrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, curr) => acc + curr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Builds standard ESC/POS binary payload for thermal printer test slip
 */
export function buildTestPrintEscPosPayload(
  profile: PharmacyProfile,
  settings: PrinterSettings
): Uint8Array {
  const parts: Uint8Array[] = [];
  const is58mm = settings.paperWidth === '58mm' || settings.printerType === 'thermal58';
  const lineWidth = is58mm ? 32 : 48;
  const divider = '='.repeat(lineWidth);
  const subDivider = '-'.repeat(lineWidth);

  // Initialize
  parts.push(ESC_POS.INIT);

  // Optional cash drawer kick
  if (settings.openCashDrawer) {
    parts.push(ESC_POS.PULSE_DRAWER_PIN2);
  }

  // Header: Center aligned, Double size title
  parts.push(ESC_POS.ALIGN_CENTER);
  parts.push(ESC_POS.DOUBLE_SIZE);
  parts.push(ESC_POS.BOLD_ON);
  parts.push(encodeText(`${profile.name || 'CITY RX - CITY MEDICAL'}\n`));
  parts.push(ESC_POS.NORMAL_SIZE);
  parts.push(ESC_POS.BOLD_OFF);

  parts.push(encodeText(`${profile.addressLine1 || 'Main Road, Chokkalingapuram'}\n`));
  parts.push(encodeText(`${profile.taluk || 'Melur'}, ${profile.district || 'Madurai'} - ${profile.pincode || '625106'}\n`));
  parts.push(encodeText(`Phone: +91 ${profile.mobile || '8438678498'}\n`));

  // GSTIN & DL
  parts.push(ESC_POS.BOLD_ON);
  parts.push(encodeText(`GSTIN: ${profile.gstin || '33AALFC1234F1Z5'}\n`));
  parts.push(encodeText(`D.L. No: ${profile.drugLicenseNo || 'TN-MDU-20B-18491/21B-18492'}\n`));
  parts.push(ESC_POS.BOLD_OFF);

  parts.push(encodeText(`${divider}\n`));
  parts.push(ESC_POS.BOLD_ON);
  parts.push(encodeText(`THERMAL PRINTER HARDWARE TEST SLIP\n`));
  parts.push(ESC_POS.BOLD_OFF);
  parts.push(encodeText(`${subDivider}\n`));

  // Left aligned metadata
  parts.push(ESC_POS.ALIGN_LEFT);
  const now = new Date();
  parts.push(encodeText(`Date: ${now.toLocaleDateString('en-IN')}  Time: ${now.toLocaleTimeString('en-IN')}\n`));
  parts.push(encodeText(`Paper Width : ${settings.paperWidth} (${lineWidth} characters/line)\n`));
  parts.push(encodeText(`Connection  : ${settings.connectionType.toUpperCase()}\n`));
  parts.push(encodeText(`Device Name : ${settings.deviceName || 'Standard Thermal POS'}\n`));
  parts.push(encodeText(`Pharmacist  : ${profile.pharmacistName || 'Anusya Begum'}\n`));
  parts.push(encodeText(`Reg. No.    : ${profile.pharmacistRegNo || 'TN-RPH-78419'}\n`));

  parts.push(encodeText(`${subDivider}\n`));

  // Sample items table
  if (is58mm) {
    parts.push(encodeText(`Item           Qty Rate  Total\n`));
    parts.push(encodeText(`Paracetamol 650  2  3.00   6.00\n`));
    parts.push(encodeText(`Amoxicillin 500  1 14.00  14.00\n`));
  } else {
    parts.push(encodeText(`Item Name           Qty   MRP   Tax%   Total\n`));
    parts.push(encodeText(`Paracetamol 650mg    2   3.00    12%    6.00\n`));
    parts.push(encodeText(`Amoxicillin 500mg    1  14.00    12%   14.00\n`));
    parts.push(encodeText(`Pantoprazole 40mg    1  10.00    12%   10.00\n`));
  }
  parts.push(encodeText(`${divider}\n`));

  // Totals
  parts.push(ESC_POS.ALIGN_RIGHT);
  parts.push(ESC_POS.BOLD_ON);
  parts.push(encodeText(`Subtotal:  Rs. 30.00\n`));
  parts.push(encodeText(`Total GST (12%):   Rs.  3.60\n`));
  parts.push(ESC_POS.DOUBLE_HEIGHT);
  parts.push(encodeText(`GRAND TOTAL:  Rs. 30.00\n`));
  parts.push(ESC_POS.NORMAL_SIZE);
  parts.push(ESC_POS.BOLD_OFF);

  // Footer
  parts.push(ESC_POS.ALIGN_CENTER);
  parts.push(encodeText(`${subDivider}\n`));
  parts.push(encodeText(`UPI ID: ${profile.upiVpa || profile.upiId || '8438678498@upi'}\n`));
  parts.push(encodeText(`* HARDWARE TEST SUCCESSFUL *\n`));
  parts.push(encodeText(`City Rx • Melur • Get Well Soon!\n`));

  // Feed & Cut
  parts.push(ESC_POS.FEED_5_LINES);
  if (settings.autoCut) {
    parts.push(ESC_POS.CUT_FEED);
  }

  return concatByteArrays(parts);
}

/**
 * Triggers a real high-fidelity HTML thermal receipt test print dialog in browser
 */
export function printThermalTestSlipViaBrowser(
  profile: PharmacyProfile,
  settings: PrinterSettings
): void {
  const is58mm = settings.paperWidth === '58mm' || settings.printerType === 'thermal58';
  const widthMm = is58mm ? '58mm' : '80mm';
  const widthPx = is58mm ? '210px' : '290px';

  const printWindow = window.open('', '_blank', 'width=420,height=700');
  if (!printWindow) {
    // If popups blocked, use standard window print fallback
    window.print();
    return;
  }

  const now = new Date();
  const upiId = profile.upiVpa || profile.upiId || '8438678498@upi';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>City Rx - Thermal Printer Test</title>
  <style>
    @page {
      size: ${widthMm} auto;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Courier New', Courier, monospace, system-ui;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      width: ${widthPx};
      margin: 0 auto;
      padding: 8px 6px 20px 6px;
      font-size: ${is58mm ? '10px' : '11px'};
      line-height: 1.25;
      color: #000;
      background: #fff;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .bold { font-weight: bold; }
    .title {
      font-size: ${is58mm ? '13px' : '15px'};
      font-weight: 900;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
      text-transform: uppercase;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 5px 0;
    }
    .double-divider {
      border-top: 2px solid #000;
      margin: 5px 0;
    }
    .row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 2px;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
    }
    .table th {
      border-bottom: 1px dashed #000;
      padding: 2px 0;
      font-size: 10px;
    }
    .table td {
      padding: 2px 0;
    }
    .barcode-box {
      border: 1px solid #000;
      padding: 4px;
      margin: 6px auto;
      text-align: center;
      font-size: 10px;
      letter-spacing: 2px;
    }
    .cut-line {
      border-top: 1px dotted #666;
      margin-top: 16px;
      padding-top: 4px;
      text-align: center;
      font-size: 9px;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="text-center">
    <div class="title">${profile.name || 'CITY RX - CITY MEDICAL'}</div>
    <div>${profile.addressLine1 || 'Main Road, Chokkalingapuram'}</div>
    <div>${profile.taluk || 'Melur'}, ${profile.district || 'Madurai'} - ${profile.pincode || '625106'}</div>
    <div>Phone: +91 ${profile.mobile || '8438678498'}</div>
    <div class="bold" style="margin-top:2px;">GSTIN: ${profile.gstin || '33AALFC1234F1Z5'}</div>
    <div>D.L. No: ${profile.drugLicenseNo || 'TN-MDU-20B-18491/21B-18492'}</div>
  </div>

  <div class="double-divider"></div>
  <div class="text-center bold">*** THERMAL PRINTER TEST SLIP ***</div>
  <div class="divider"></div>

  <div class="row"><span>Date:</span> <span>${now.toLocaleDateString('en-IN')}</span></div>
  <div class="row"><span>Time:</span> <span>${now.toLocaleTimeString('en-IN')}</span></div>
  <div class="row"><span>Width:</span> <span class="bold">${settings.paperWidth} Roll</span></div>
  <div class="row"><span>Connection:</span> <span>${settings.connectionType.toUpperCase()}</span></div>
  <div class="row"><span>Pharmacist:</span> <span>${profile.pharmacistName || 'Anusya Begum'}</span></div>
  <div class="row"><span>Reg No:</span> <span>${profile.pharmacistRegNo || 'TN-RPH-78419'}</span></div>

  <div class="divider"></div>

  <table class="table">
    <thead>
      <tr>
        <th class="text-left">Item</th>
        <th class="text-center">Qty</th>
        <th class="text-right">Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="text-left">Paracetamol 650</td>
        <td class="text-center">2</td>
        <td class="text-right">3.00</td>
        <td class="text-right">6.00</td>
      </tr>
      <tr>
        <td class="text-left">Amoxicillin 500</td>
        <td class="text-center">1</td>
        <td class="text-right">14.00</td>
        <td class="text-right">14.00</td>
      </tr>
      <tr>
        <td class="text-left">Pantoprazole 40</td>
        <td class="text-center">1</td>
        <td class="text-right">10.00</td>
        <td class="text-right">10.00</td>
      </tr>
    </tbody>
  </table>

  <div class="divider"></div>

  <div class="row"><span>Subtotal:</span> <span>Rs. 30.00</span></div>
  <div class="row"><span>CGST 6% + SGST 6%:</span> <span>Rs. 3.60</span></div>
  <div class="row bold" style="font-size: ${is58mm ? '12px' : '13px'}; margin-top: 3px;">
    <span>NET AMOUNT:</span> <span>Rs. 30.00</span>
  </div>

  <div class="barcode-box">
    ||| | || |||| | ||| |||| | || |
    <div style="font-size: 8px; letter-spacing: 0;">*TEST-RECEIPT-OK*</div>
  </div>

  <div class="divider"></div>
  <div class="text-center">
    <div class="bold">PAY VIA UPI: ${upiId}</div>
    <div style="margin-top: 2px;">*** TEST PRINT SUCCESSFUL ***</div>
    <div style="font-size: 9px; margin-top: 3px;">City Rx Melur • Fast Counter POS</div>
  </div>

  <div class="cut-line">
    ${settings.autoCut ? '✂ --- [Auto Paper Cut Line] --- ✂' : '✂ --- [Tear Along Here] --- ✂'}
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

import { printDirectBill } from './printDirectUtils';

/**
 * Triggers automatic thermal bill printing directly to thermal printer
 * without downloading PDF file.
 */
export function printThermalBillViaBrowser(
  tx: SaleTransaction,
  profile: PharmacyProfile,
  settings?: PrinterSettings
): { success: boolean; error?: string } {
  try {
    const is58mm = (settings?.paperWidth === '58mm') || (settings?.printerType === 'thermal58');
    const ok = printDirectBill(tx, profile, is58mm ? 'thermal58' : 'thermal', settings);
    return { success: ok };
  } catch (err: any) {
    console.warn('Direct thermal print error:', err);
    try {
      window.print();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Print error' };
    }
  }
}


/**
 * Checks browser capability for Web Bluetooth
 */
export function isWebBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/**
 * Checks browser capability for Web Serial
 */
export function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

/**
 * Checks browser capability for Web USB
 */
export function isWebUsbSupported(): boolean {
  return typeof navigator !== 'undefined' && 'usb' in navigator;
}

/**
 * Connects to a Web Bluetooth POS Printer and returns device info
 */
export async function connectWebBluetoothPrinter(): Promise<{
  success: boolean;
  deviceName?: string;
  error?: string;
}> {
  if (!isWebBluetoothSupported()) {
    return {
      success: false,
      error: 'Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Android Browser.'
    };
  }

  try {
    const nav = navigator as any;
    // Request Bluetooth device with common thermal printer services
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        '000018f0-0000-1000-8000-00805f9b34fb', // Common printer service
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455'
      ]
    });

    return {
      success: true,
      deviceName: device.name || 'Bluetooth Thermal Printer'
    };
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      return { success: false, error: 'No Bluetooth printer was selected.' };
    }
    return { success: false, error: err?.message || 'Bluetooth connection failed.' };
  }
}

/**
 * Connects to a Web Serial / USB COM Port Printer
 */
export async function connectWebSerialPrinter(): Promise<{
  success: boolean;
  deviceName?: string;
  error?: string;
}> {
  if (!isWebSerialSupported()) {
    return {
      success: false,
      error: 'Web Serial is not supported in this browser. Please use Chrome or Edge.'
    };
  }

  try {
    const nav = navigator as any;
    const port = await nav.serial.requestPort();
    const info = port.getInfo ? port.getInfo() : {};
    const name = info.usbVendorId
      ? `Serial Thermal Printer (VID:${info.usbVendorId.toString(16)})`
      : 'USB Serial Thermal Printer';

    return {
      success: true,
      deviceName: name
    };
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      return { success: false, error: 'No serial printer port selected.' };
    }
    return { success: false, error: err?.message || 'Serial port connection failed.' };
  }
}

/**
 * Connects to a Web USB POS Printer
 */
export async function connectWebUsbPrinter(): Promise<{
  success: boolean;
  deviceName?: string;
  error?: string;
}> {
  if (!isWebUsbSupported()) {
    return {
      success: false,
      error: 'Web USB is not supported in this browser. Please use Chrome or Edge.'
    };
  }

  try {
    const nav = navigator as any;
    const device = await nav.usb.requestDevice({
      filters: [] // Allow user to pick USB printer from system list
    });

    return {
      success: true,
      deviceName: device.productName || 'USB POS Thermal Printer'
    };
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      return { success: false, error: 'No USB device selected.' };
    }
    return { success: false, error: err?.message || 'USB printer connection failed.' };
  }
}
