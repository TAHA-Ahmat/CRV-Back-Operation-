import { vi } from 'vitest';
import mongoose from 'mongoose';

// Mock mongoose.startSession for test environment
vi.mock('mongoose', async () => {
  const actual = await vi.importActual('mongoose');
  return {
    ...actual,
    startSession: vi.fn(() => ({
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      abortTransaction: vi.fn(),
      endSession: vi.fn(),
    })),
  };
});

// Mock MongoDB connection in test environment
mongoose.connect = vi.fn().mockResolvedValue(undefined);
mongoose.disconnect = vi.fn().mockResolvedValue(undefined);
