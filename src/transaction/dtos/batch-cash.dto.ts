import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';
import { CalculateCashDto } from './calculate-cash.dto';

export class BatchCashDto {
  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMaxSize(50)
  @Type(() => CalculateCashDto)
  batch: CalculateCashDto[];
}
