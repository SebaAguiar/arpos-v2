import { KanjijsModule } from '@kanjijs/core';
import { AuthModule } from '@kanjijs/auth';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

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
