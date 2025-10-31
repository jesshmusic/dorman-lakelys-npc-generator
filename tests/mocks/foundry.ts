/**
 * Mock Foundry VTT globals for testing
 */

import { jest } from '@jest/globals';

export function mockFoundry() {
  // Mock foundry.utils
  (global as any).foundry = {
    utils: {
      randomID: jest.fn(() => 'mock-id-' + Math.random().toString(36).substring(7)),
      mergeObject: jest.fn((original: any, other: any) => ({ ...original, ...other }))
    },
    applications: {
      api: {
        ApplicationV2: class MockApplicationV2 {
          static DEFAULT_OPTIONS = {};
          static PARTS = {};
          element: any = null;
          rendered = false;

          constructor() {}

          async render(_force?: boolean) {
            this.rendered = true;
            return this;
          }

          async close() {
            this.rendered = false;
          }

          async _prepareContext(_options: any) {
            return {};
          }

          _onRender(_context: any, _options: any) {}
          _onClose(_options: any) {}
        },
        HandlebarsApplicationMixin: (Base: any) => {
          return class extends Base {
            static PARTS = Base.PARTS || {};
          };
        }
      }
    }
  };

  // Mock game object
  (global as any).game = {
    user: {
      isGM: true
    },
    settings: {
      register: jest.fn(),
      get: jest.fn((module: string, key: string) => {
        const defaults: Record<string, any> = {
          enableAI: true,
          openaiApiKey: 'test-api-key',
          openaiModel: 'gpt-4o-mini',
          portraitArtStyle: 'fantasy painting',
          nameTemperature: 1.0,
          bioTemperature: 0.8,
          portraitTemperature: 0.9
        };
        return defaults[key] || null;
      }),
      set: jest.fn()
    },
    i18n: {
      localize: jest.fn((key: string) => key)
    },
    packs: new Map(),
    actors: {
      importFromCompendium: jest.fn()
    },
    folders: new Map()
  };

  // Mock ui object
  (global as any).ui = {
    notifications: {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      success: jest.fn()
    }
  };

  // Mock FilePicker
  (global as any).FilePicker = jest.fn().mockImplementation(() => ({
    browse: jest.fn(),
    upload: jest.fn(async () => ({ path: '/mock/path/image.png' }))
  }));

  // Mock fetch for API calls
  (global as any).fetch = jest.fn();

  // Mock atob for base64 decoding
  (global as any).atob = jest.fn((str: string) => Buffer.from(str, 'base64').toString('binary'));

  // Mock Blob and File for image handling
  (global as any).Blob = class MockBlob {
    constructor(
      public parts: any[],
      public options?: any
    ) {}
  };

  (global as any).File = class MockFile extends (global as any).Blob {
    constructor(
      parts: any[],
      public name: string,
      options?: any
    ) {
      super(parts, options);
    }
  };

  // Mock Actor class
  (global as any).Actor = {
    create: jest.fn(async (data: any) => ({
      ...data,
      id: foundry.utils.randomID(),
      createEmbeddedDocuments: jest.fn(async () => []),
      delete: jest.fn(async () => {}),
      sheet: { render: jest.fn() }
    }))
  };
}

/**
 * Create a mock compendium pack for testing
 */
export function createMockCompendium(id: string, type: string) {
  const documents = new Map();

  return {
    metadata: {
      id,
      name: `Test ${type} Compendium`,
      type,
      package: 'dnd5e'
    },
    index: [],
    getDocument: jest.fn(async (docId: string) => documents.get(docId)),
    getDocuments: jest.fn(async () => Array.from(documents.values())),
    importDocument: jest.fn(async (doc: any) => ({ ...doc, pack: id }))
  };
}
