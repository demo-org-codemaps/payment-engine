import { IsNotEmpty, ValidateNested, IsEnum, IsOptional } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { MoneyDto } from './money.dto';
import { OrderPaymentMethodEnum, TransactionTypeEnum } from '../../shared';

export class CreateSubtransactionDto {
  @Expose()
  @IsNotEmpty()
  retailerId: string;

  @Expose()
  @IsNotEmpty()
  orderId: string;

  @Expose()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto)
  total: MoneyDto;

  @Expose()
  @IsNotEmpty()
  @IsEnum(OrderPaymentMethodEnum)
  orderPaymentMethod: OrderPaymentMethodEnum;

  @Expose()
  @IsEnum(TransactionTypeEnum)
  @IsOptional()
  transactionType: TransactionTypeEnum;
}
