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
  TransactionTypeEnum,
} from '../../../shared';
import {
  BatchCashDto,
  CalculateCashDto,
  CancelTransactionDto,
  MoneyDto,
  PaymentBreakdownDto,
  RollbackTransactionDto,
} from '../../dtos';
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

describe('TransactionService-1', () => {
  let transactionService: TransactionService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: SubtransactionStateEnum.HOLD };
    }),

    createSubtransaction: jest.fn(() => {
      return { ...findByIdempKeyObject, createdAt: 'created-at', id: 'id', updatedAt: 'updated-at', version: 1 };
    }),

    setSubtransactionState: jest.fn(() => {
      return { ...findByIdempKeyObject, createdAt: 'created-at', id: 'id', updatedAt: 'updated-at', version: 1 };
    }),

    rollbackSubtransaction: jest.fn(() => {
      return { ...findByIdempKeyObject, createdAt: 'created-at', id: 'id', updatedAt: 'updated-at', version: 1 };
    }),
  };
  const mockApiWrapperService = {
    holdPayment: jest.fn(() => {
      return 'ids';
    }),

    rollbackPayment: jest.fn(() => {
      return 'payment-roll-back';
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

  describe('putInDb', () => {
    const res = {
      orderId: expect.any(String),
      idempKey: expect.any(String),
      amount: expect.any(Number),
      currency: expect.any(String),
      paymentMethod: expect.any(String),
      state: expect.any(String),
      createdAt: expect.any(String),
      id: expect.any(String),
      updatedAt: expect.any(String),
      version: expect.any(Number),
    };

    const cancelTransactionDto = new CancelTransactionDto();
    cancelTransactionDto.orderId = 'order-id';
    cancelTransactionDto.orderPaymentMethod = OrderPaymentMethodEnum.COD_WALLET;

    it('should return sub transaction entity', async () => {
      expect(
        await transactionService.putInDb('order-id', new MoneyDto(100, CurrencyCodeEnum.PKR), PaymentMethodEnum.WALLET)
      ).toEqual(res);
    });
  });

  describe('holdInPayment-amount > 0', () => {
    const res = {
      orderId: expect.any(String),
      idempKey: expect.any(String),
      amount: expect.any(Number),
      currency: expect.any(String),
      paymentMethod: expect.any(String),
      state: expect.any(String),
      createdAt: expect.any(String),
      id: expect.any(String),
      updatedAt: expect.any(String),
      version: expect.any(Number),
    };

    const subtransactionEntity = new SubtransactionEntity();
    subtransactionEntity.amount = 45;
    subtransactionEntity.createdAt = 'created-at';
    subtransactionEntity.currency = CurrencyCodeEnum.PKR;
    subtransactionEntity.id = 'id';
    subtransactionEntity.idempKey = 'idemp-key';
    subtransactionEntity.orderId = 'order-id';
    subtransactionEntity.paymentMethod = PaymentMethodEnum.WALLET;
    subtransactionEntity.state = SubtransactionStateEnum.HOLD;
    subtransactionEntity.updatedAt = 'updated-at';
    subtransactionEntity.version = 1;

    const cancelTransactionDto = new CancelTransactionDto();
    cancelTransactionDto.orderId = 'order-id';
    cancelTransactionDto.orderPaymentMethod = OrderPaymentMethodEnum.COD_WALLET;

    it('should return sub transaction entity', async () => {
      expect(
        await transactionService.holdInPayment(
          headersDto,
          'account',
          subtransactionEntity,
          PaymentMethodEnum.WALLET,
          TransactionTypeEnum.ORDER_PAYMENT
        )
      ).toEqual(res);
    });
  });

  describe('holdInPayment-amount <= 0', () => {
    const res = {
      orderId: expect.any(String),
      idempKey: expect.any(String),
      amount: expect.any(Number),
      currency: expect.any(String),
      paymentMethod: expect.any(String),
      state: expect.any(String),
      createdAt: expect.any(String),
      id: expect.any(String),
      updatedAt: expect.any(String),
      version: expect.any(Number),
    };

    const subtransactionEntity = new SubtransactionEntity();
    subtransactionEntity.amount = 0;
    subtransactionEntity.createdAt = 'created-at';
    subtransactionEntity.currency = CurrencyCodeEnum.PKR;
    subtransactionEntity.id = 'id';
    subtransactionEntity.idempKey = 'idemp-key';
    subtransactionEntity.orderId = 'order-id';
    subtransactionEntity.paymentMethod = PaymentMethodEnum.WALLET;
    subtransactionEntity.state = SubtransactionStateEnum.HOLD;
    subtransactionEntity.updatedAt = 'updated-at';
    subtransactionEntity.version = 1;

    const cancelTransactionDto = new CancelTransactionDto();
    cancelTransactionDto.orderId = 'order-id';
    cancelTransactionDto.orderPaymentMethod = OrderPaymentMethodEnum.COD_WALLET;

    it('should return sub transaction entity', async () => {
      expect(
        await transactionService.holdInPayment(
          headersDto,
          'account',
          subtransactionEntity,
          PaymentMethodEnum.WALLET,
          TransactionTypeEnum.ORDER_PAYMENT
        )
      ).toEqual(res);
    });
  });

  describe('calculateBatchCashAmounts', () => {
    const res = {
      'order-id-1': {
        cashAmount: {
          amount: expect.any(Number),
          currency: expect.any(String),
        },
        walletAmount: {
          amount: expect.any(Number),
          currency: expect.any(String),
        },
      },
    };

    const batchCashDto = new BatchCashDto();
    batchCashDto.batch = [{ orderId: 'order-id-1', total: new MoneyDto(45, CurrencyCodeEnum.PKR) }];

    it('should return sub transaction entity', async () => {
      expect(await transactionService.calculateBatchCashAmounts(headersDto, batchCashDto)).toEqual(res);
    });
  });
});

describe('TransactionService-rollback-1', () => {
  let transactionService: TransactionService;

  const mockDbWrapperService = {
    findByIdempKey: jest
      .fn(() => {
        return { ...findByIdempKeyObject, state: SubtransactionStateEnum.HOLD };
      })
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({ ...findByIdempKeyObject, state: SubtransactionStateEnum.COMPLETED })
      .mockReturnValueOnce({ ...findByIdempKeyObject, state: SubtransactionStateEnum.COMPLETED }),

    createSubtransaction: jest.fn(() => {
      return { ...findByIdempKeyObject, createdAt: 'created-at', id: 'id', updatedAt: 'updated-at', version: 1 };
    }),

    cancelIntent: jest.fn(() => {
      return findByIdempKeyObject;
    }),

    findAllByOrderId: jest.fn(() => {
      return [findByIdempKeyObject];
    }),

    setSubtransactionState: jest.fn(() => {
      return {
        ...findByIdempKeyObject,
        createdAt: 'created-at',
        id: 'id',
        updatedAt: 'updated-at',
        version: 1,
        state: SubtransactionStateEnum.ROLLBACK_PROCESSING,
      };
    }),

    rollbackSubtransaction: jest.fn(() => {
      return {
        ...findByIdempKeyObject,
        createdAt: 'created-at',
        id: 'id',
        updatedAt: 'updated-at',
        version: 1,
        state: SubtransactionStateEnum.ROLLBACKED,
      };
    }),

    cancelSubtransaction: jest.fn(() => {
      return { ...findByIdempKeyObject };
    }),
  };
  const mockApiWrapperService = {
    holdPayment: jest.fn(() => {
      return 'ids';
    }),

    rollbackPayment: jest.fn(() => {
      return {
        data: {
          isReleased: true,
          transaction: {
            ...findByIdempKeyObject,
            createdAt: 'created-at',
            id: 'id-1',
            updatedAt: 'updated-at',
            version: 1,
          },
        },
      };
    }),

    cancelPayment: jest.fn(() => {
      return 'data';
    }),

    generateDeliveryVerificationCode: jest.fn(() => {
      return { deliveryCode: 'delivery-code' };
    }),
  };
  const mockAuthService = {
    generateServiceToken: jest.fn(() => {
      return 'string';
    }),
  };

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

  describe('rollbackInPayment-2', () => {
    const res = expect.any(Boolean);

    const rollbackTransactionDto = new RollbackTransactionDto();
    rollbackTransactionDto.orderId = 'order-id';
    rollbackTransactionDto.retailerId = 'retailer-id';

    it('should return sub transaction entity 2', async () => {
      expect(await transactionService.rollbackTransaction(headersDto, rollbackTransactionDto, 'retailer-id')).toEqual(
        res
      );
    });
  });
});

describe('TransactionService-calculateCashAmount-SubtransactionStateEnum-HOLD', () => {
  let transactionService: TransactionService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: SubtransactionStateEnum.HOLD };
    }),
  };
  const mockApiWrapperService = {
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

  describe('calculateCashAmount', () => {
    const res = {
      cashAmount: {
        amount: expect.any(Number),
        currency: expect.any(String),
      },
      walletAmount: {
        amount: expect.any(Number),
        currency: expect.any(String),
      },
    };

    const calculateCashDto = new CalculateCashDto();
    calculateCashDto.orderId = 'order-id';
    calculateCashDto.total = new MoneyDto(100, CurrencyCodeEnum.PKR);

    it('should return sub transaction entity', async () => {
      expect(await transactionService.calculateCashAmount(headersDto, calculateCashDto)).toEqual(res);
    });
  });
});

