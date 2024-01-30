import { Body, Controller, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public, RequestHeaders } from '../../core';
import { TransactionService } from '../services';
import {
  BatchCashDto,
  CalculateCashDto,
  CancelTransactionDto,
  CompleteTransactionDto,
  CreateTransactionDto,
  PaymentBreakdownDto,
  RollbackTransactionDto,
} from '../dtos';
import { CONSTANTS } from '../../app.constants';
import { HeadersDto } from '../../shared';

@ApiTags('Transaction')
@Public()
@Controller()
@ApiBearerAuth()
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  /* Important TODO:
  We will have to create a stale request table in which we will store the data, where we will get timeout error
  and we will send the error to client but we will need to make sure the data on payment side against it does not exist.
  Probability for this is extremely low, that's why I am moving forward. */

  @UseGuards(AuthGuard([CONSTANTS.SERVICE_AUTH, CONSTANTS.CONSUMER_AUTH]))
  @Post()
  async createTransaction(@RequestHeaders() headers: HeadersDto, @Body() data: CreateTransactionDto): Promise<any> {
    const subTransactions = await this.transactionService.createTransaction(headers, data, data.retailerId);
    return { data: subTransactions };
  }

  @UseGuards(AuthGuard(CONSTANTS.SERVICE_AUTH))
  @Put('/complete')
  async completeTransaction(@RequestHeaders() headers: HeadersDto, @Body() data: CompleteTransactionDto): Promise<any> {
    // const { id, token } = req.user;
    const res = await this.transactionService.completeTransaction(headers, data, data.retailerId);
    return { data: res };
  }

  @UseGuards(AuthGuard(CONSTANTS.SERVICE_AUTH))
  @Put('/cancel')
  async cancelTransaction(@RequestHeaders() headers: HeadersDto, @Body() data: CancelTransactionDto): Promise<any> {
    const res = await this.transactionService.cancelTransaction(headers, data);
    return { data: res };
  }

  @UseGuards(AuthGuard(CONSTANTS.SERVICE_AUTH))
  @Put('/rollback')
  async rollbackTransaction(@RequestHeaders() headers: HeadersDto, @Body() data: RollbackTransactionDto): Promise<any> {
    const res = await this.transactionService.rollbackTransaction(headers, data, data.retailerId);
    return { data: res };
  }

  @UseGuards(AuthGuard(CONSTANTS.CONSUMER_AUTH))
  @Put('/breakdown')
  async paymentBreakdown(@RequestHeaders() headers: HeadersDto, @Body() data: PaymentBreakdownDto): Promise<any> {
    const res = await this.transactionService.calculateBreakdown(headers, data, data.retailerId);
    return { data: res };
  }

  @UseGuards(AuthGuard([CONSTANTS.SERVICE_AUTH, CONSTANTS.CONSUMER_AUTH]))
  @Post('/subtransactions')
  async getSubtransactions(@RequestHeaders() headers: HeadersDto, @Body() body: CalculateCashDto): Promise<any> {
    const res = await this.transactionService.paymentMethodBreakdown(headers, body);
    return { data: res };
  }

  @UseGuards(AuthGuard([CONSTANTS.SERVICE_AUTH, CONSTANTS.CONSUMER_AUTH]))
  @Post('/ordersBreakdown')
  async getOrdersBreakdown(@RequestHeaders() headers: HeadersDto, @Body() body: BatchCashDto): Promise<any> {
    const res = await this.transactionService.getOrdersBreakdown(headers, body);
    return { data: res };
  }

  @UseGuards(AuthGuard(CONSTANTS.SERVICE_AUTH))
  @Put('/cashToBeCollected')
  async calculateCashAmount(@RequestHeaders() headers: HeadersDto, @Body() data: CalculateCashDto): Promise<any> {
    const res = await this.transactionService.calculateCashAmount(headers, data);
    return { data: res };
  }

  @UseGuards(AuthGuard(CONSTANTS.SERVICE_AUTH))
  @Put('/batchCashToBeCollected')
  async calculateBatchCashAmounts(@RequestHeaders() headers: HeadersDto, @Body() data: BatchCashDto): Promise<any> {
    const res = await this.transactionService.calculateBatchCashAmounts(headers, data);
    return { data: res };
  }

  @ApiExcludeEndpoint()
  @UseGuards(AuthGuard(CONSTANTS.SERVICE_AUTH))
  @Put('/paymentNotification')
  async paymentNotification(@RequestHeaders() headers: HeadersDto): Promise<any> {
    const res = await this.transactionService.paymentNotification(headers);
    return { data: res };
  }
}
