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
import { CreateTransactionDto, MoneyDto } from '../../dtos';
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

describe('TransactionService-createTransaction-1', () => {
  let transactionService: TransactionService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: undefined };
    }),
    cancelIntent: jest.fn(() => {
      return findByIdempKeyObject;
    }),
    findAllByOrderId: jest.fn(() => {
      return [{ ...findByIdempKeyObject, state: SubtransactionStateEnum.HOLD }];
    }),
  };
  const mockApiWrapperService = {
    fetchCoinBalance: jest.fn(() => {
      return new MoneyDto(50, CurrencyCodeEnum.PKR);
    }),

    holdInPayment: jest.fn(() => {
      return 'hold-in-ids';
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

  describe('SubtransactionStateEnum-undefined', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });
    const res = expect.any(Object);

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

    const createTransactionDto = new CreateTransactionDto();
    createTransactionDto.orderId = 'order-id';
    createTransactionDto.orderPaymentMethod = OrderPaymentMethodEnum.COD_WALLET;
    createTransactionDto.retailerId = 'retailer-id';
    createTransactionDto.total = new MoneyDto(1000, CurrencyCodeEnum.PKR);

    jest.spyOn(TransactionService.prototype, 'putInDb').mockImplementation().mockResolvedValue(putInDBOutput);
    jest
      .spyOn(TransactionService.prototype, 'generateDeliveryCodeAndNotifyRetailer')
      .mockImplementation()
      .mockResolvedValue(null);
    jest
      .spyOn(TransactionService.prototype, 'holdInPayment')
      .mockImplementation()
      .mockResolvedValue(holdInPaymentOutput);

    it('should return sub transaction entity', async () => {
      expect(await transactionService.createTransaction(headersDto, createTransactionDto, 'retailer-id')).toEqual(res);
    });
  });
});

describe('TransactionService-createTransaction-2', () => {
  let transactionService: TransactionService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: SubtransactionStateEnum.COMPLETED };
    }),

    setSubtransactionState: jest.fn(() => {
      return findByIdempKeyObject;
    }),

    cancelIntent: jest.fn(() => {
      return findByIdempKeyObject;
    }),
  };
  const mockApiWrapperService = {
    fetchCoinBalance: jest.fn(() => {
      return new MoneyDto(50, CurrencyCodeEnum.PKR);
    }),

    holdInPayment: jest.fn(() => {
      return 'hold-in-ids';
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

  describe('SubtransactionStateEnum-COMPLETED', () => {
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

    const createTransactionDto = new CreateTransactionDto();
    createTransactionDto.orderId = 'order-id';
    createTransactionDto.orderPaymentMethod = OrderPaymentMethodEnum.COD_WALLET;
    createTransactionDto.retailerId = 'retailer-id';
    createTransactionDto.total = new MoneyDto(1000, CurrencyCodeEnum.PKR);

    jest
      .spyOn(TransactionService.prototype, 'generateDeliveryCodeAndNotifyRetailer')
      .mockImplementation()
      .mockResolvedValue(null);
    jest.spyOn(TransactionService.prototype, 'putInDb').mockImplementation().mockResolvedValue(putInDBOutput);
    jest
      .spyOn(TransactionService.prototype, 'holdInPayment')
      .mockImplementation()
      .mockResolvedValue(holdInPaymentOutput);

    it('should return error', async () => {
      try {
        await transactionService.createTransaction(headersDto, createTransactionDto, 'retailer-id');
      } catch (e) {
        expect(e.message).toEqual('Cannot be fulfilled as state is COMPLETED');
        expect(e.status).toEqual(400);
      }
    });
  });
});

describe('TransactionService-createTransaction-3', () => {
  let transactionService: TransactionService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: SubtransactionStateEnum.HOLD };
    }),
    setSubtransactionState: jest.fn(() => {
      return findByIdempKeyObject;
    }),
    cancelSubtransaction: jest.fn(() => {
      return { ...findByIdempKeyObject };
    }),
    cancelIntent: jest.fn(() => {
      return findByIdempKeyObject;
    }),
    findAllByOrderId: jest.fn(() => {
      return [{ ...findByIdempKeyObject, state: SubtransactionStateEnum.HOLD }];
    }),
  };
  const mockApiWrapperService = {
    holdInPayment: jest.fn(() => {
      return 'hold-in-ids';
    }),

    fetchCoinBalance: jest.fn(() => {
      return new MoneyDto(50, CurrencyCodeEnum.PKR);
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

  describe('SubtransactionStateEnum-HOLD', () => {
    const res = {
      order: expect.any(Object),
      breakdown: expect.any(Object),
    };

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

    const createTransactionDto = new CreateTransactionDto();
    createTransactionDto.orderId = 'order-id';
    createTransactionDto.orderPaymentMethod = OrderPaymentMethodEnum.COD_WALLET;
    createTransactionDto.retailerId = 'retailer-id';
    createTransactionDto.total = new MoneyDto(1000, CurrencyCodeEnum.PKR);

    jest
      .spyOn(TransactionService.prototype, 'generateDeliveryCodeAndNotifyRetailer')
      .mockImplementation()
      .mockResolvedValue(null);
    jest.spyOn(TransactionService.prototype, 'putInDb').mockImplementation().mockResolvedValue(putInDBOutput);
    jest
      .spyOn(TransactionService.prototype, 'holdInPayment')
      .mockImplementation()
      .mockResolvedValue(holdInPaymentOutput);

    it('should return sub transaction entity', async () => {
      expect(await transactionService.createTransaction(headersDto, createTransactionDto, 'retailer-id')).toEqual(res);
    });
  });
});
