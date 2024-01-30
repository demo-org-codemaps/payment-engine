import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  public name: string;
  public message: string;
  public data: T; // Swagger Decorator is added in the extended class below, since that will override this one.
}

export function SwaggerBaseApiResponse<T>(type: T): typeof ApiResponseDto {
  class ExtendedApiResponseDto<T> extends ApiResponseDto<T> {
    @ApiProperty()
    public name: string;

    @ApiProperty()
    public message: string;

    @ApiProperty({ type })
    public data: T;
  }

  // NOTE : Overwrite the returned class name, otherwise whichever type calls this function in the last,
  // will overwrite all previous definitions. i.e., Swagger will have all response types as the same one.
  const isAnArray = Array.isArray(type) ? ' [ ] ' : '';
  Object.defineProperty(ExtendedApiResponseDto, 'name', {
    value: `SwaggerBaseApiResponseFor ${type} ${isAnArray}`,
  });

  return ExtendedApiResponseDto;
}
