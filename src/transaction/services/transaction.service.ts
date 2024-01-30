import { Injectable, MethodNotAllowedException, PreconditionFailedException } from '@nestjs/common';
import {
  AppUtil,
  BadRequestException,
  CurrencyCodeEnum,
  HeadersDto,
  MapperUtil,
  OrderPaymentMethodEnum,
  PaymentMethodEnum,
  SubtransactionStateEnum,
  TransactionTypeEnum,
  NotificationTypeEnum,
} from '../../../src/shared';
import {
  CreateTransactionDto,
  CancelTransactionDto,
  CompleteTransactionDto,
  PaymentBreakdownDto,
  BatchCashDto,
  RollbackTransactionDto,
} from '../dtos';
import { SubtransactionEntity } from '../entities';
import { DbWrapperService } from './db-wrapper.service';
import { ApiWrapperService } from './api-wrapper.service';
import { MoneyDto, CalculateCashDto } from '../dtos';
import { LogDecorator } from '../../core';
import { SubtransactionStateDto } from '../dtos/subtransaction-state.dto';
import { CreateSubtransactionDto } from '../dtos/create-subtransaction.dto';
import { AuthService } from '../../auth';
import { formatedDataWithBatches, getAllOrdersFromBatches } from '../../shared/utils/breakdown.util';

import { Notifications } from '@demoorg/notification-library';
import { IQueueMessage } from '@demoorg/notification-library/build/types/types';
@Injectable()
export class TransactionService {
  constructor(
    private readonly dbWrapper: DbWrapperService,
    private readonly apiWrapper: ApiWrapperService,
    private readonly authService: AuthService
  ) {}

  @LogDecorator()
  async createTransaction(
    headers: HeadersDto,
    data: CreateTransactionDto,
    retailerId: string // retailerId is passed as explicit field so that it can be taken from Auth token in future
  ): Promise<Record<string, any>> {
    try {
      headers.authorization = await this.authService.generateServiceToken(headers.authorization);
      const { orderId, orderPaymentMethod, total, transactionType = TransactionTypeEnum.ORDER_PAYMENT } = data;
      const subtransactions = new Map();
      const paymentMethods: PaymentMethodEnum[] = orderPaymentMethod
        .split('_')
        .reverse()
        .map(pm => (pm === 'COD' ? PaymentMethodEnum['CASH'] : PaymentMethodEnum[pm]));
      for (const pm of paymentMethods) {
        const deduction = await this.resolvePMAmount(headers, retailerId, data, pm, subtransactions);
        const subtransaction = await this.createSubtransaction(
          headers,
          retailerId,
          pm,
          deduction,
          orderId,
          transactionType
        );
        subtransaction && subtransactions.set(pm, subtransaction);
      }
      // Creates delivery verification code and sends notification to the retailer
      this.generateDeliveryCodeAndNotifyRetailer(headers, orderId, retailerId);
      return await this.paymentMethodBreakdown(headers, { orderId, total });
    } catch (e) {
      throw e;
    }
  }

  @LogDecorator()
  async generateDeliveryCodeAndNotifyRetailer(headers: HeadersDto, orderId: string, retailerId: string): Promise<any> {
    try {
      // API call to LMS service to generate delivery verification code
      const { deliveryCode } = await this.apiWrapper.generateDeliveryVerificationCode(headers, orderId, retailerId);
      // send retailer notification
      this.sendPushNotification(retailerId, orderId, deliveryCode);
      return;
    } catch (err) {
      throw err;
    }
  }

