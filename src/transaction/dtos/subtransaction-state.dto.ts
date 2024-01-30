import {
  IsNotEmpty,
  ValidateNested,
  IsEnum,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsString,
  IsUUID,
} from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { MoneyDto } from './money.dto';
import { PaymentMethodEnum, SubtransactionStateEnum } from '../../shared';

export class SubtransactionStateDto {
  @Expose()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto)
  total: MoneyDto;

  @Expose()
  @IsNotEmpty()
  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  @Expose()
  @IsNotEmpty()
  @IsEnum(SubtransactionStateEnum)
  state: SubtransactionStateEnum;

  @Expose()
  @IsOptional()
  @IsDateString()
  createdAt: string;

  @Expose()
  @IsBoolean()
  is3P: boolean;

  @Expose()
  @IsString()
  code: string;

  @Expose()
  @IsUUID()
  @IsOptional()
  id: string;
}
