import { Expose } from 'class-transformer';
import { IsNotEmpty, IsEnum } from 'class-validator';
import { CurrencyCodeEnum, OrderPaymentMethodEnum } from '../../shared';

export class PaymentBreakdownDto {
  @Expose()
  @IsNotEmpty()
  payload: string;

  @Expose()
  @IsNotEmpty()
  retailerId: string;

  @Expose()
  @IsNotEmpty()
  @IsEnum(CurrencyCodeEnum)
  currency: CurrencyCodeEnum;

  @Expose()
  @IsNotEmpty()
  @IsEnum(OrderPaymentMethodEnum)
  paymentMethod: OrderPaymentMethodEnum;
}
