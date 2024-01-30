import { IsNotEmpty, IsString, IsBoolean } from 'class-validator';

export class SuccessResponseDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  data: unknown;
}

export class ErrorResponseDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @IsString()
  error: string;
}
