import appConfig from './app.config';
import { ConfigModuleOptions } from '@nestjs/config/dist/interfaces';
import * as Joi from 'joi';
import { CONSTANTS } from '../../app.constants';

export const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  envFilePath: '.env',
  load: [appConfig],
  validationSchema: Joi.object({
    NODE_ENV: Joi.string()
      .valid(CONSTANTS.ENVIRONMENT.DEVELOPMENT, CONSTANTS.ENVIRONMENT.PRODUCTION, CONSTANTS.ENVIRONMENT.TEST)
      .default(CONSTANTS.ENVIRONMENT.DEVELOPMENT),
    ORDER_PAYMENT_ENGINE_APP_PORT: Joi.number().required(),
    CORS_WHITELIST: Joi.string().required(),
    CART_ENDPOINT: Joi.string().required(),

    WALLET_ENDPOINT: Joi.string().required(),

    PAYMENT_ENDPOINT: Joi.string().required(),
    LMS_ENDPOINT: Joi.string().required(),

    ORDER_PAYMENT_ENGINE_DB_HOST: Joi.string().required(),
    DB_PORT: Joi.number().optional(),
    ORDER_PAYMENT_ENGINE_DB_NAME: Joi.string().required(),
    DB_USERNAME: Joi.string().required(),
    DB_PASSWORD: Joi.string().required(),

    JWT_SECRET_KEY: Joi.string().required(),
    JWT_ACCESS_TOKEN_EXPIRY_IN_SEC: Joi.number().required(),

    SENTRY_DSN: Joi.string().required(),

    NEW_RELIC_LICENSE_KEY: Joi.string().required(),
    NEW_RELIC_APP_NAME: Joi.string().required(),

    KNEXA_ENDPOINT: Joi.string().required(),
    KNEXA_CLIENT_ID: Joi.string().required(),
  }),
};
