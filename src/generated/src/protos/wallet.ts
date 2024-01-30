/* eslint-disable */
import { GrpcMethod, GrpcStreamMethod } from '@nestjs/microservices';
import * as Long from 'long';
import * as _m0 from 'protobufjs/minimal';
import { Observable } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

export const protobufPackage = 'wallet';

export enum CountryEnum {
  PK = 0,
  SA = 1,
  UNRECOGNIZED = -1,
}

export interface WalletInquiryMsg {
  retailerId: string;
  countryCode: CountryEnum;
}

export interface WalletBalanceMsg {
  walletInquiry: WalletInquiryMsg | undefined;
  amount: number;
}

export const WALLET_PACKAGE_NAME = 'wallet';

export interface WalletServiceClient {
  checkBalance(request: WalletInquiryMsg, metadata?: Metadata): Observable<WalletBalanceMsg>;
}

export interface WalletServiceController {
  checkBalance(
    request: WalletInquiryMsg,
    metadata?: Metadata
  ): Promise<WalletBalanceMsg> | Observable<WalletBalanceMsg> | WalletBalanceMsg;
}

export function WalletServiceControllerMethods() {
  return function (constructor: Function) {
    const grpcMethods: string[] = ['checkBalance'];
    for (const method of grpcMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcMethod('WalletService', method)(constructor.prototype[method], method, descriptor);
    }
    const grpcStreamMethods: string[] = [];
    for (const method of grpcStreamMethods) {
      const descriptor: any = Reflect.getOwnPropertyDescriptor(constructor.prototype, method);
      GrpcStreamMethod('WalletService', method)(constructor.prototype[method], method, descriptor);
    }
  };
}

export const WALLET_SERVICE_NAME = 'WalletService';

// If you get a compile-error about 'Constructor<Long> and ... have no overlap',
// add '--ts_proto_opt=esModuleInterop=true' as a flag when calling 'protoc'.
if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}
