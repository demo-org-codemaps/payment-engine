import { Inject, Injectable } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { genericRetryStrategy } from '../../shared';
import {
  HoldMsg,
  OutMsg,
  PaymentIdsMsg,
  PaymentMsg,
  PaymentServiceClient,
  PAYMENT_PACKAGE_NAME,
  PAYMENT_SERVICE_NAME,
  TransDescMsg,
} from '../../generated/src/protos/payment';
import {
  CountryEnum,
  WalletBalanceMsg,
  WalletInquiryMsg,
  WalletServiceClient,
  WALLET_PACKAGE_NAME,
  WALLET_SERVICE_NAME,
} from '../../generated/src/protos/wallet';

@Injectable()
export class GrpcWrapperService {
  constructor(
    @Inject(PAYMENT_PACKAGE_NAME) private paymentClient: ClientGrpc,
    @Inject(WALLET_PACKAGE_NAME) private walletClient: ClientGrpc
  ) {}
  private paymentService: PaymentServiceClient;
  private walletService: WalletServiceClient;

  onModuleInit() {
    this.paymentService = this.paymentClient.getService<PaymentServiceClient>(PAYMENT_SERVICE_NAME);
    this.walletService = this.walletClient.getService<WalletServiceClient>(WALLET_SERVICE_NAME);
  }

  async fetchCoinBalance(retailerId: string, countryCode?: CountryEnum): Promise<number> {
    const msg: WalletInquiryMsg = {
      retailerId,
      countryCode: countryCode ? countryCode : CountryEnum.PK,
    };
    const res = this.walletService.checkBalance(msg).pipe(genericRetryStrategy());
    const balance: WalletBalanceMsg = await lastValueFrom(res);
    return balance.amount;
  }

  async holdPayment(msg: HoldMsg): Promise<string[]> {
    const res = this.paymentService.holdProcedure(msg).pipe(genericRetryStrategy());
    const holdIds: PaymentIdsMsg = await lastValueFrom(res);
    return holdIds.ids;
  }

  async chargePayment(ids: string[]): Promise<string[]> {
    const transactions: TransDescMsg[] = ids.map(id => ({ id }));
    const msg: OutMsg = { transactions };
    const res = this.paymentService.chargeProcedure(msg).pipe(genericRetryStrategy());
    const chargedIds: PaymentIdsMsg = await lastValueFrom(res);
    return chargedIds.ids;
  }

  async cancelPayment(ids: string[]): Promise<string[]> {
    const transactions: TransDescMsg[] = ids.map(id => ({ id }));
    const msg: OutMsg = { transactions };
    const res = this.paymentService.releaseProcedure(msg).pipe(genericRetryStrategy());
    const cancelIds: PaymentIdsMsg = await lastValueFrom(res);
    return cancelIds.ids;
  }

  async rechargeWallet(msg: HoldMsg): Promise<string[]> {
    const res = this.paymentService.topUpProcedure(msg).pipe(genericRetryStrategy());
    const rechargeIds: PaymentIdsMsg = await lastValueFrom(res);
    return rechargeIds.ids;
  }
}
