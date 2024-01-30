import { Injectable, OnModuleInit } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { CurrencyCodeEnum, genericRetryStrategy, HeadersDto, TransactionTypeEnum } from '../../shared';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import { MoneyDto, HoldDto, PaymentBreakdownDto } from '../dtos';
import { LogDecorator } from '../../core';

@Injectable()
export class ApiWrapperService implements OnModuleInit {
  private walletEndpoint: string;
  private paymentEndpoint: string;
  private cartEndpoint: string;
  private lmsEndpoint: string;
  private knexaEndpoint: string;
  private knexaClientId: string;

  constructor(private readonly httpService: HttpService, private configService: ConfigService) {}

  onModuleInit() {
    this.walletEndpoint = this.configService.get('WALLET_ENDPOINT');
    this.paymentEndpoint = this.configService.get('PAYMENT_ENDPOINT');
    this.cartEndpoint = this.configService.get('CART_ENDPOINT');
    this.lmsEndpoint = this.configService.get('LMS_ENDPOINT');
    this.knexaEndpoint = this.configService.get('KNEXA_ENDPOINT');
    this.knexaClientId = this.configService.get('KNEXA_CLIENT_ID');
  }

  @LogDecorator()
  async fetchCoinBalance(headers: HeadersDto, retailerId: string, currency?: CurrencyCodeEnum): Promise<MoneyDto> {
    const res = this.httpService
      .get(`${this.walletEndpoint}/balance/${retailerId}?currency=${currency}`, { headers: headers.toJSON() })
      .pipe(genericRetryStrategy());
    const balance: AxiosResponse<any> = await lastValueFrom(res);
    return MoneyDto.fromJSON(balance.data.data);
  }

  @LogDecorator()
  async holdPayment(headers: HeadersDto, dto: HoldDto): Promise<string> {
    const res = this.httpService.post(`${this.paymentEndpoint}/hold`, dto, { headers: headers.toJSON() });
    // .pipe(genericRetryStrategy());
    const holdIds: AxiosResponse<string> = await lastValueFrom(res);
    return holdIds.data;
  }

  @LogDecorator()
  async chargePayment(headers: HeadersDto): Promise<string> {
    const res = this.httpService
      .post(
        `${this.paymentEndpoint}/charge`,
        {
          transactionType: TransactionTypeEnum.ORDER_PAYMENT,
        },
        { headers: headers.toJSON() }
      )
      .pipe(genericRetryStrategy());
    const chargedId: AxiosResponse<string> = await lastValueFrom(res);
    return chargedId.data;
  }

  @LogDecorator()
  async releasePayment(headers: HeadersDto): Promise<string> {
    const res = this.httpService
      .post(
        `${this.paymentEndpoint}/release`,
        {
          transactionType: TransactionTypeEnum.ORDER_REFUND,
        },
        { headers: headers.toJSON() }
      )
      .pipe(genericRetryStrategy());
    const cancelId: AxiosResponse<string> = await lastValueFrom(res);
    return cancelId.data;
  }

  @LogDecorator()
  async rollbackPayment(headers: HeadersDto, adjustedMoney: MoneyDto): Promise<any> {
    const res = this.httpService
      .post(
        `${this.paymentEndpoint}/rollback`,
        {
          transactionType: TransactionTypeEnum.ORDER_REFUND,
          adjustedMoney: adjustedMoney.toJSON(),
        },
        { headers: headers.toJSON() }
      )
      .pipe(genericRetryStrategy());
    const rollbackId: AxiosResponse<string> = await lastValueFrom(res);
    return rollbackId.data;
  }

  @LogDecorator()
  async rechargeWallet(headers: HeadersDto, dto: HoldDto): Promise<string> {
    const res = this.httpService
      .post(`${this.paymentEndpoint}/topup`, dto, { headers: headers.toJSON() })
      .pipe(genericRetryStrategy());
    const rechargeIds: AxiosResponse<string> = await lastValueFrom(res);
    return rechargeIds.data;
  }

  @LogDecorator()
  async cancelPayment(headers: HeadersDto): Promise<any> {
    const res = this.httpService
      .post(
        `${this.paymentEndpoint}/cancel`,
        {
          transactionType: TransactionTypeEnum.ORDER_REFUND,
        },
        { headers: headers.toJSON() }
      )
      .pipe(genericRetryStrategy());
    const result: AxiosResponse<any> = await lastValueFrom(res);
    return result.data;
  }

  @LogDecorator()
  async paymentStatus(headers: HeadersDto): Promise<any> {
    const res = this.httpService
      .get(`${this.paymentEndpoint}/status`, { headers: headers.toJSON() })
      .pipe(genericRetryStrategy());
    const result: AxiosResponse<any> = await lastValueFrom(res);
    const { data } = result.data;
    return data;
  }

  @LogDecorator()
  async fetchOrderTotal(
    headersDto: HeadersDto,
    details: PaymentBreakdownDto,
    retailerId: string,
    currency: CurrencyCodeEnum
  ): Promise<MoneyDto> {
    const { payload } = details;
    const url = `${this.cartEndpoint}?calculateTotal=true&customerId=${retailerId}&validateCoupon=true&validateCredit=false&validateProducts=true`;
    const headers = {
      clientTimeOffset: '300',
      ...headersDto.toJSON(),
    };
    const res = await this.httpService.put(url, payload, { headers: headers }).pipe(genericRetryStrategy());
    const cartDetails: AxiosResponse<{ data }> = await lastValueFrom(res);
    const { amountPayable } = cartDetails.data?.data || {};
    return MoneyDto.fromJSON({ amount: amountPayable || 0, currency });
  }

  @LogDecorator()
  async generateDeliveryVerificationCode(headers: HeadersDto, orderId: string, retailerId: string): Promise<any> {
    const res = this.httpService
      .post(
        `${this.lmsEndpoint}/deliveryVerification/generateCode`,
        { orderId: +orderId, retailerId: +retailerId },
        { headers: headers.toJSON() }
      )
      .pipe(genericRetryStrategy());
    const result: AxiosResponse<any> = await lastValueFrom(res);
    const { data } = result.data;
    return data;
  }

  @LogDecorator()
  async callKnexaGetWalletBalance(headers: HeadersDto, retailerId: string, currency?: CurrencyCodeEnum): Promise<any> {
    const data = `query {getWalletBalance(input: {currency : "${currency}", id : ${retailerId}}) {data {id currency}}}`;
    this.httpService.post(
      `${this.knexaEndpoint}/${this.knexaClientId}/modelschemas/graphql`,
      {
        query: data,
      },
      { headers: headers.toJSON() }
    );
  }
}
