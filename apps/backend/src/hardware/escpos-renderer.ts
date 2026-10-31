import { ReceiptDocument, PaperWidth, PrinterDeviceProfile } from '@pos/shared-types';

export const EXEO_EX5810_PROFILE: PrinterDeviceProfile = {
  model: 'EXEO EX-5810',
  paperWidth: PaperWidth.MM_58,
  columnsPerLine: 32,
  supportsCashDrawerKick: true,
  supportsCut: false,
};

export const STANDARD_80MM_PROFILE: PrinterDeviceProfile = {
  model: 'Standard 80mm ESC/POS',
  paperWidth: PaperWidth.MM_80,
  columnsPerLine: 48,
  supportsCashDrawerKick: true,
  supportsCut: true,
};

export class EscPosRenderer {
  // ESC/POS Command Constants
  private static readonly ESC = 0x1b;
  private static readonly GS = 0x1d;

  private static readonly CMD_INIT = [EscPosRenderer.ESC, 0x40];
  private static readonly CMD_ALIGN_LEFT = [EscPosRenderer.ESC, 0x61, 0x00];
  private static readonly CMD_ALIGN_CENTER = [EscPosRenderer.ESC, 0x61, 0x01];
  private static readonly CMD_ALIGN_RIGHT = [EscPosRenderer.ESC, 0x61, 0x02];
  private static readonly CMD_BOLD_ON = [EscPosRenderer.ESC, 0x45, 0x01];
  private static readonly CMD_BOLD_OFF = [EscPosRenderer.ESC, 0x45, 0x00];
  private static readonly CMD_FEED_3 = [EscPosRenderer.ESC, 0x64, 0x03];
  private static readonly CMD_CUT = [EscPosRenderer.GS, 0x56, 0x00];
  private static readonly CMD_DRAWER_KICK = [EscPosRenderer.ESC, 0x70, 0x00, 0x19, 0xfa];

  /**
   * Generates formatted plaintext representation (for web preview / testing)
   */
  public renderText(doc: ReceiptDocument, profile: PrinterDeviceProfile = EXEO_EX5810_PROFILE): string {
    const width = profile.columnsPerLine;
    const divider = '-'.repeat(width);
    const doubleDivider = '='.repeat(width);
    const lines: string[] = [];

    // Header
    lines.push(this.center(doc.header.businessName, width));
    lines.push(this.center(doc.header.branchName, width));
    if (doc.header.addressLine) lines.push(this.center(doc.header.addressLine, width));
    if (doc.header.gstin) lines.push(this.center(`GSTIN: ${doc.header.gstin}`, width));
    if (doc.header.phone) lines.push(this.center(`Ph: ${doc.header.phone}`, width));
    lines.push(divider);

    // Invoice meta
    lines.push(`Inv: ${doc.invoice.invoiceNumber}`);
    lines.push(`Date: ${doc.invoice.dateTime}`);
    if (doc.invoice.cashierName) lines.push(`Cashier: ${doc.invoice.cashierName}`);
    lines.push(divider);

    // Items Header
    if (profile.paperWidth === PaperWidth.MM_58) {
      lines.push(this.twoColumns('ITEM (QTY x RATE)', 'AMT', width));
    } else {
      lines.push(this.fourColumns('ITEM', 'QTY', 'RATE', 'TOTAL', width));
    }
    lines.push(divider);

    // Items
    for (const item of doc.items) {
      if (profile.paperWidth === PaperWidth.MM_58) {
        lines.push(item.name.slice(0, width));
        const sub = `  ${item.quantity} x ${item.rate}`;
        lines.push(this.twoColumns(sub, item.total, width));
      } else {
        lines.push(this.fourColumns(item.name.slice(0, 20), item.quantity, item.rate, item.total, width));
      }
    }
    lines.push(divider);

    // Totals
    lines.push(this.twoColumns('Subtotal:', `₹${doc.totals.subtotal}`, width));
    if (parseFloat(doc.totals.discountTotal) > 0) {
      lines.push(this.twoColumns('Discount:', `-₹${doc.totals.discountTotal}`, width));
    }
    if (parseFloat(doc.totals.tax.cgst) > 0) {
      lines.push(this.twoColumns('CGST:', `₹${doc.totals.tax.cgst}`, width));
      lines.push(this.twoColumns('SGST:', `₹${doc.totals.tax.sgst}`, width));
    }
    if (parseFloat(doc.totals.tax.igst) > 0) {
      lines.push(this.twoColumns('IGST:', `₹${doc.totals.tax.igst}`, width));
    }
    lines.push(doubleDivider);
    lines.push(this.twoColumns('GRAND TOTAL:', `₹${doc.totals.grandTotal}`, width));
    lines.push(doubleDivider);

    // Payments
    for (const p of doc.payments) {
      lines.push(this.twoColumns(`Paid (${p.method.toUpperCase()}):`, `₹${p.amount}`, width));
    }
    lines.push(divider);

    // Footer
    lines.push(this.center(doc.footer?.thankYouMessage ?? 'Thank you! Visit again.', width));
    if (doc.footer?.fssaiLicense) {
      lines.push(this.center(`FSSAI: ${doc.footer.fssaiLicense}`, width));
    }

    return lines.join('\n');
  }

  /**
   * Generates raw ESC/POS byte sequence
   */
  public renderBytes(doc: ReceiptDocument, profile: PrinterDeviceProfile = EXEO_EX5810_PROFILE): Uint8Array {
    const text = this.renderText(doc, profile);
    const textBytes = new TextEncoder().encode(text + '\n');
    const bytes: number[] = [...EscPosRenderer.CMD_INIT];

    if (profile.supportsCashDrawerKick) {
      bytes.push(...EscPosRenderer.CMD_DRAWER_KICK);
    }

    for (let i = 0; i < textBytes.length; i++) {
      bytes.push(textBytes[i]);
    }

    bytes.push(...EscPosRenderer.CMD_FEED_3);

    if (profile.supportsCut) {
      bytes.push(...EscPosRenderer.CMD_CUT);
    }

    return new Uint8Array(bytes);
  }

  private center(str: string, width: number): string {
    if (str.length >= width) return str.slice(0, width);
    const leftPad = Math.floor((width - str.length) / 2);
    return ' '.repeat(leftPad) + str;
  }

  private twoColumns(left: string, right: string, width: number): string {
    const space = width - left.length - right.length;
    if (space <= 0) return `${left} ${right}`;
    return left + ' '.repeat(space) + right;
  }

  private fourColumns(c1: string, c2: string, c3: string, c4: string, width: number): string {
    const w1 = Math.floor(width * 0.4);
    const w2 = Math.floor(width * 0.18);
    const w3 = Math.floor(width * 0.18);
    const w4 = width - w1 - w2 - w3;

    return (
      c1.padEnd(w1).slice(0, w1) +
      c2.padStart(w2).slice(0, w2) +
      c3.padStart(w3).slice(0, w3) +
      c4.padStart(w4).slice(0, w4)
    );
  }
}

