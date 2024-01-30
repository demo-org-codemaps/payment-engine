import { IsEnum, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { PaymentMethodEnum, TransactionTypeEnum } from '../../shared';
import { MoneyDto } from './money.dto';

export class OutDto {
  @Expose()
  @IsNotEmpty()
  id: string;

  @Expose()
  @IsEnum(TransactionTypeEnum)
  @IsOptional()
  transactionType?: TransactionTypeEnum;

  @Expose()
  @IsOptional()
  comments?: string;
}
