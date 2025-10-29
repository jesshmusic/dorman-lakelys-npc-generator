// Image download and file management service for AI-generated portraits

const MODULE_ID = 'dorman-lakelys-npc-generator';
const IMAGE_FOLDER = 'DormanNPCGenImages';
const PORTRAITS_SUBFOLDER = 'portraits';

export class ImageService {
  /**
   * Ensure the image directory exists, creating it if necessary
   */
  static async ensureImageDirectory(): Promise<boolean> {
    try {
      // Check if main folder exists
      const mainFolderExists = await this.directoryExists(IMAGE_FOLDER);
      if (!mainFolderExists) {
        await FilePicker.createDirectory('data', IMAGE_FOLDER);
        console.log(`${MODULE_ID} | Created directory: ${IMAGE_FOLDER}`);
      }

      // Check if portraits subfolder exists
      const portraitsPath = `${IMAGE_FOLDER}/${PORTRAITS_SUBFOLDER}`;
      const portraitsFolderExists = await this.directoryExists(portraitsPath);
      if (!portraitsFolderExists) {
        await FilePicker.createDirectory('data', portraitsPath);
        console.log(`${MODULE_ID} | Created directory: ${portraitsPath}`);
      }

      return true;
    } catch (error) {
      console.error(`${MODULE_ID} | Failed to create image directories:`, error);
      ui.notifications?.error('Failed to create image directories. Check console for details.');
      return false;
    }
  }

  /**
   * Check if a directory exists
   */
  private static async directoryExists(path: string): Promise<boolean> {
    try {
      await FilePicker.browse('data', path);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Save base64-encoded image data to local file system
   * @param base64Data - Base64-encoded image data (without data: prefix)
   * @param npcName - Name of the NPC (used for filename)
   * @returns Local file path or null if failed
   */
  static async saveBase64Image(base64Data: string, npcName: string): Promise<string | null> {
    try {
      // Ensure directory exists
      const dirExists = await this.ensureImageDirectory();
      if (!dirExists) {
        return null;
      }

      console.log(`${MODULE_ID} | Converting base64 data to blob...`);

      // Convert base64 to blob
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/png' });
      console.log(`${MODULE_ID} | Image blob size: ${blob.size} bytes`);

      // Generate unique filename
      const filename = this.generateFilename(npcName);
      const targetPath = `${IMAGE_FOLDER}/${PORTRAITS_SUBFOLDER}`;

      // Convert blob to File object
      const file = new File([blob], filename, { type: 'image/png' });
      console.log(`${MODULE_ID} | Created file object: ${filename}`);

      // Upload to Foundry file system
      console.log(`${MODULE_ID} | Uploading to: ${targetPath}/${filename}`);
      const uploadResponse = await FilePicker.upload('data', targetPath, file, {});
      console.log(`${MODULE_ID} | Upload response:`, uploadResponse);

      if (uploadResponse && uploadResponse.path) {
        console.log(`${MODULE_ID} | Saved portrait to: ${uploadResponse.path}`);
        return uploadResponse.path;
      }

      throw new Error('Upload response did not contain a path');
    } catch (error: any) {
      console.error(`${MODULE_ID} | Failed to save base64 image:`, error);
      console.error(`${MODULE_ID} | Error details:`, {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      return null;
    }
  }

  /**
   * Download image from URL and save to local file system
   * @param imageUrl - The temporary URL from OpenAI
   * @param npcName - Name of the NPC (used for filename)
   * @returns Local file path or null if failed
   */
  static async downloadAndSave(imageUrl: string, npcName: string): Promise<string | null> {
    try {
      // Ensure directory exists
      const dirExists = await this.ensureImageDirectory();
      if (!dirExists) {
        return null;
      }

      // Try downloading image directly first (Foundry is Electron-based, may not need CORS)
      console.log(`${MODULE_ID} | Attempting to download image from URL...`);

      let response: Response;
      try {
        // Try direct fetch first
        response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Direct fetch failed: ${response.status} ${response.statusText}`);
        }
        console.log(`${MODULE_ID} | Direct fetch successful`);
      } catch (directError) {
        console.warn(`${MODULE_ID} | Direct fetch failed, trying CORS proxy...`, directError);

        // Fall back to CORS proxy
        const corsProxy = 'https://corsproxy.io/?';
        const proxiedUrl = corsProxy + encodeURIComponent(imageUrl);

        response = await fetch(proxiedUrl);
        if (!response.ok) {
          throw new Error(`CORS proxy fetch failed: ${response.status} ${response.statusText}`);
        }
        console.log(`${MODULE_ID} | CORS proxy fetch successful`);
      }

      const blob = await response.blob();
      console.log(`${MODULE_ID} | Image blob size: ${blob.size} bytes`);

      // Generate unique filename
      const filename = this.generateFilename(npcName);
      const targetPath = `${IMAGE_FOLDER}/${PORTRAITS_SUBFOLDER}`;

      // Convert blob to File object
      const file = new File([blob], filename, { type: 'image/png' });
      console.log(`${MODULE_ID} | Created file object: ${filename}`);

      // Upload to Foundry file system
      console.log(`${MODULE_ID} | Uploading to: ${targetPath}/${filename}`);
      const uploadResponse = await FilePicker.upload('data', targetPath, file, {});
      console.log(`${MODULE_ID} | Upload response:`, uploadResponse);

      if (uploadResponse && uploadResponse.path) {
        console.log(`${MODULE_ID} | Saved portrait to: ${uploadResponse.path}`);
        return uploadResponse.path;
      }

      throw new Error('Upload response did not contain a path');
    } catch (error: any) {
      console.error(`${MODULE_ID} | Failed to download and save image:`, error);
      console.error(`${MODULE_ID} | Error details:`, {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      return null;
    }
  }

  /**
   * Generate a unique filename for the portrait
   * @param npcName - Name of the NPC
   * @returns Filename with timestamp
   */
  private static generateFilename(npcName: string): string {
    // Sanitize NPC name for filename (remove special characters)
    const sanitizedName = npcName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30); // Limit length

    // Add timestamp for uniqueness
    const timestamp = Date.now();

    return `${sanitizedName}_${timestamp}.png`;
  }

  /**
   * Get the full path to the portraits directory
   */
  static getPortraitsPath(): string {
    return `${IMAGE_FOLDER}/${PORTRAITS_SUBFOLDER}`;
  }
}