  @LogDecorator()
  async createSubtransaction(
    headers: HeadersDto,
    retailerId: string,
    paymentMethod: PaymentMethodEnum,
    deduction: MoneyDto,
    orderId: string,
    transactionType: TransactionTypeEnum
  ): Promise<SubtransactionEntity> {
    try {
      const idempKey = AppUtil.generateIdempKey(orderId, paymentMethod);
      let subtransaction = await this.dbWrapper.findByIdempKey(idempKey);
      switch (subtransaction?.state) {
        case undefined:
          if (deduction.isZeroOrNegative()) return undefined;
          subtransaction = await this.putInDb(orderId, deduction, paymentMethod);
        // falls through deliberatlely without break and "falls through" comment allows us to do that
        case SubtransactionStateEnum.HOLD_PROCESSING:
          await this.holdInPayment(headers, retailerId, subtransaction, paymentMethod, transactionType);
        case SubtransactionStateEnum.AWAITING_PAYMENT:
        case SubtransactionStateEnum.HOLD:
          return subtransaction;
        case SubtransactionStateEnum.COMPLETED:
        case SubtransactionStateEnum.COMPLETE_PROCESSING:
        case SubtransactionStateEnum.CANCELLED:
        case SubtransactionStateEnum.CANCEL_PROCESSING:
        case SubtransactionStateEnum.ROLLBACK_PROCESSING:
        case SubtransactionStateEnum.ROLLBACKED:
          throw new BadRequestException(`Cannot be fulfilled as state is ${subtransaction.state}`);
        default: // Case for already SubtransactionStateEnum.CANCELLED, it should return true
          return subtransaction;
      }
    } catch (e) {
      throw e;
    }
  }

  @LogDecorator()
  async cancelSubtransaction(
    headers: HeadersDto,
    orderId: string,
    paymentMethod: PaymentMethodEnum,
    toEndState?: boolean
  ): Promise<boolean> {
    try {
      const idempKey = AppUtil.generateIdempKey(orderId, paymentMethod);
      const subtransaction = await this.dbWrapper.findByIdempKey(idempKey);
      if (subtransaction) {
        const id = subtransaction.id;
        switch (subtransaction.state) {
          case SubtransactionStateEnum.HOLD:
          case SubtransactionStateEnum.AWAITING_PAYMENT:
            await this.dbWrapper.setSubtransactionState(id, SubtransactionStateEnum.CANCEL_PROCESSING);
          // falls through deliberatlely without break and "falls through" comment allows us to do that
          case SubtransactionStateEnum.CANCEL_PROCESSING:
            headers.idempotencyKey = id;
            await this.apiWrapper.cancelPayment(headers);
            if (toEndState) await this.dbWrapper.cancelIntent(id);
            else await this.dbWrapper.cancelSubtransaction(id);
            break;
          case SubtransactionStateEnum.HOLD_PROCESSING:
            if (AppUtil.is3PMethod(paymentMethod)) {
              await this.dbWrapper.cancelIntent(id);
              return true;
            }
          case SubtransactionStateEnum.COMPLETE_PROCESSING:
          case SubtransactionStateEnum.COMPLETED:
          case SubtransactionStateEnum.ROLLBACK_PROCESSING:
          case SubtransactionStateEnum.ROLLBACKED:
            throw new PreconditionFailedException(`Cannot be fulfilled as state is ${subtransaction.state}`);
          default: // Case for already SubtransactionStateEnum.CANCELLED, it should return true
            break;
        }
      }
      return true;
    } catch (e) {
      throw e;
    }
  }

  @LogDecorator()
  async cancelTransaction(headers: HeadersDto, data: CancelTransactionDto): Promise<boolean> {
    try {
      const { orderId } = data;
      await this.cancelSubtransaction(headers, orderId, PaymentMethodEnum.SADAD);
      await this.cancelSubtransaction(headers, orderId, PaymentMethodEnum.WALLET);
      return true;
    } catch (e) {
      throw e;
    }
  }

