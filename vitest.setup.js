import { vi } from 'vitest';

// ============================================================================
// MOCK MONGOOSE.STARTSESSION — Session transactions support (via spyOn)
// ============================================================================
// Use spyOn approach since controllers import mongoose at module level
import mongoose from 'mongoose';

// Create the mock session object
const createMockSession = () => ({
  startTransaction: vi.fn().mockResolvedValue(undefined),
  commitTransaction: vi.fn().mockResolvedValue(undefined),
  abortTransaction: vi.fn().mockResolvedValue(undefined),
  endSession: vi.fn().mockResolvedValue(undefined),
  withTransaction: vi.fn(async (callback) => {
    try {
      return await callback(createMockSession());
    } catch (error) {
      throw error;
    }
  }),
});

// Replace mongoose.startSession with our mock
vi.spyOn(mongoose, 'startSession').mockImplementation(async () => createMockSession());

// ============================================================================
// GLOBAL TEST SETUP
// ============================================================================

// Mock localStorage for frontend-style tests
const localStorageMock = {
  store: {},
  getItem: vi.fn((key) => localStorageMock.store[key] || null),
  setItem: vi.fn((key, value) => {
    localStorageMock.store[key] = String(value);
  }),
  removeItem: vi.fn((key) => {
    delete localStorageMock.store[key];
  }),
  clear: vi.fn(() => {
    localStorageMock.store = {};
  }),
};

if (typeof global !== 'undefined' && !global.localStorage) {
  Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
  });
}

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.store = {};
});
