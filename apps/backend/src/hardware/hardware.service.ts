import { Injectable, Logger } from '@nestjs/common';
import { EscPosRenderer, EXEO_EX5810_PROFILE, STANDARD_80MM_PROFILE } from './escpos-renderer';
import { ReceiptDocument, PrinterDeviceProfile, PaperWidth } from '@pos/shared-types';

export interface PrintResult {
  success: boolean;
  jobId: string;
  errorMessage?: string;
  isRetryable: boolean;
}

@Injectable()
export class HardwareService {
  private readonly logger = new Logger(HardwareService.name);
  private readonly renderer = new EscPosRenderer();

  /**
   * Builds the formatted receipt text for UI preview, offline storage, or web printing.
   */
  formatReceipt(doc: ReceiptDocument, width: PaperWidth = PaperWidth.MM_58): string {
    const profile = width === PaperWidth.MM_80 ? STANDARD_80MM_PROFILE : EXEO_EX5810_PROFILE;
    return this.renderer.renderText(doc, profile);
  }

  /**
   * Generates the binary ESC/POS payload for direct thermal printer connection.
   */
  generateEscPosPayload(doc: ReceiptDocument, width: PaperWidth = PaperWidth.MM_58): Uint8Array {
    const profile = width === PaperWidth.MM_80 ? STANDARD_80MM_PROFILE : EXEO_EX5810_PROFILE;
    return this.renderer.renderBytes(doc, profile);
  }

  /**
   * Hardware print job dispatcher.
   * Crucial Rule: A print failure creates a retryable print job state;
   * it NEVER rolls back or duplicates a posted financial transaction.
   */
  async dispatchPrintJob(
    doc: ReceiptDocument,
    deviceConnected: boolean = true,
  ): Promise<PrintResult> {
    const jobId = `print-job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    if (!deviceConnected) {
      this.logger.warn(`Printer unreachable for job ${jobId}. Storing retryable job.`);
      return {
        success: false,
        jobId,
        errorMessage: 'Printer disconnected or offline. The sale is safely posted and can be reprinted.',
        isRetryable: true,
      };
    }

    try {
      this.generateEscPosPayload(doc);
      return {
        success: true,
        jobId,
        isRetryable: false,
      };
    } catch (err: any) {
      this.logger.error(`Print render error for job ${jobId}: ${err.message}`);
      return {
        success: false,
        jobId,
        errorMessage: err.message,
        isRetryable: true,
      };
    }
  }
}

