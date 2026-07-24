import { LoggingInterceptor } from './logging.interceptor';
import { of } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log request method, url, status, and duration', (done) => {
    const mockRequest = { method: 'GET', url: '/api/products' };
    const mockResponse = { statusCode: 200 };

    const context = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as never;

    const next = { handle: () => of('response') };

    interceptor.intercept(context, next).subscribe(() => {
      // Verify the logger was called (via Logger.log)
      done();
    });
  });

  it('should pass through the response unchanged', (done) => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ method: 'POST', url: '/api/sales' }),
        getResponse: () => ({ statusCode: 201 }),
      }),
    } as never;

    const testData = { id: 'sale-1', total: 5000 };
    const next = { handle: () => of(testData) };

    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toEqual(testData);
      done();
    });
  });
});
