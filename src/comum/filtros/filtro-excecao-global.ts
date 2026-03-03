import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

type ReqComTrace = Request & { traceId?: string };

@Catch()
export class FiltroExcecaoGlobal implements ExceptionFilter {
  private readonly logger = new Logger(FiltroExcecaoGlobal.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<ReqComTrace>();
    const res = ctx.getResponse<Response>();

    const traceId = req.traceId ?? 'sem-trace-id';

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const conflitoUnique = exception.code === 'P2002';
      const status = conflitoUnique ? HttpStatus.CONFLICT : HttpStatus.BAD_REQUEST;
      res.status(status).json({
        sucesso: false,
        erro: {
          codigo: conflitoUnique ? 'CONFLITO_UNICO' : 'ERRO_BANCO',
          mensagem: conflitoUnique
            ? 'Conflito de dados unicos para este recurso.'
            : 'Erro ao persistir dados no banco.',
          detalhes: { codigoPrisma: exception.code },
        },
        traceId,
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse() as
        | string
        | { message?: string | string[]; codigo?: string; mensagem?: string; detalhes?: unknown };

      const mensagem =
        typeof body === 'string'
          ? body
          : body.mensagem || (Array.isArray(body.message) ? body.message.join(', ') : body.message) || 'Erro HTTP';

      const codigo = typeof body === 'string' ? 'ERRO_HTTP' : body.codigo || 'ERRO_HTTP';
      const detalhes = typeof body === 'string' ? undefined : body.detalhes;

      res.status(status).json({
        sucesso: false,
        erro: { codigo, mensagem, detalhes },
        traceId,
      });
      return;
    }

    this.logger.error(`Erro interno. traceId=${traceId}`, exception as Error);

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      sucesso: false,
      erro: {
        codigo: 'ERRO_INTERNO',
        mensagem: 'Erro interno inesperado.',
      },
      traceId,
    });
  }
}
