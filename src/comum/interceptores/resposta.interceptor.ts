import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class RespostaPadraoInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((resposta) => {
        if (resposta && typeof resposta === 'object' && 'sucesso' in resposta) {
          return resposta;
        }

        return { sucesso: true, dados: resposta };
      }),
    );
  }
}
