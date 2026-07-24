import { AllExceptionsFilter } from './all-exceptions.filter';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockRequest: { method: string; url: string };
  let mockHost: {
    switchToHttp: jest.Mock;
  };

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockResponse = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockRequest = { method: 'POST', url: '/api/sales' };
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle HttpException with correct status', () => {
    const exception = new HttpException('Bad request', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockHost as never);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalled();
  });

  it('should handle NotFoundException (404)', () => {
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);
    filter.catch(exception, mockHost as never);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
  });

  it('should handle unknown errors as 500', () => {
    filter.catch(new Error('Something went wrong'), mockHost as never);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Error') }),
    );
  });

  it('should handle string exceptions', () => {
    filter.catch('plain string error', mockHost as never);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
  });

  it('should handle null exceptions', () => {
    filter.catch(null, mockHost as never);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
  });
});
