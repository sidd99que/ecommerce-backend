// src/auth/strategies/local.strategy.ts   (or src/app/auth/strategies/local.strategy.ts)

import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service'; // ← adjust path if needed

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    

    const user = await this.authService.validateUser(email, password);

    if (!user) {
      
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}