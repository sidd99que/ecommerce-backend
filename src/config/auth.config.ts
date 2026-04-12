// src/config/auth.config.ts   (new file — optional but clean)
import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  jwt: {
    accessSecret: process.env.AUTH_JWT_ACCESS_SECRET,
    refreshSecret: process.env.AUTH_JWT_REFRESH_SECRET,
    expiresIn: process.env.AUTH_JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.AUTH_JWT_REFRESH_EXPIRES_IN || '7d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
}));