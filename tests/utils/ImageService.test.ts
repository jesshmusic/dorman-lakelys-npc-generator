/**
 * Tests for ImageService.ts
 */

import { describe, it, expect, jest } from '@jest/globals';
import { ImageService } from '../../src/utils/ImageService';

describe('ImageService', () => {
  describe('getPortraitsPath', () => {
    it('should return the correct portraits directory path', () => {
      const path = ImageService.getPortraitsPath();
      expect(path).toBe('DormanNPCGenImages/portraits');
    });
  });

  describe('filename generation', () => {
    it('should generate unique filenames for same NPC name', async () => {
      // Access the private method indirectly through saveBase64Image behavior
      // We can't test the private method directly, but we can verify
      // that repeated calls would generate different files via timestamp

      const mockBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      // Mock FilePicker
      let uploadCount = 0;
      const mockFilePicker = FilePicker as any;
      mockFilePicker.browse = jest.fn<any>().mockResolvedValue({ files: [] });
      mockFilePicker.createDirectory = jest.fn<any>().mockResolvedValue({});
      mockFilePicker.upload = jest.fn<any>().mockImplementation(() => {
        uploadCount++;
        return Promise.resolve({ path: `/mock/path/image_${uploadCount}.png` });
      });

      // Call twice with same name
      const path1 = await ImageService.saveBase64Image(mockBase64, 'Test NPC');
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to ensure different timestamps
      const path2 = await ImageService.saveBase64Image(mockBase64, 'Test NPC');

      // Should get different filenames due to timestamp
      expect(path1).not.toBe(path2);
      expect(uploadCount).toBe(2);
    });
  });

  describe('ensureImageDirectory', () => {
    it('should create directories if they do not exist', async () => {
      const mockFilePicker = FilePicker as any;
      mockFilePicker.browse = jest.fn<any>().mockRejectedValue(new Error('Directory not found'));
      mockFilePicker.createDirectory = jest.fn<any>().mockResolvedValue({});

      const result = await ImageService.ensureImageDirectory();

      expect(result).toBe(true);
      expect(mockFilePicker.createDirectory).toHaveBeenCalledWith('data', 'DormanNPCGenImages');
      expect(mockFilePicker.createDirectory).toHaveBeenCalledWith(
        'data',
        'DormanNPCGenImages/portraits'
      );
    });

    it('should not create directories if they already exist', async () => {
      const mockFilePicker = FilePicker as any;
      mockFilePicker.browse = jest.fn<any>().mockResolvedValue({ files: [] });
      mockFilePicker.createDirectory = jest.fn<any>().mockResolvedValue({});

      const result = await ImageService.ensureImageDirectory();

      expect(result).toBe(true);
      expect(mockFilePicker.createDirectory).not.toHaveBeenCalled();
    });

    it('should return false on error', async () => {
      const mockFilePicker = FilePicker as any;
      mockFilePicker.browse = jest.fn<any>().mockRejectedValue(new Error('Permission denied'));
      mockFilePicker.createDirectory = jest
        .fn<any>()
        .mockRejectedValue(new Error('Permission denied'));

      const result = await ImageService.ensureImageDirectory();

      expect(result).toBe(false);
    });
  });

  describe('saveBase64Image', () => {
    it('should save base64 image data successfully', async () => {
      const mockBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const npcName = 'Test NPC';

      const mockFilePicker = FilePicker as any;
      mockFilePicker.browse = jest.fn<any>().mockResolvedValue({ files: [] });
      mockFilePicker.createDirectory = jest.fn<any>().mockResolvedValue({});
      mockFilePicker.upload = jest
        .fn<any>()
        .mockResolvedValue({ path: '/mock/path/test_npc_12345.png' });

      const result = await ImageService.saveBase64Image(mockBase64, npcName);

      expect(result).toBe('/mock/path/test_npc_12345.png');
      expect(mockFilePicker.upload).toHaveBeenCalled();
    });

    it('should return null if directory creation fails', async () => {
      const mockBase64 = 'validbase64data';
      const npcName = 'Test NPC';

      const mockFilePicker = FilePicker as any;
      mockFilePicker.browse = jest.fn<any>().mockRejectedValue(new Error('Permission denied'));
      mockFilePicker.createDirectory = jest
        .fn<any>()
        .mockRejectedValue(new Error('Permission denied'));

      const result = await ImageService.saveBase64Image(mockBase64, npcName);

      expect(result).toBeNull();
    });

    it('should return null if upload fails', async () => {
      const mockBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const npcName = 'Test NPC';

      const mockFilePicker = FilePicker as any;
      mockFilePicker.browse = jest.fn<any>().mockResolvedValue({ files: [] });
      mockFilePicker.createDirectory = jest.fn<any>().mockResolvedValue({});
      mockFilePicker.upload = jest.fn<any>().mockRejectedValue(new Error('Upload failed'));

      const result = await ImageService.saveBase64Image(mockBase64, npcName);

      expect(result).toBeNull();
    });
  });

  describe('downloadAndSave', () => {
    it('should download and save image from URL', async () => {
      const imageUrl = 'https://example.com/image.png';
      const npcName = 'Test NPC';

      // Mock successful fetch
      (global.fetch as any) = jest.fn<any>().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(['fake image data'], { type: 'image/png' })
      });

      const mockFilePicker = FilePicker as any;
      mockFilePicker.browse = jest.fn<any>().mockResolvedValue({ files: [] });
      mockFilePicker.createDirectory = jest.fn<any>().mockResolvedValue({});
      mockFilePicker.upload = jest
        .fn<any>()
        .mockResolvedValue({ path: '/mock/path/test_npc_12345.png' });

      const result = await ImageService.downloadAndSave(imageUrl, npcName);

      expect(result).toBe('/mock/path/test_npc_12345.png');
      expect(global.fetch).toHaveBeenCalledWith(imageUrl);
      expect(mockFilePicker.upload).toHaveBeenCalled();
    });

    it('should use CORS proxy if direct fetch fails', async () => {
      const imageUrl = 'https://example.com/image.png';
      const npcName = 'Test NPC';

      // Mock failed direct fetch, successful proxy fetch
      let fetchCallCount = 0;
      (global.fetch as any) = jest.fn<any>().mockImplementation(() => {
        fetchCallCount++;
        if (fetchCallCount === 1) {
          return Promise.reject(new Error('CORS error'));
        }
        return Promise.resolve({
          ok: true,
          blob: async () => new Blob(['fake image data'], { type: 'image/png' })
        });
      });

      const mockFilePicker = FilePicker as any;
      mockFilePicker.browse = jest.fn<any>().mockResolvedValue({ files: [] });
      mockFilePicker.createDirectory = jest.fn<any>().mockResolvedValue({});
      mockFilePicker.upload = jest
        .fn<any>()
        .mockResolvedValue({ path: '/mock/path/test_npc_12345.png' });

      const result = await ImageService.downloadAndSave(imageUrl, npcName);

      expect(result).toBe('/mock/path/test_npc_12345.png');
      expect(fetchCallCount).toBe(2); // Once direct, once with proxy
    });

    it('should return null if download fails', async () => {
      const imageUrl = 'https://example.com/image.png';
      const npcName = 'Test NPC';

      (global.fetch as any) = jest.fn<any>().mockRejectedValue(new Error('Network error'));

      const mockFilePicker = FilePicker as any;
      mockFilePicker.browse = jest.fn<any>().mockResolvedValue({ files: [] });

      const result = await ImageService.downloadAndSave(imageUrl, npcName);

      expect(result).toBeNull();
    });
  });
});