  @LogDecorator()
  async completeTransaction(headers: HeadersDto, data: CompleteTransactionDto, retailerId: string): Promise<any> {
    try {
      const { total, orderId, transactionType = TransactionTypeEnum.ORDER_PAYMENT } = data;

      const walletIdempKey = AppUtil.generateIdempKey(orderId, PaymentMethodEnum.WALLET);
      const walletSubtransaction = await this.dbWrapper.findByIdempKey(walletIdempKey);
      if (walletSubtransaction?.state === SubtransactionStateEnum.CANCELLED) return false;

      const currentHolding = walletSubtransaction
        ? new MoneyDto(walletSubtransaction.amount, walletSubtransaction.currency)
        : MoneyDto.zeroMoney(total.currency);

      let remainingAmount = total.subtract(currentHolding);
      const subtransactions = await this.getSubtransactions(headers, data);

      if (subtransactions.has(PaymentMethodEnum.SADAD)) {
        const sadadSubtransaction = subtransactions.get(PaymentMethodEnum.SADAD);
        remainingAmount = remainingAmount.subtract(
          new MoneyDto(sadadSubtransaction.amount, sadadSubtransaction.currency)
        );
        if (!remainingAmount.isAlmostZero())
          throw new PreconditionFailedException('TOTAL_AMOUNT_MISMATCH', JSON.stringify(remainingAmount.toJSON()));
        headers.idempotencyKey = sadadSubtransaction.id;
        await this.completeSubtransaction(headers, sadadSubtransaction, false);
        remainingAmount = MoneyDto.zeroMoney(remainingAmount.currency);
      }

      const cashIdempKey = AppUtil.generateIdempKey(orderId, PaymentMethodEnum.CASH);
      let cashSubtransaction = await this.dbWrapper.findByIdempKey(cashIdempKey);
      if (!cashSubtransaction && !remainingAmount.isZero())
        cashSubtransaction = await this.putInDb(orderId, remainingAmount.abs(), PaymentMethodEnum.CASH);
      if (cashSubtransaction?.state == SubtransactionStateEnum.HOLD_PROCESSING)
        cashSubtransaction = await this.holdInPayment(
          headers,
          retailerId,
          cashSubtransaction,
          PaymentMethodEnum.CASH,
          transactionType
        );

      if (walletSubtransaction) {
        headers.idempotencyKey = walletSubtransaction.id;
        await this.completeSubtransaction(headers, walletSubtransaction, false);
      }
      if (cashSubtransaction) {
        headers.idempotencyKey = cashSubtransaction.id;
        await this.completeSubtransaction(headers, cashSubtransaction, remainingAmount.isNegative());
      }

      return this.paymentMethodBreakdown(headers, { total, orderId });
    } catch (e) {
      throw e;
    }
  }

  @LogDecorator()
  async completeSubtransaction(headers: HeadersDto, subTransaction: SubtransactionEntity, topupWallet: boolean) {
    const { state, id } = subTransaction;
    switch (state) {
      case SubtransactionStateEnum.HOLD:
        await this.dbWrapper.setSubtransactionState(id, SubtransactionStateEnum.COMPLETE_PROCESSING);
      // falls through deliberatlely without break and "falls through" comment allows us to do that
      case SubtransactionStateEnum.COMPLETE_PROCESSING:
        if (topupWallet) {
          await this.apiWrapper.releasePayment(headers);
        } else {
          await this.apiWrapper.chargePayment(headers);
        }
        await this.dbWrapper.setSubtransactionState(id, SubtransactionStateEnum.COMPLETED);
        break;
      case SubtransactionStateEnum.CANCEL_PROCESSING:
      case SubtransactionStateEnum.CANCELLED:
      case SubtransactionStateEnum.HOLD_PROCESSING:
      case SubtransactionStateEnum.AWAITING_PAYMENT:
      case SubtransactionStateEnum.ROLLBACK_PROCESSING:
      case SubtransactionStateEnum.ROLLBACKED:
        throw new BadRequestException(`Cannot be fulfilled as state is ${subTransaction.state}`);
      default: // Case for already SubtransactionStateEnum.COMPLETED, it should return true
        break;
    }
  }

