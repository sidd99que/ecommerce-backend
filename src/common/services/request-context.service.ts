// src/common/services/request-context.service.ts
import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks'; // ✅ built into Node.js

interface RequestContext {
  requestId: string;
}

@Injectable()
export class RequestContextService {
  private readonly storage = new AsyncLocalStorage<RequestContext>();

  // called once in middleware to set the ID
  run(requestId: string, callback: () => void) {
    this.storage.run({ requestId }, callback);
  }

  // called anywhere in your app to GET the ID
  getRequestId(): string {
    return this.storage.getStore()?.requestId ?? 'no-request-id';
  }
}