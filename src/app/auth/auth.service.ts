import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../models/user.models';
import { SignupDto } from './dto/signup-dto';
import { LoginDto } from './dto/login-dto';
import { CustomerException } from '../../common/exceptions/custom.exception';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  // ✅ Generate access + refresh tokens
  private getTokens(userId: string, role: string) {
    const payload = { sub: userId, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return { accessToken, refreshToken };
  }

  // ✅ Signup
  async signup(dto: SignupDto) {
    const { username, email, password } = dto;

    const existing = await this.userModel.findOne({ email });
    if (existing) {
      throw new CustomerException(
        'Email already registered',
        HttpStatus.CONFLICT,
      );
    }

    const hash = await bcrypt.hash(password, 10);

    const user = new this.userModel({
      username,
      email,
      password: hash,
    });
    await user.save();

    return { message: 'User registered successfully 🎉' };
  }

  // ✅ Login
  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new CustomerException(
       "User does not exist",
        HttpStatus.NOT_FOUND, // ✅ 404 Not Found
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new CustomerException(
          "Invalid password",
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.getTokens(user._id.toString(), user.role);
  }

  // ✅ Refresh
  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET,
      });

      return this.getTokens(payload.sub, payload.role);
    } catch {
      throw new CustomerException(
        'Invalid refresh token',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
