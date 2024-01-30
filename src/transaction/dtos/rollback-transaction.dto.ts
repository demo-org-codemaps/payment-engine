import { IsNotEmpty } from 'class-validator';
import { Expose } from 'class-transformer';
export class RollbackTransactionDto {
  @Expose()
  @IsNotEmpty()
  retailerId: string;

  @Expose()
  @IsNotEmpty()
  orderId: string;
}
