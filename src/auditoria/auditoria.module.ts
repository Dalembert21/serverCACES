import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuditContextService } from '../common/audit/audit-context.service.js';
import { AuditContextMiddleware } from '../common/audit/audit-context.middleware.js';
import { AuditInterceptor } from '../common/audit/audit.interceptor.js';
import { AuditoriaService } from './auditoria.service.js';
import { AuditoriaController } from './auditoria.controller.js';

@Global()
@Module({
  controllers: [AuditoriaController],
  providers: [
    AuditContextService,
    AuditoriaService,
    AuditInterceptor,
  ],
  exports: [
    AuditContextService,
    AuditoriaService,
    AuditInterceptor,
  ],
})
export class AuditoriaModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuditContextMiddleware).forRoutes('*');
  }
}

