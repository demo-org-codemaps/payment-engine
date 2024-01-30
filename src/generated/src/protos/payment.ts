/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import * as Long from 'long';
import * as _m0 from 'protobufjs/minimal';
import { Observable } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

export const protobufPackage = 'payment';

export enum PaymentEnum {
  CASH = 0,
  R_COIN = 1,
  UNRECOGNIZED = -1,
}

export enum CountryEnum {
  PK = 0,
  SA = 1,
  UNRECOGNIZED = -1,
}

export enum TransactionTypeEnum {
  ORDER_PAYMENT = 0,
  ORDER_TOPUP = 1,
  TOPUP_TOPUP = 2,
  TOPUP_LOYALTY = 3,
  BATCH_TOPUP = 4,
  UNRECOGNIZED = -1,
}

export interface Empty {}

export interface PaymentMsg {
  paymentMethod: PaymentEnum;
  amount: number;
  subTransactionId: string;
  transactionType?: TransactionTypeEnum | undefined;
  comment?: string | undefined;
}

export interface HoldMsg {
  account: string;
  countryCode: CountryEnum;
  paymentMethods: PaymentMsg[];
}

export interface TransDescMsg {
  id: string;
  transactionType?: TransactionTypeEnum | undefined;
  comment?: string | undefined;
}

export interface OutMsg {
  transactions: TransDescMsg[];
}

export interface PaymentIdsMsg {
  ids: string[];
}

export const PAYMENT_PACKAGE_NAME = 'payment';

export interface PaymentServiceClient {
  holdProcedure(request: HoldMsg, metadata?: Metadata): Observable<PaymentIdsMsg>;

  releaseProcedure(request: OutMsg, metadata?: Metadata): Observable<PaymentIdsMsg>;

  chargeProcedure(request: OutMsg, metadata?: Metadata): Observable<PaymentIdsMsg>;

  topUpProcedure(request: HoldMsg, metadata?: Metadata): Observable<PaymentIdsMsg>;
}

export interface PaymentServiceController {
  holdProcedure(
    request: HoldMsg,
    metadata?: Metadata
  ): Promise<PaymentIdsMsg> | Observable<PaymentIdsMsg> | PaymentIdsMsg;

  releaseProcedure(
    request: OutMsg,
    metadata?: Metadata
  ): Promise<PaymentIdsMsg> | Observable<PaymentIdsMsg> | PaymentIdsMsg;

  chargeProcedure(
    request: OutMsg,
    metadata?: Metadata
  ): Promise<PaymentIdsMsg> | Observable<PaymentIdsMsg> | PaymentIdsMsg;

  topUpProcedure(
    request: HoldMsg,
    metadata?: Metadata
  ): Promise<PaymentIdsMsg> | Observable<PaymentIdsMsg> | PaymentIdsMsg;
}

export function PaymentServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['holdProcedure', 'releaseProcedure', 'chargeProcedure', 'topUpProcedure'];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod('PaymentService', method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod('PaymentService', method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const PAYMENT_SERVICE_NAME = 'PaymentService';

// If you get a compile-error about 'Constructor<Long> and ... have no overlap',
// add '--ts_proto_opt=esModuleInterop=true' as a flag when calling 'protoc'.
if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}
