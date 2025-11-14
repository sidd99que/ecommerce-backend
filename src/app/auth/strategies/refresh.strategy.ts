// auth/strategies/refresh.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req.cookies?.refreshToken, // ✅ read from cookie
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true, // so we can access the cookie
    } as import('passport-jwt').StrategyOptionsWithRequest);
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.cookies?.refreshToken;
    return { userId: payload.sub, role: payload.role, refreshToken };
  }
}
