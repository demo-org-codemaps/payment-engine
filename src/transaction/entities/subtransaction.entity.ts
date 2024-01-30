import { Expose } from 'class-transformer';
import { BaseEntity } from '../../core';
import { Column, Entity } from 'typeorm';
import { PaymentMethodEnum, SubtransactionStateEnum } from '../../shared';
import { CurrencyCodeEnum } from '../../shared';

@Entity()
export class SubtransactionEntity extends BaseEntity {
  //   @ManyToOne(() => Transaction, transaction => transaction.subTransactions)
  //   @JoinColumn({ name: 'transaction_id' })
  //   transaction: Transaction;

  // @Expose()
  // @Column({
  //   nullable: false,
  //   name: 'order_transaction_id',
  // })
  // orderTransactionId: string;

  @Expose()
  @Column({
    nullable: false,
    name: 'order_id',
  })
  orderId: string;

  @Expose()
  @Column({
    nullable: false,
    unique: true,
    name: 'idemp_key',
  })
  idempKey: string;

  @Expose()
  @Column({
    nullable: false,
    type: 'bigint',
  })
  amount: number;

  @Expose()
  @Column({
    nullable: false,
    name: 'currency',
    default: CurrencyCodeEnum.PKR,
  })
  currency: CurrencyCodeEnum;

  @Expose()
  @Column({
    nullable: false,
    name: 'payment_method',
    default: PaymentMethodEnum.WALLET,
  })
  paymentMethod: PaymentMethodEnum;

  @Expose()
  @Column({
    type: 'enum',
    enum: SubtransactionStateEnum,
    name: 'status',
    default: SubtransactionStateEnum.HOLD_PROCESSING,
  })
  state: SubtransactionStateEnum;
}
