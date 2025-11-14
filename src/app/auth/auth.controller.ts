import { Controller, Post, Body, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup-dto';
import { LoginDto } from './dto/login-dto';
import type { Response, Request } from 'express';
import { UnauthorizedException } from '@nestjs/common';



@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ✅ Signup
  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  // ✅ Login
  @Post('login')
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.login(dto);

    // Store refresh token in cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false, // ⚠️ set true in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return {
      message: 'User login successfully ✅',
      accessToken,
      refreshToken,
    };
  }

  // ✅ Refresh
  // auth.controller.ts
@Post('refresh')
async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
  const oldRefreshToken = req.cookies?.refreshToken;
  if (!oldRefreshToken) {
    throw new UnauthorizedException('No refresh token found');
  }

  const { accessToken, refreshToken } = await this.authService.refresh(oldRefreshToken);

  // 🔄 Rotate refresh token: replace cookie with new one
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: false, // true in production (HTTPS only)
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return {
    message: 'Token refreshed successfully ✅',
    accessToken,
  };
}


  // 🚀 Logout
  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: false, // ⚠️ true in production
      sameSite: 'strict',
    });

    return { message: 'User logged out successfully ✅' };
  }
}
