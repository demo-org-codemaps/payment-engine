import { IsEnum, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { PaymentMethodEnum, TransactionTypeEnum } from '../../shared';
import { MoneyDto } from './money.dto';

export class HoldDto {
  @Expose()
  @IsNotEmpty()
  account: string;

  @Expose()
  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  @Expose()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto)
  money: MoneyDto;

  @Expose()
  @IsEnum(TransactionTypeEnum)
  @IsOptional()
  transactionType?: TransactionTypeEnum;

  @Expose()
  @IsOptional()
  comments?: string;
}
