import { ExecutionContext } from '@nestjs/common';
import { SidecarTokenGuard, SIDECAR_TOKEN_HEADER } from './sidecar-token.guard';

describe('SidecarTokenGuard', () => {
  let guard: SidecarTokenGuard;
  const originalToken = process.env.ARCOM_BACKEND_TOKEN;

  afterEach(() => {
    if (originalToken === undefined) {
      delete process.env.ARCOM_BACKEND_TOKEN;
    } else {
      process.env.ARCOM_BACKEND_TOKEN = originalToken;
    }
  });

  function createMockContext(headerValue?: string | string[] | undefined) {
    const request = {
      headers: headerValue === undefined ? {} : { [SIDECAR_TOKEN_HEADER]: headerValue },
    };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  it('should be inert when no token was injected (web development / tests)', () => {
    delete process.env.ARCOM_BACKEND_TOKEN;
    guard = new SidecarTokenGuard();

    expect(guard.canActivate(createMockContext(undefined))).toBe(true);
    expect(guard.canActivate(createMockContext('anything'))).toBe(true);
  });

  it('should reject requests missing the sidecar token when the backend runs with one', () => {
    process.env.ARCOM_BACKEND_TOKEN = '0123456789abcdef0123456789abcdef';
    guard = new SidecarTokenGuard();

    expect(guard.canActivate(createMockContext(undefined))).toBe(false);
  });

  it('should reject requests with a wrong token (timing-safe comparison)', () => {
    process.env.ARCOM_BACKEND_TOKEN = '0123456789abcdef0123456789abcdef';
    guard = new SidecarTokenGuard();

    expect(guard.canActivate(createMockContext('ffffffffffffffffffffffffffffffff'))).toBe(false);
  });

  it('should reject array-form tokens (header smuggling)', () => {
    process.env.ARCOM_BACKEND_TOKEN = '0123456789abcdef0123456789abcdef';
    guard = new SidecarTokenGuard();

    expect(guard.canActivate(createMockContext(['token-a', 'token-b']))).toBe(false);
  });

  it('should accept the exact matching token', () => {
    process.env.ARCOM_BACKEND_TOKEN = '0123456789abcdef0123456789abcdef';
    guard = new SidecarTokenGuard();

    expect(guard.canActivate(createMockContext('0123456789abcdef0123456789abcdef'))).toBe(true);
  });
});