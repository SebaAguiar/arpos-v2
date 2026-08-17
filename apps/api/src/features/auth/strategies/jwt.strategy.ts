import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthRepository } from '../auth.repository';

export interface JwtPayload {
  sub: string;
  companyId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authRepo: AuthRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'arcom-local-dev-secret'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.authRepo.findById(payload.sub);

    return {
      id: payload.sub,
      companyId: payload.companyId,
      user,
    };
  }
}
