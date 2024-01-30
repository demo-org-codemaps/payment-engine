import { IsNotEmpty, ValidateNested } from 'class-validator';
import { Expose, Transform, Type } from 'class-transformer';
import { MoneyDto } from './money.dto';

export class CalculateCashDto {
  @Expose()
  @IsNotEmpty()
  @Transform(({ value }) => value.toString())
  orderId: string;

  @Expose()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MoneyDto)
  total: MoneyDto;
}
