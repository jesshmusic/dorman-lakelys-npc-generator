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

      // Download image from URL using CORS proxy (same as AIService)
      const corsProxy = 'https://corsproxy.io/?';
      const proxiedUrl = corsProxy + imageUrl;

      const response = await fetch(proxiedUrl);
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Generate unique filename
      const filename = this.generateFilename(npcName);
      const targetPath = `${IMAGE_FOLDER}/${PORTRAITS_SUBFOLDER}`;

      // Convert blob to File object
      const file = new File([blob], filename, { type: 'image/png' });

      // Upload to Foundry file system
      const uploadResponse = await FilePicker.upload('data', targetPath, file, {});

      if (uploadResponse && uploadResponse.path) {
        console.log(`${MODULE_ID} | Saved portrait to: ${uploadResponse.path}`);
        return uploadResponse.path;
      }

      throw new Error('Upload response did not contain a path');
    } catch (error) {
      console.error(`${MODULE_ID} | Failed to download and save image:`, error);
      ui.notifications?.error('Failed to save generated portrait. Check console for details.');
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
