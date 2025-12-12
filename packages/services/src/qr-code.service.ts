import QRCode from 'qrcode';

export class QrCodeService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.APP_BASE_URL || 'https://hakkemni.internalizable.dev';
  }

  /**
   * Generate QR code for health pass access
   */
  async generateQrCode(accessCode: string): Promise<string> {
    const accessUrl = `${this.baseUrl}/health-summary?code=${accessCode}`;

    try {
      // Generate QR code as base64 data URL
      const qrCodeDataUrl = await QRCode.toDataURL(accessUrl, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR code as buffer (for file saving)
   */
  async generateQrCodeBuffer(accessCode: string): Promise<Buffer> {
    const accessUrl = `${this.baseUrl}/health-summary?code=${accessCode}`;

    try {
      return await QRCode.toBuffer(accessUrl, {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 300,
        margin: 2
      });
    } catch (error) {
      console.error('QR code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Get access URL for a health pass
   */
  getAccessUrl(accessCode: string): string {
    return `${this.baseUrl}/healthpass/${accessCode}`;
  }
}

export const qrCodeService = new QrCodeService();