  @LogDecorator()
  async rollbackTransaction(headers: HeadersDto, data: RollbackTransactionDto, retailerId: string): Promise<boolean> {
    try {
      const { orderId } = data;
      let adjustedMoney = null;

      const sadadIdempKey = AppUtil.generateIdempKey(orderId, PaymentMethodEnum.SADAD);
      const sadadSubtransaction = await this.dbWrapper.findByIdempKey(sadadIdempKey);
      await this.rollbackSubtransaction(headers, sadadSubtransaction, null);

      const cashIdempKey = AppUtil.generateIdempKey(orderId, PaymentMethodEnum.CASH);
      const cashSubtransaction = await this.dbWrapper.findByIdempKey(cashIdempKey);
      const rollbackTransaction = await this.rollbackSubtransaction(headers, cashSubtransaction, null);

      const walletIdempKey = AppUtil.generateIdempKey(orderId, PaymentMethodEnum.WALLET);
      const walletSubtransaction = await this.dbWrapper.findByIdempKey(walletIdempKey);

      if (cashSubtransaction && rollbackTransaction?.isReleased && walletSubtransaction) {
        const cashAmount = new MoneyDto(cashSubtransaction.amount, cashSubtransaction.currency);
        const walletAmount = new MoneyDto(walletSubtransaction.amount, walletSubtransaction.currency);
        adjustedMoney = walletAmount.subtract(cashAmount);
      }

      await this.rollbackSubtransaction(headers, walletSubtransaction, adjustedMoney);

      let total = MoneyDto.zeroMoney(
        cashSubtransaction?.currency ||
          walletSubtransaction?.currency ||
          sadadSubtransaction?.currency ||
          CurrencyCodeEnum.PKR
      );

      if (walletSubtransaction) total = total.add(MoneyDto.fromSubtransaction(walletSubtransaction));
      if (sadadSubtransaction) total = total.add(MoneyDto.fromSubtransaction(sadadSubtransaction));
      if (total.isPositive()) {
        await this.createTransaction(
          headers,
          {
            orderId,
            retailerId,
            orderPaymentMethod: OrderPaymentMethodEnum.COD_WALLET,
            total,
            transactionType: TransactionTypeEnum.ORDER_PAYMENT,
          },
          retailerId
        );
      }
      return true;
    } catch (e) {
      throw e;
    }
  }

  @LogDecorator()
  async putInDb(orderId: string, amount: MoneyDto, paymentMethod: PaymentMethodEnum): Promise<SubtransactionEntity> {
    const idempKey = AppUtil.generateIdempKey(orderId, paymentMethod);
    const subtransaction = await this.dbWrapper.createSubtransaction({
      ...amount,
      orderId,
      idempKey,
      paymentMethod,
    });
    return subtransaction;
  }

  @LogDecorator()
  async resolvePMAmount(
    headers: HeadersDto,
    retailerId: string,
    data: CreateSubtransactionDto,
    paymentMethod: PaymentMethodEnum,
    subtransactions: Map<keyof typeof PaymentMethodEnum, SubtransactionEntity>
  ): Promise<MoneyDto> {
    const { orderId, total, orderPaymentMethod } = data;
    const idempKey = AppUtil.generateIdempKey(orderId, paymentMethod);
    const prevSubtransaction = await this.dbWrapper.findByIdempKey(idempKey);
    switch (paymentMethod) {
      case PaymentMethodEnum.WALLET:
        if (prevSubtransaction) return new MoneyDto(prevSubtransaction.amount, prevSubtransaction.currency);
        const balance = await this.apiWrapper.fetchCoinBalance(headers, retailerId, total.currency);
        if (balance.isZeroOrPositive()) {
          if (total.subtract(balance).isZeroOrPositive()) {
            return balance;
          } else {
            return total;
          }
        } else return MoneyDto.zeroMoney(total.currency);
      case PaymentMethodEnum.SADAD:
        if (prevSubtransaction) await this.cancelSubtransaction(headers, orderId, paymentMethod, true);
        if (total.currency !== CurrencyCodeEnum.SAR) throw new MethodNotAllowedException('CURRENCY_INVALID');
        let walletSubtransaction = subtransactions.get(PaymentMethodEnum.WALLET);
        if (!walletSubtransaction) {
          const idempKeyWallet = AppUtil.generateIdempKey(orderId, PaymentMethodEnum.WALLET);
          walletSubtransaction = await this.dbWrapper.findByIdempKey(idempKeyWallet);
        }
        if (walletSubtransaction) {
          if (orderPaymentMethod == OrderPaymentMethodEnum.SADAD)
            throw new PreconditionFailedException('WALLET_EXISTS');
          if (walletSubtransaction.currency !== CurrencyCodeEnum.SAR) {
            throw new MethodNotAllowedException('CURRENCY_INVALID');
          }
          const walletHolding = new MoneyDto(walletSubtransaction.amount, walletSubtransaction.currency);
          return total.subtract(walletHolding);
        }
        return total;
      case PaymentMethodEnum.CASH:
        await this.cancelSubtransaction(headers, orderId, PaymentMethodEnum.SADAD, true);
        return MoneyDto.zeroMoney(total.currency);
      default:
        return MoneyDto.zeroMoney(total.currency);
    }
  }

