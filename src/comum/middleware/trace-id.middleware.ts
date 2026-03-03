import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

type RequestComTraceId = Request & { traceId?: string };

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: RequestComTraceId, res: Response, next: NextFunction): void {
    const traceId = req.header('x-trace-id') || randomUUID();
    req.traceId = traceId;
    res.setHeader('x-trace-id', traceId);
    next();
  }
}
