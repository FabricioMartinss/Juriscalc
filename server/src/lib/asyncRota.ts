import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Express 4 não captura rejeição de Promise em handler assíncrono sozinho —
 * sem isso, uma falha de banco vira unhandled rejection e pode derrubar o
 * processo em vez de responder 500 pro cliente.
 */
export function asyncRota(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}
