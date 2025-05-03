import { jest } from '@jest/globals';

// Mock document
export const mockDocument = {
  save: jest.fn().mockResolvedValue(this),
  toJSON: jest.fn().mockReturnValue({}),
  toObject: jest.fn().mockReturnValue({})
};

// Mock model operations
export const mockModelOperations = {
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  findById: jest.fn().mockReturnThis(),
  findByIdAndUpdate: jest.fn().mockReturnThis(),
  findByIdAndDelete: jest.fn().mockReturnThis(),
  findOneAndUpdate: jest.fn().mockReturnThis(),
  updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
  create: jest.fn().mockImplementation((data) => ({ ...data, ...mockDocument })),
  sort: jest.fn().mockReturnThis(),
  lean: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
  populate: jest.fn().mockReturnThis()
};

// Mongoose model mock factory
export const createModelMock = (returnData) => {
  const modelMock = function() {
    return { ...mockDocument, ...returnData };
  };
  
  // Add static methods
  Object.assign(modelMock, { ...mockModelOperations });
  
  // Allow customization of exec return values
  modelMock.exec.mockImplementation(() => Promise.resolve(returnData));
  modelMock.findOne.mockImplementation(() => ({
    ...mockModelOperations,
    exec: jest.fn().mockResolvedValue(returnData)
  }));
  
  return modelMock;
};

// Reset all mocks
export const resetMongooseMocks = () => {
  Object.values(mockDocument).forEach(mock => {
    if (typeof mock === 'function' && mock.mockClear) {
      mock.mockClear();
    }
  });
  
  Object.values(mockModelOperations).forEach(mock => {
    if (typeof mock === 'function' && mock.mockClear) {
      mock.mockClear();
    }
  });
}; 