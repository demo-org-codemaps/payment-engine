import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderPaymentMethodEnum } from '../../shared';

export class CancelTransactionDto {
  @Expose()
  @IsNotEmpty()
  orderId: string;

  @Expose()
  @IsNotEmpty()
  @IsEnum(OrderPaymentMethodEnum)
  orderPaymentMethod: OrderPaymentMethodEnum;
}
