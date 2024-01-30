import { Injectable, HttpException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { CONSTANTS } from '../../app.constants';
import { ApiErrorDto, ApiException, ValidationFailedException } from '../../shared';

@Injectable({})
export class ErrorService {
  VALIDATION_ERROR_PREFIX = 'VALIDATIONS.';

  constructor(private readonly i18n: I18nService) {}

  public async getErrorMessage(lang: string, key: string, args?: Record<string, any>): Promise<string> {
    const message = await this.i18n.translate(CONSTANTS.ERROR_MESSAGE_KEY_PREFIX + key, { lang, args });
    return message;
  }

  public async getAxiosError(exception: any, lang: string): Promise<ApiErrorDto[]> {
    const errors: ApiErrorDto[] = [];

    errors.push({
      name: 'INTERSERVICE_ERROR',
      message: await this.getErrorMessage(lang, 'INTERSERVICE_ERROR'),
      data: {
        url: exception.config.url,
        ...exception?.response?.data,
      },
    });

    return errors;
  }

  public async getErrorsFromHttpException(exception: HttpException, lang: string): Promise<ApiErrorDto[]> {
    const errors: ApiErrorDto[] = [];

    errors.push({
      name: exception.message,
      message: await this.getErrorMessage(lang, exception.message),
    });

    return errors;
  }

  public async getUnexpectedError(lang: string): Promise<ApiErrorDto[]> {
    const errors: ApiErrorDto[] = [];

    errors.push({
      name: 'UNEXPECTED_ERROR',
      message: await this.getErrorMessage(lang, 'UNEXPECTED_ERROR'),
    });

    return errors;
  }

  public async getUnAuthorizedError(lang: string): Promise<ApiErrorDto[]> {
    const errors: ApiErrorDto[] = [];

    errors.push({
      name: 'UNAUTHORIZED',
      message: await this.getErrorMessage(lang, 'UNAUTHORIZED'),
    });

    return errors;
  }

  public async getResourceNotFoundError(lang: string): Promise<ApiErrorDto[]> {
    const errors: ApiErrorDto[] = [];

    errors.push({
      name: 'RESOURCE_NOT_FOUND',
      message: await this.getErrorMessage(lang, 'RESOURCE_NOT_FOUND'),
    });

    return errors;
  }

  public async getErrorsFromApiException(exception: ApiException, lang: string): Promise<ApiErrorDto[]> {
    const errors: ApiErrorDto[] = [];

    errors.push({
      name: exception.key,
      message: await this.getErrorMessage(lang, exception.key, exception.args),
    });

    return errors;
  }

  public async getErrorsFromValidationFailedException(
    exception: ValidationFailedException,
    lang: string
  ): Promise<ApiErrorDto[]> {
    const errors: ApiErrorDto[] = [];

    errors.push({
      name: ValidationFailedException.name,
      message: await this.getErrorMessage(lang, exception.validationErrors.toString()),
    });

    return errors;
  }
}
