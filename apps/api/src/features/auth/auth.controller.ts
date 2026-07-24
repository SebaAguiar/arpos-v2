import { Controller, Post, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './guards/public.decorator';
import { ZodBody } from '../../core/validation/zod-body.decorator';
import { LoginSchema, LoginInput } from './dto/login.schema';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@ZodBody(LoginSchema) input: LoginInput) {
    const user = await this.authService.validateUser(input.email, input.password);

    if (!user) {
      return { message: 'Invalid credentials', statusCode: 401 };
    }

    return this.authService.login(user);
  }

  @Get('me')
  async getProfile(@Request() req: { user: { id: string } }) {
    return this.authService.getProfile(req.user.id);
  }
}