  @LogDecorator()
  async holdInPayment(
    headers: HeadersDto,
    account: string,
    subtransaction: SubtransactionEntity,
    paymentMethod: PaymentMethodEnum,
    transactionType: TransactionTypeEnum
  ): Promise<SubtransactionEntity> {
    try {
      const { id: subtransactionId, amount, currency } = subtransaction;
      if (amount <= 0) return subtransaction;
      headers.idempotencyKey = subtransactionId;
      await this.apiWrapper.holdPayment(headers, {
        account,
        money: new MoneyDto(amount, currency),
        paymentMethod,
        transactionType,
      });
      const state = AppUtil.isInstantPayment(paymentMethod)
        ? SubtransactionStateEnum.HOLD
        : SubtransactionStateEnum.AWAITING_PAYMENT;
      return await this.dbWrapper.setSubtransactionState(subtransactionId, state);
    } catch (e: any) {
      if (AppUtil.is3PMethod(paymentMethod) && e?.[0]?.name == 'INTERSERVICE_ERROR') {
        await this.dbWrapper.cancelIntent(subtransaction.id);
      }
      throw e;
    }
  }

  @LogDecorator()
  async paymentNotification(headers: HeadersDto): Promise<boolean> {
    const { idempotencyKey } = headers;
    const subTransaction = await this.dbWrapper.findById(idempotencyKey);
    switch (subTransaction?.state) {
      case SubtransactionStateEnum.AWAITING_PAYMENT:
      case SubtransactionStateEnum.HOLD_PROCESSING:
        await this.dbWrapper.setSubtransactionState(idempotencyKey, SubtransactionStateEnum.HOLD);
        return true;
      default:
        return false;
    }
  }

  @LogDecorator()
  async rollbackSubtransaction(
    headers: HeadersDto,
    subTransaction: SubtransactionEntity,
    adjustedMoney?: MoneyDto | null
  ): Promise<{ subTransaction: SubtransactionEntity; isReleased: boolean }> {
    try {
      const { id, state } = subTransaction || {};
      let rollbackPayment;
      switch (state) {
        case undefined:
          return undefined;
        case SubtransactionStateEnum.COMPLETED:
        case SubtransactionStateEnum.CANCELLED:
          await this.dbWrapper.setSubtransactionState(id, SubtransactionStateEnum.ROLLBACK_PROCESSING);
        // falls through deliberatlely without break and "falls through" comment allows us to do that
        case SubtransactionStateEnum.ROLLBACK_PROCESSING:
          headers.idempotencyKey = id;
          rollbackPayment = await this.apiWrapper.rollbackPayment(
            headers,
            adjustedMoney ?? MoneyDto.zeroMoney(subTransaction.currency)
          );
          subTransaction = await this.dbWrapper.rollbackSubtransaction(id);
        case SubtransactionStateEnum.ROLLBACKED:
          return {
            subTransaction,
            isReleased: rollbackPayment.data.isReleased,
          };
        default:
          return {
            subTransaction,
            isReleased: rollbackPayment.data.isReleased,
          };
      }
    } catch (e) {
      throw e;
    }
  }

