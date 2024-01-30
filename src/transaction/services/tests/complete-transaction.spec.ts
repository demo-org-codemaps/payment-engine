import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SubtransactionStateDto } from 'src/transaction/dtos/subtransaction-state.dto';
import { AuthService } from '../../../auth';
import {
  CurrencyCodeEnum,
  PaymentMethodEnum,
  SubtransactionStateEnum,
  HeadersDto,
  OrderPaymentMethodEnum,
  AppUtil,
} from '../../../shared';
import { CompleteTransactionDto, MoneyDto } from '../../dtos';
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

const findByOrderIdObject = [
  {
    id: '24f90494-0263-4f9c-8d46-70b5ad96c66b',
    createdAt: {},
    updatedAt: {},
    version: 4,
    orderId: '246367',
    idempKey: '246367_WALLET',
    amount: 650,
    currency: 'PKR',
    paymentMethod: 'WALLET',
    state: 'COMPLETED',
  },
];

describe('TransactionService-completeTransaction-3', () => {
  let transactionService: TransactionService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return findByIdempKeyObject;
    }),

    findAllByOrderId: jest.fn(() => {
      return findByOrderIdObject;
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

  describe('SubtransactionStateEnum-COMPLETED', () => {
    const res = {
      breakdown: {
        CASH: expect.any(Object),
        WALLET: expect.any(Object),
      },
      order: {
        orderId: expect.any(String),
        paymentMethod: expect.any(String),
        total: {
          amount: expect.any(Number),
          currency: expect.any(String),
        },
      },
    };

    const walletTransaction = {
      WALLET: {
        id: 'b25f74c3-0226-48e0-a4a3-e101157f6e42',
        createdAt: 'Tue Oct 18 2022 13:22:28 GMT+0000 (Coordinated Universal Time)',
        updatedAt: 'Tue Oct 18 2022 13:23:11 GMT+0000 (Coordinated Universal Time)',
        version: 4,
        orderId: '1732617152',
        paymentMethod: 'WALLET',
        state: 'COMPLETED',
        amount: 1000,
        currency: 'PKR',
        idempKey: '1732617152_WALLET',
      },
    };

    const transactionMap = new Map(Object.entries(walletTransaction)) as unknown as Map<
      string,
      SubtransactionEntity & { code?: string }
    >;

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

    const completeTransactionDto = new CompleteTransactionDto();
    completeTransactionDto.orderId = 'order-id';
    completeTransactionDto.orderPaymentMethod = OrderPaymentMethodEnum.COD_WALLET;
    completeTransactionDto.retailerId = 'retailer-id';
    completeTransactionDto.total = new MoneyDto(1000, CurrencyCodeEnum.PKR);

    jest.spyOn(TransactionService.prototype, 'putInDb').mockImplementation().mockResolvedValue(putInDBOutput);
    jest
      .spyOn(TransactionService.prototype, 'holdInPayment')
      .mockImplementation()
      .mockResolvedValue(holdInPaymentOutput);
    jest
      .spyOn(TransactionService.prototype, 'getSubtransactions')
      .mockImplementation()
      .mockResolvedValue(transactionMap);

    it('should return sub transaction entity', async () => {
      expect(await transactionService.completeTransaction(headersDto, completeTransactionDto, 'retailer-id')).toEqual(
        res
      );
    });
  });
});

describe('TransactionService-completeTransaction-1', () => {
  let transactionService: TransactionService;

  const mockDbWrapperService = {
    findByIdempKey: jest
      .fn(() => {
        return { ...findByIdempKeyObject, state: SubtransactionStateEnum.HOLD_PROCESSING };
      })
      .mockReturnValueOnce(undefined),

    findAllByOrderId: jest.fn(() => {
      return findByOrderIdObject;
    }),
    setSubtransactionState: jest.fn(() => {
      return findByIdempKeyObject;
    }),
  };
  const mockApiWrapperService = {
    fetchCoinBalance: jest.fn(() => {
      return new MoneyDto(50, CurrencyCodeEnum.PKR);
    }),
    generateDeliveryVerificationCode: jest.fn(() => {
      return { deliveryCode: 'delivery-code' };
    }),
  };
  const mockAuthService = {};

  beforeEach(async () => {
    jest.clearAllMocks();

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

  describe('SubtransactionStateEnum-HOLD_PROCESSING', () => {
    afterEach(() => {
      jest.restoreAllMocks();
      jest.clearAllMocks();
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

    const completeTransactionDto = new CompleteTransactionDto();
    completeTransactionDto.orderId = 'order-id';
    completeTransactionDto.orderPaymentMethod = OrderPaymentMethodEnum.COD_WALLET;
    completeTransactionDto.retailerId = 'retailer-id';
    completeTransactionDto.total = new MoneyDto(1000, CurrencyCodeEnum.PKR);

    jest.spyOn(TransactionService.prototype, 'putInDb').mockImplementation().mockResolvedValue(putInDBOutput);
    jest
      .spyOn(TransactionService.prototype, 'holdInPayment')
      .mockImplementation()
      .mockResolvedValue(holdInPaymentOutput);

    it('should return sub transaction entity', async () => {
      try {
        await transactionService.completeTransaction(headersDto, completeTransactionDto, 'retailer-id');
      } catch (e) {
        expect(e.message).toEqual('Cannot be fulfilled as state is HOLD_PROCESSING');
        expect(e.status).toEqual(400);
      }
    });
  });
});

describe('TransactionService-completeTransaction-2', () => {
  let transactionService: TransactionService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: SubtransactionStateEnum.CANCELLED };
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

  describe('SubtransactionStateEnum-CANCELLED', () => {
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

    const completeTransactionDto = new CompleteTransactionDto();
    completeTransactionDto.orderId = 'order-id';
    completeTransactionDto.orderPaymentMethod = OrderPaymentMethodEnum.COD_WALLET;
    completeTransactionDto.retailerId = 'retailer-id';
    completeTransactionDto.total = new MoneyDto(1000, CurrencyCodeEnum.PKR);

    jest.spyOn(TransactionService.prototype, 'putInDb').mockImplementation().mockResolvedValue(putInDBOutput);
    jest
      .spyOn(TransactionService.prototype, 'holdInPayment')
      .mockImplementation()
      .mockResolvedValue(holdInPaymentOutput);

    it('should return sub transaction entity', async () => {
      expect(await transactionService.completeTransaction(headersDto, completeTransactionDto, 'retailer-id')).toEqual(
        res
      );
    });
  });
});
