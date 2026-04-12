// src/app/auth/auth.service.ts

import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { User, UserDocument } from '../../models/user.models';
import { SignupDto } from './dto/signup-dto';
import { CustomerException } from '../../common/exceptions/custom.exception';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  // ─────────────────────────────────────────────────────────────────
  // TOKEN GENERATION
  // ─────────────────────────────────────────────────────────────────
  async generateTokens(userId: string, role: string) {
    const payload = { sub: userId, role };

    const accessSecret  = this.configService.get<string>('AUTH_JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.get<string>('AUTH_JWT_REFRESH_SECRET');
    const accessExpires  = this.configService.get<string>('AUTH_JWT_EXPIRES_IN') || '15m';
    const refreshExpires = this.configService.get<string>('AUTH_JWT_REFRESH_EXPIRES_IN') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { secret: accessSecret,  expiresIn: accessExpires  }),
      this.jwtService.signAsync(payload, { secret: refreshSecret, expiresIn: refreshExpires }),
    ]);

    return { accessToken, refreshToken };
  }

  // ─────────────────────────────────────────────────────────────────
  // STORE HASHED REFRESH TOKEN
  // ─────────────────────────────────────────────────────────────────
  async updateRefreshToken(userId: string, refreshToken: string | null) {
    const hashedRefreshToken = refreshToken
      ? await bcrypt.hash(refreshToken, 10)
      : null;
    await this.userModel.findByIdAndUpdate(userId, { hashedRefreshToken });
  }

  // ─────────────────────────────────────────────────────────────────
  // LOCAL AUTH VALIDATION
  // ─────────────────────────────────────────────────────────────────
  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) return null;

    if (!user.password) return null;  // 👈 fixed — removed broken backtick

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    return user;
  }

  // ─────────────────────────────────────────────────────────────────
  // GOOGLE AUTH
  // ─────────────────────────────────────────────────────────────────
  async findOrCreateGoogleUser(profile: any) {
    const { id, emails, photos } = profile;
    const email = emails[0].value;

    let user = await this.userModel.findOne({ email });

    if (!user) {
      let baseUsername = email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');

      let username = baseUsername;
      let counter  = 1;

      while (await this.userModel.findOne({ username })) {
        username = `${baseUsername}${counter}`;  // 👈 fixed template literal
        counter++;
      }

      user = new this.userModel({
        googleId: id,
        email,
        username,
        picture: photos[0]?.value,
        role: 'user',
      });

      await user.save();
    } else if (!user.googleId) {
      user.googleId = id;
      user.picture  = photos[0]?.value;
      await user.save();
    }

    const tokens = await this.generateTokens(user._id.toString(), user.role);
    await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: {
        id:       user._id,
        email:    user.email,
        username: user.username,
        role:     user.role,
        picture:  user.picture,
      },
      ...tokens,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // SIGNUP
  // ─────────────────────────────────────────────────────────────────
  async signup(dto: SignupDto) {
    const existing = await this.userModel.findOne({ email: dto.email });
    if (existing) {
      throw new CustomerException('Email exists', HttpStatus.CONFLICT);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = new this.userModel({ ...dto, password: hashedPassword });
    await user.save();

    return { message: 'User registered' };
  }

  // ─────────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────────
  async login(user: any) {
    const userId = (user._id || user.id)?.toString();
    if (!userId) throw new Error('No userId');

    const tokens = await this.generateTokens(userId, user.role || 'user');
    await this.updateRefreshToken(userId, tokens.refreshToken);

    return {
      user: {
        id:       userId,
        email:    user.email,
        username: user.username,
        role:     user.role,
      },
      accessToken:  tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // ─────────────────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────────────────
  async logout(userId: string) {
    await this.updateRefreshToken(userId, null);
  }

  // ─────────────────────────────────────────────────────────────────
  // REFRESH TOKEN
  // ─────────────────────────────────────────────────────────────────
  async refresh(oldRefreshToken: string) {
    try {
      const refreshSecret = this.configService.get<string>('auth.jwt.refreshSecret');

      const payload = await this.jwtService.verifyAsync(oldRefreshToken, {
        secret: refreshSecret,
      });

      const user = await this.userModel.findById(payload.sub);
      if (!user || !user.hashedRefreshToken) {
        throw new CustomerException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
      }

      const isMatch = await bcrypt.compare(oldRefreshToken, user.hashedRefreshToken);
      if (!isMatch) {
        throw new CustomerException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
      }

      const tokens = await this.generateTokens(user._id.toString(), user.role);
      await this.updateRefreshToken(user._id.toString(), tokens.refreshToken);

      return tokens;
    } catch {
      throw new CustomerException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // FORGOT PASSWORD
  // ─────────────────────────────────────────────────────────────────
  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });

    if (!user) {
      return { message: 'If this email exists, a reset link has been sent.' };
    }

    const resetToken  = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.passwordResetToken   = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetUrl    = `${frontendUrl}/auth/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;  // 👈 fixed

    await this.mailService.sendPasswordResetEmail(email, resetUrl, user.username);

    return { message: 'If this email exists, a reset link has been sent.' };
  }

  // ─────────────────────────────────────────────────────────────────
  // RESET PASSWORD
  // ─────────────────────────────────────────────────────────────────
  async resetPassword(email: string, token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.userModel.findOne({
      email,
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new CustomerException('Invalid or expired reset token', HttpStatus.BAD_REQUEST);
    }

    user.password             = await bcrypt.hash(newPassword, 10);
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    return { message: 'Password reset successfully. You can now log in.' };
  }
}