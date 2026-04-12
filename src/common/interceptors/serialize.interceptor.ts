// src/common/interceptors/serialize.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SerializeInterceptor implements NestInterceptor {
  private readonly sensitiveFields = [
    'password',
    'refreshToken',

    '__v',        // mongoose version key
    'salt',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => this.stripSensitiveFields(data))
    );
  }

  private stripSensitiveFields(data: any): any {
    if (!data || typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map(item => this.stripSensitiveFields(item));
    }

    const cleaned = { ...data };
    for (const field of this.sensitiveFields) {
      delete cleaned[field];
    }
    return cleaned;
  }
}