describe('TransactionService-calculateCashAmount-SubtransactionStateEnum-COMPLETED', () => {
  let transactionService: TransactionService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: SubtransactionStateEnum.COMPLETED };
    }),
  };
  const mockApiWrapperService = {
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

  describe('calculateCashAmount', () => {
    const calculateCashDto = new CalculateCashDto();
    calculateCashDto.orderId = 'order-id';
    calculateCashDto.total = new MoneyDto(100, CurrencyCodeEnum.PKR);

    it('should return sub transaction entity', async () => {
      try {
        await transactionService.calculateCashAmount(headersDto, calculateCashDto);
      } catch (e) {
        expect(e.message).toEqual('Precondition Failed');
      }
    });
  });
});

describe('TransactionService-calculateBreakdown', () => {
  let transactionService: TransactionService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: SubtransactionStateEnum.COMPLETED };
    }),
  };
  const mockApiWrapperService = {
    fetchOrderTotal: jest.fn(() => {
      return new MoneyDto(45, CurrencyCodeEnum.PKR);
    }),

    fetchCoinBalance: jest.fn(() => {
      return new MoneyDto(50, CurrencyCodeEnum.PKR);
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

  describe('calculateCashAmount', () => {
    const res = {
      finalAmount: { amount: 0.45, currency: 'PKR' },
      orderTotal: { amount: 0.45, currency: 'PKR' },
      walletAmount: { amount: 0, currency: 'PKR' },
    };
    const paymentBreakdownDto = new PaymentBreakdownDto();
    paymentBreakdownDto.currency = CurrencyCodeEnum.PKR;
    paymentBreakdownDto.payload = 'Payload';
    paymentBreakdownDto.retailerId = 'retailer-id';

    it('should return sub transaction entity', async () => {
      expect(await transactionService.calculateBreakdown(headersDto, paymentBreakdownDto, 'retailer-id')).toEqual(res);
    });
  });
});
