import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService } from '../../../auth';
import {
  CurrencyCodeEnum,
  PaymentMethodEnum,
  SubtransactionStateEnum,
  HeadersDto,
  OrderPaymentMethodEnum,
  AppUtil,
} from '../../../shared';
import { CancelTransactionDto, MoneyDto } from '../../dtos';
import { SubtransactionEntity } from '../../entities';
import { ApiWrapperService } from '../api-wrapper.service';
import { DbWrapperService } from '../db-wrapper.service';
import { TransactionService } from '../transaction.service';

const headersDto = new HeadersDto();
headersDto.authorization = 'authorization';
headersDto.idempotencyKey = 'idempotency-key';
headersDto.language = 'english';

const findByIdempKeyObject = {
  orderId: 'order-id',
  idempKey: 'idemp-key-1',
  amount: 100,
  currency: CurrencyCodeEnum.PKR,
  paymentMethod: PaymentMethodEnum.WALLET,
  state: SubtransactionStateEnum.COMPLETED,
};

describe('TransactionService-cancelTransaction-1', () => {
  let transactionService: TransactionService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: SubtransactionStateEnum.HOLD };
    }),

    setSubtransactionState: jest.fn(() => {
      return findByIdempKeyObject;
    }),

    findAllByOrderId: jest.fn(() => {
      return [findByIdempKeyObject];
    }),

    cancelSubtransaction: jest.fn(() => {
      return { ...findByIdempKeyObject };
    }),
  };
  const mockApiWrapperService = {
    fetchCoinBalance: jest.fn(() => {
      return new MoneyDto(50, CurrencyCodeEnum.PKR);
    }),

    releasePayment: jest.fn(() => {
      return 'release-payment-date';
    }),

    cancelPayment: jest.fn(() => {
      return 'data';
    }),

    generateDeliveryVerificationCode: jest.fn(() => {
      return { deliveryCode: 'delivery-code' };
    }),
  };

  const mockAuthService = {};

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TransactionService,
        AppUtil,
        Logger,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();
    transactionService = moduleRef.get<TransactionService>(TransactionService);
  });

  describe('SubtransactionStateEnum-HOLD', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });
    const res = expect.any(Boolean);

    const putInDBOutput = {
      orderId: 'order-id',
      idempKey: 'idemp-key-1',
      amount: 100,
      currency: CurrencyCodeEnum.PKR,
      paymentMethod: PaymentMethodEnum.WALLET,
      state: SubtransactionStateEnum.COMPLETED,
    } as SubtransactionEntity;

    const holdInPaymentOutput = {
      orderId: 'order-id',
      idempKey: 'idemp-key-1',
      amount: 100,
      currency: CurrencyCodeEnum.PKR,
      paymentMethod: PaymentMethodEnum.WALLET,
      state: SubtransactionStateEnum.COMPLETED,
    } as SubtransactionEntity;

    const cancelTransactionDto = new CancelTransactionDto();
    cancelTransactionDto.orderId = 'order-id';
    cancelTransactionDto.orderPaymentMethod = OrderPaymentMethodEnum.COD_WALLET;

    jest.spyOn(TransactionService.prototype, 'putInDb').mockImplementation().mockResolvedValue(putInDBOutput);
    jest
      .spyOn(TransactionService.prototype, 'holdInPayment')
      .mockImplementation()
      .mockResolvedValue(holdInPaymentOutput);

    it('should return sub transaction entity', async () => {
      expect(await transactionService.cancelTransaction(headersDto, cancelTransactionDto)).toEqual(res);
    });
  });
});

describe('TransactionService-cancelTransaction-2', () => {
  let transactionService: TransactionService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: SubtransactionStateEnum.COMPLETE_PROCESSING };
    }),

    setSubtransactionState: jest.fn(() => {
      return findByIdempKeyObject;
    }),

    findAllByOrderId: jest.fn(() => {
      return [findByIdempKeyObject];
    }),
  };
  const mockApiWrapperService = {
    fetchCoinBalance: jest.fn(() => {
      return new MoneyDto(50, CurrencyCodeEnum.PKR);
    }),

    releasePayment: jest.fn(() => {
      return 'release-payment-date';
    }),

    generateDeliveryVerificationCode: jest.fn(() => {
      return { deliveryCode: 'delivery-code' };
    }),
  };

  const mockAuthService = {};

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TransactionService,
        AppUtil,
        Logger,
        { provide: DbWrapperService, useValue: mockDbWrapperService },
        { provide: ApiWrapperService, useValue: mockApiWrapperService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();
    transactionService = moduleRef.get<TransactionService>(TransactionService);
  });

  describe('SubtransactionStateEnum-COMPLETE_PROCESSING', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    const putInDBOutput = {
      orderId: 'order-id',
      idempKey: 'idemp-key-1',
      amount: 100,
      currency: CurrencyCodeEnum.PKR,
      paymentMethod: PaymentMethodEnum.WALLET,
      state: SubtransactionStateEnum.COMPLETED,
    } as SubtransactionEntity;

    const holdInPaymentOutput = {
      orderId: 'order-id',
      idempKey: 'idemp-key-1',
      amount: 100,
      currency: CurrencyCodeEnum.PKR,
      paymentMethod: PaymentMethodEnum.WALLET,
      state: SubtransactionStateEnum.COMPLETED,
    } as SubtransactionEntity;

    const cancelTransactionDto = new CancelTransactionDto();
    cancelTransactionDto.orderId = 'order-id';
    cancelTransactionDto.orderPaymentMethod = OrderPaymentMethodEnum.COD_WALLET;

    jest.spyOn(TransactionService.prototype, 'putInDb').mockImplementation().mockResolvedValue(putInDBOutput);
    jest
      .spyOn(TransactionService.prototype, 'holdInPayment')
      .mockImplementation()
      .mockResolvedValue(holdInPaymentOutput);

    it('should return error', async () => {
      try {
        await transactionService.cancelTransaction(headersDto, cancelTransactionDto);
      } catch (e) {
        expect(e.message).toEqual('Cannot be fulfilled as state is COMPLETE_PROCESSING');
        expect(e.status).toEqual(412);
      }
    });
  });
});
