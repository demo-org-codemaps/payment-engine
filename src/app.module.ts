import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { APP_GUARD, RouterModule } from '@nestjs/core';

import { appRoutes } from './app.routes';
import { AuthModule, JwtAuthGuard } from './auth';
import { CoreModule, RolesGuard } from './core';
import { HealthModule } from './health/health.module';
import { SharedModule } from './shared';
import { TransactionModule } from './transaction';
import { SentryModule } from './sentry/sentry.module';
import * as Sentry from '@sentry/node';
import * as SentryTracing from '@sentry/tracing';

@Module({
  imports: [
    RouterModule.register(appRoutes),
    CoreModule,
    SharedModule,
    AuthModule,
    HealthModule,
    TransactionModule,
    SentryModule.forRoot({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.01,
      environment: process.env.NODE_ENV,
      integrations: [new Sentry.Integrations.Http({ tracing: true }), new SentryTracing.Integrations.Mysql()],
    }),
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(Sentry.Handlers.requestHandler()).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
