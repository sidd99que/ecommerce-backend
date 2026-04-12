import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';


 
export interface StripeRequest extends RawBodyRequest<Request> {

  amount: number;
  currency: string;
  description?: string;

}
