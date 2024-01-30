import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HeaderResolver, I18nJsonLoader, I18nModule } from 'nestjs-i18n';
import * as path from 'path';
import { GlobalExceptionFilter } from './filters';
import { LoggingInterceptor } from './interceptors';
import { ErrorService, RequestContext, SlackBotService } from './services';
import { DatabaseModule } from '../database/database.module';
import { CONSTANTS } from '../app.constants';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [
    DatabaseModule,
    I18nModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      loader: I18nJsonLoader,
      useFactory: (configService: ConfigService) => ({
        fallbackLanguage: configService.get('defaultLanguage'),
        loaderOptions: {
          path: path.join(__dirname, '../../core/i18n/'),
        },
      }),
      resolvers: [new HeaderResolver([CONSTANTS.HEADERS.X_LANG])],
    }),
    HttpModule,
  ],

  providers: [
    Logger,
    RequestContext,
    ErrorService,
    SlackBotService,
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],

  exports: [RequestContext, Logger],
})
export class CoreModule {}