  @LogDecorator()
  async calculateBatchCashAmounts(headers: HeadersDto, details: BatchCashDto): Promise<any> {
    try {
      const { batch } = details;
      const promises = batch.map(order => this.calculateCashAmount(headers, order));
      const res = await Promise.all(promises);
      const batchMap = {};
      res.forEach((cashAmount, ind) => {
        batchMap[batch[ind].orderId] = cashAmount;
      });
      return batchMap;
    } catch (e) {
      throw e;
    }
  }

  @LogDecorator()
  async calculateCashAmount(_headers: HeadersDto, details: CalculateCashDto): Promise<any> {
    try {
      const { orderId, total } = details;
      const walletIdempKey = AppUtil.generateIdempKey(orderId, PaymentMethodEnum.WALLET);
      const walletSubtransaction = await this.dbWrapper.findByIdempKey(walletIdempKey);
      if (!walletSubtransaction)
        return {
          walletAmount: MoneyDto.zeroMoney(total.currency).toJSON(),
          cashAmount: total.toJSON(),
        };
      const { amount, currency } = walletSubtransaction;
      const holdAmount = new MoneyDto(amount, currency);
      const cashAmount = total.subtract(holdAmount);
      return {
        walletAmount: total.lessThanOrEqual(holdAmount) ? total.toJSON() : holdAmount.toJSON(),
        cashAmount: cashAmount.isNegative() ? MoneyDto.zeroMoney(total.currency).toJSON() : cashAmount.toJSON(),
      };
    } catch (e) {
      throw e;
    }
  }

  @LogDecorator()
  async calculateBreakdown(headers: HeadersDto, details: PaymentBreakdownDto, retailerId: string): Promise<any> {
    try {
      const { paymentMethod, currency } = details;
      const responsePromise = this.apiWrapper.fetchOrderTotal(headers, details, retailerId, currency);

      // calling knexa asynchronously
      this.apiWrapper.callKnexaGetWalletBalance(headers, retailerId, currency);

      const balancePromise = this.apiWrapper.fetchCoinBalance(headers, retailerId, currency);
      const methods: Promise<MoneyDto>[] = [responsePromise];
      if (paymentMethod == OrderPaymentMethodEnum.COD_WALLET) methods.push(balancePromise);
      const res = await Promise.all(methods);
      const amountPayable = res[0];
      const zeroMoney = MoneyDto.zeroMoney(currency);
      let walletAmount = res[1] || zeroMoney;
      let finalAmount = amountPayable.subtract(walletAmount);
      if (finalAmount.isNegative()) {
        walletAmount = amountPayable;
        finalAmount = zeroMoney;
      }
      return {
        orderTotal: amountPayable.toJSON(),
        walletAmount: walletAmount.toJSON(),
        finalAmount: finalAmount.toJSON(),
      };
    } catch (error) {
      throw error;
    }
  }

  @LogDecorator()
  async getSubtransactions(
    headers: HeadersDto,
    dtoBody: CalculateCashDto
  ): Promise<Map<string, SubtransactionEntity & { code?: string }>> {
    try {
      const { orderId } = dtoBody;
      let orderSubtrnasactions = await this.dbWrapper.findAllByOrderId(orderId);
      orderSubtrnasactions = orderSubtrnasactions.filter(
        s =>
          s.state == SubtransactionStateEnum.HOLD ||
          s.state == SubtransactionStateEnum.AWAITING_PAYMENT ||
          s.state == SubtransactionStateEnum.COMPLETED ||
          s.state == SubtransactionStateEnum.COMPLETE_PROCESSING
      );
      const subtransactionsMap = MapperUtil.arrayToMap<SubtransactionEntity & { code?: string }>(
        orderSubtrnasactions,
        'paymentMethod'
      );
      if (subtransactionsMap.has(PaymentMethodEnum.SADAD)) {
        const sadadSubtransaction = subtransactionsMap.get(PaymentMethodEnum.SADAD);
        if (sadadSubtransaction.state == SubtransactionStateEnum.AWAITING_PAYMENT) {
          headers.idempotencyKey = sadadSubtransaction.id;
          const intent = await this.apiWrapper.paymentStatus(headers);
          if (intent.state == 'COMPLETED') {
            const updatedSubtransaction = await this.dbWrapper.setSubtransactionState(
              sadadSubtransaction.id,
              SubtransactionStateEnum.HOLD
            );
            sadadSubtransaction.state = updatedSubtransaction.state;
          }
          subtransactionsMap.set(PaymentMethodEnum.SADAD, { ...sadadSubtransaction, code: intent.ref3P });
        }
      }
      return subtransactionsMap;
    } catch (error) {
      throw error;
    }
  }

