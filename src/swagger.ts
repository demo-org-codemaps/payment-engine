import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerCustomOptions, SwaggerModule } from '@nestjs/swagger';
import { CONSTANTS } from './app.constants';

export function setupSwagger(app: INestApplication): void {
  const options = new DocumentBuilder()
    .setTitle('ORDER PAYMENT ENGINE API')
    .setDescription('This is the API documentation for order payment engine')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    })
    .build();

  const customOptions: SwaggerCustomOptions = {
    explorer: true,
    validatorUrl: null,
    swaggerOptions: {
      validatorUrl: null,
    },
  };

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(`${CONSTANTS.API_VERSION}api-docs`, app, document, customOptions);
}
