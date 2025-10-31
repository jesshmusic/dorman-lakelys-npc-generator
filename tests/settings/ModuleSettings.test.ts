/**
 * Tests for ModuleSettings.ts
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { registerSettings } from '../../src/settings/ModuleSettings';

describe('ModuleSettings', () => {
  beforeEach(() => {
    // Reset mock calls before each test
    jest.clearAllMocks();
  });

  describe('registerSettings', () => {
    it('should register all AI settings', () => {
      registerSettings();

      const mockRegister = (game.settings as any).register;

      // Verify enableAI was registered
      expect(mockRegister).toHaveBeenCalledWith(
        'dorman-lakelys-npc-generator',
        'enableAI',
        expect.objectContaining({
          name: 'Enable AI Features',
          scope: 'world',
          config: true,
          type: Boolean,
          default: false,
          requiresReload: true
        })
      );

      // Verify openaiApiKey was registered
      expect(mockRegister).toHaveBeenCalledWith(
        'dorman-lakelys-npc-generator',
        'openaiApiKey',
        expect.objectContaining({
          name: 'OpenAI API Key',
          scope: 'world',
          config: true,
          type: String,
          default: ''
        })
      );

      // Verify openaiModel was registered
      expect(mockRegister).toHaveBeenCalledWith(
        'dorman-lakelys-npc-generator',
        'openaiModel',
        expect.objectContaining({
          name: 'OpenAI Model',
          scope: 'world',
          config: true,
          type: String,
          default: 'gpt-4o-mini'
        })
      );
    });

    it('should register portrait art style setting', () => {
      registerSettings();

      const mockRegister = (game.settings as any).register;

      expect(mockRegister).toHaveBeenCalledWith(
        'dorman-lakelys-npc-generator',
        'portraitArtStyle',
        expect.objectContaining({
          name: 'Portrait Art Style',
          scope: 'world',
          config: true,
          type: String,
          default: 'fantasy painting',
          choices: expect.objectContaining({
            'fantasy painting': expect.any(String),
            'fantasy realistic': expect.any(String),
            'fantasy painterly': expect.any(String)
          })
        })
      );
    });

    it('should register temperature settings', () => {
      registerSettings();

      const mockRegister = (game.settings as any).register;

      // Verify nameTemperature
      expect(mockRegister).toHaveBeenCalledWith(
        'dorman-lakelys-npc-generator',
        'nameTemperature',
        expect.objectContaining({
          name: 'Name Generation Randomness',
          scope: 'world',
          config: true,
          type: Number,
          default: 1.0,
          range: expect.objectContaining({
            min: 0.0,
            max: 2.0,
            step: 0.1
          })
        })
      );

      // Verify bioTemperature
      expect(mockRegister).toHaveBeenCalledWith(
        'dorman-lakelys-npc-generator',
        'bioTemperature',
        expect.objectContaining({
          name: 'Biography Generation Randomness',
          scope: 'world',
          config: true,
          type: Number,
          default: 0.8
        })
      );

      // Verify portraitTemperature
      expect(mockRegister).toHaveBeenCalledWith(
        'dorman-lakelys-npc-generator',
        'portraitTemperature',
        expect.objectContaining({
          name: 'Portrait Prompt Randomness',
          scope: 'world',
          config: true,
          type: Number,
          default: 0.9
        })
      );
    });

    it('should register exactly 7 settings', () => {
      registerSettings();

      const mockRegister = (game.settings as any).register;

      // enableAI, openaiApiKey, openaiModel, portraitArtStyle,
      // nameTemperature, bioTemperature, portraitTemperature, debugMode
      expect(mockRegister).toHaveBeenCalledTimes(8);
    });

    it('should handle missing game.settings gracefully', () => {
      const originalSettings = (global as any).game.settings;
      (global as any).game.settings = null;

      expect(() => registerSettings()).not.toThrow();

      (global as any).game.settings = originalSettings;
    });
  });
});
