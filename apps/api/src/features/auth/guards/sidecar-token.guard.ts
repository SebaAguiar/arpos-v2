import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { timingSafeEqual } from 'node:crypto';

export const SIDECAR_TOKEN_HEADER = 'x-arcom-api-token';

/**
 * First line of defense for the local sidecar backend.
 *
 * When the launcher spawns the backend it injects ARCOM_BACKEND_TOKEN and
 * every request coming from the desktop app carries it in the
 * `x-arcom-api-token` header. Any other process (e.g. a dev server squatting
 * on the same port, or a web client) cannot guess the token.
 *
 * The guard is conditional by design: if no token was injected (plain
 * `npm run start:dev` during development, or the test suite) it is inert, so
 * the existing auth flow keeps working untouched.
 */
@Injectable()
export class SidecarTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.ARCOM_BACKEND_TOKEN;
    if (!expected) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers[SIDECAR_TOKEN_HEADER];
    if (typeof provided !== 'string' || provided.length === 0) return false;

    // timingSafeEqual requires same-length buffers. Pad both to a fixed
    // length so the token length itself is not observable through request
    // latency or a length-mismatch throw.
    const expectedBytes = Buffer.from(expected, 'utf8');
    const providedBytes = Buffer.from(provided, 'utf8');
    const bufferSize = Math.max(expectedBytes.length, providedBytes.length, 1);

    const a = Buffer.alloc(bufferSize);
    const b = Buffer.alloc(bufferSize);
    expectedBytes.copy(a);
    providedBytes.copy(b);

    return timingSafeEqual(a, b);
  }
}