import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'JWT_SECRET',
        'changeme_jwt_secret_dev_only_min_32_chars_xxxx',
      ),
    });
  }

  async validate(payload: { sub: string; email: string; isSuperAdmin?: boolean }) {
    return { userId: payload.sub, email: payload.email, isSuperAdmin: !!payload.isSuperAdmin };
  }
}

