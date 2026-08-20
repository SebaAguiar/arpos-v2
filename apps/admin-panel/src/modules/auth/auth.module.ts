import { KanjijsModule } from '@kanjijs/core';
import { AuthModule } from '@kanjijs/auth';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  console.warn('[Auth] JWT_SECRET not set — using default dev secret');
}

const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-in-production';

@KanjijsModule({
  imports: [
    AuthModule.forRoot({ jwtSecret }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AdminAuthModule {}