  @LogDecorator()
  async getOrderSubtransactions(
    headers: HeadersDto,
    dtoBody: CalculateCashDto
  ): Promise<Record<keyof typeof PaymentMethodEnum, SubtransactionStateDto>> {
    try {
      const { total } = dtoBody;
      const orderSubtrnasactions = await this.getSubtransactions(headers, dtoBody);
      const activeSubtransaction: SubtransactionStateDto[] = Array.from(orderSubtrnasactions.values()).map(s => {
        return {
          total: new MoneyDto(s.amount, s.currency),
          state: s.state,
          paymentMethod: s.paymentMethod,
          id: s.id,
          createdAt: s.createdAt,
          is3P: AppUtil.is3PMethod(s.paymentMethod),
          code: s.code,
        };
      });
      const subtransactionsMap = MapperUtil.arrayToObject(activeSubtransaction, 'paymentMethod');
      if (!subtransactionsMap[PaymentMethodEnum.SADAD]) {
        let cashTotal = total;
        if (subtransactionsMap[PaymentMethodEnum.WALLET]) {
          const walletHolding = subtransactionsMap[PaymentMethodEnum.WALLET];
          cashTotal = total.subtract(walletHolding.total);
        }
        if (cashTotal.isNegative()) {
          delete subtransactionsMap[PaymentMethodEnum.CASH];
        } else if (!subtransactionsMap[PaymentMethodEnum.CASH]) {
          subtransactionsMap[PaymentMethodEnum.CASH] = {
            total: cashTotal,
            state: SubtransactionStateEnum.AWAITING_PAYMENT,
            paymentMethod: PaymentMethodEnum.CASH,
            id: undefined,
            createdAt: undefined,
            is3P: false,
            code: undefined,
          };
        }
      }

      return subtransactionsMap;
    } catch (error) {
      throw error;
    }
  }

  async getOrdersBreakdown(headers: HeadersDto, data: BatchCashDto): Promise<any> {
    const orders = getAllOrdersFromBatches(data);
    const promises = orders.map(order => this.paymentMethodBreakdown(headers, order));
    const ordersBreakdownData = await Promise.all(promises);
    return formatedDataWithBatches(ordersBreakdownData);
  }

  @LogDecorator()
  async paymentMethodBreakdown(headers: HeadersDto, dtoBody: CalculateCashDto): Promise<any> {
    const { total, orderId } = dtoBody;
    const subtransactions = await this.getOrderSubtransactions(headers, dtoBody);
    let paymentMethod = '';
    if (subtransactions.CASH) {
      paymentMethod = OrderPaymentMethodEnum.COD;
    }
    if (subtransactions.SADAD) {
      paymentMethod = OrderPaymentMethodEnum.SADAD;
    }
    if (subtransactions.WALLET) {
      paymentMethod = OrderPaymentMethodEnum.COD_WALLET;
    }
    if (subtransactions.SADAD && subtransactions.WALLET) {
      paymentMethod = OrderPaymentMethodEnum.SADAD_WALLET;
    }
    return {
      order: {
        orderId,
        total,
        paymentMethod,
      },
      breakdown: subtransactions,
    };
  }

  @LogDecorator({ throwError: false })
  async sendPushNotification(retailerId: string, orderId: string, deliveryCode: string) {
    const args = { orderId, deliveryCode };
    const userData: IQueueMessage = {
      customerId: [+retailerId],
      templateName: NotificationTypeEnum.DELIVERY_CODE_GENERATED,
      language: 'EN',
      sender: 'notification-library',
      args,
    };
    await Notifications.sendMessage(userData);
  }
}
