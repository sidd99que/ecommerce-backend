import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto'; // ✅ built into Node.js, no install needed

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();
    const isDev = process.env.NODE_ENV !== 'production';

    // ✅ Generate unique ID for this request
    const requestId = randomUUID(); // e.g. "a1b2c3d4-e5f6-..."
    req['requestId'] = requestId;                    // attach to req object
    res.setHeader('X-Request-ID', requestId);        // send back to client too

    // ✅ Log now includes request ID
    if (isDev) {
      this.logger.log(`[${requestId}] → ${method} ${originalUrl} | IP: ${ip} | Agent: ${userAgent}`);
    } else {
      this.logger.log(`[${requestId}] → ${method} ${originalUrl}`);
    }

    let finished = false;

    res.on('finish', () => {
      finished = true;
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      const contentLength = res.get('content-length') || 0;
      const logMessage = `[${requestId}] ← ${method} ${originalUrl} | ${statusCode} | ${duration}ms | ${contentLength}b`;

      if (statusCode >= 500) this.logger.error(logMessage);
      else if (statusCode >= 400) this.logger.warn(logMessage);
      else this.logger.log(logMessage);
    });

    res.on('close', () => {
      if (!finished) {
        const duration = Date.now() - startTime;
        this.logger.warn(`[${requestId}] ⚠ ${method} ${originalUrl} | Client disconnected after ${duration}ms`);
      }
    });

    next();
  }
}