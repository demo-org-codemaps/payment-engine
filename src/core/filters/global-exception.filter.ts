import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { getI18nContextFromArgumentsHost } from 'nestjs-i18n';
import { ApiErrorDto, ApiException, ApiLog, LogUtil, ValidationFailedException } from '../../shared';
import { ErrorService } from '../services';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private errorService: ErrorService, private readonly logger: Logger) {}

  async catch(exception: any, host: ArgumentsHost) {
    this.logger.error(exception);

    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response: Response = ctx.getResponse<Response>();
    const statusCode = this._getStatus(exception);

    let errors: ApiErrorDto[];
    const i18n = getI18nContextFromArgumentsHost(host);
    const i18nLang = i18n.lang;
    try {
      if (exception.isAxiosError) {
        errors = await this.errorService.getAxiosError(exception, i18nLang);
      } else if (exception instanceof ApiException) {
        errors = await this.errorService.getErrorsFromApiException(exception, i18nLang);
      } else if (exception instanceof ValidationFailedException) {
        errors = await this.errorService.getErrorsFromValidationFailedException(exception, i18nLang);
      } else if (exception instanceof HttpException) {
        errors = await this.errorService.getErrorsFromHttpException(exception, i18nLang);
      } else if (exception instanceof UnauthorizedException) {
        errors = await this.errorService.getUnAuthorizedError(i18nLang);
      } else if (exception instanceof NotFoundException) {
        errors = await this.errorService.getResourceNotFoundError(i18nLang);
      } else {
        errors = await this.errorService.getUnexpectedError(i18nLang);
      }

      this._logErrorResponse(request, statusCode, { exception, errors });
    } catch (error) {
      this.logger.error(error);
      errors = await this.errorService.getUnexpectedError(i18nLang);
    }

    response.status(statusCode).send({
      errors,
    });
  }

  private _getStatus(exception: any): number {
    return exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private _logErrorResponse(request: Request, statusCode: number, errorResponse: any) {
    const requestData: ApiLog = LogUtil.getApiLogFromRequest(request);
    const loggerContext = `${GlobalExceptionFilter.name} - ${requestData.ip} - ${requestData.requestId}`;

    const responseData = {
      ...requestData,
      statusCode,
      body: JSON.stringify(errorResponse),
    };

    const log = LogUtil.getResponseLog(responseData);
    this.logger.log(log, loggerContext);
  }
}
