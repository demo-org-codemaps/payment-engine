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
import { MoneyDto, RollbackTransactionDto } from '../../dtos';
import { SubtransactionEntity } from '../../entities';
import { ApiWrapperService } from '../api-wrapper.service';
import { DbWrapperService } from '../db-wrapper.service';
import { TransactionService } from '../transaction.service';

const headersDto = new HeadersDto();
headersDto.authorization = 'authorization';
headersDto.idempotencyKey = 'idempotency-key';
headersDto.language = 'english';

const createTransactionOut = {
  WALLET: {
    orderId: 'order-id',
    idempKey: 'idemp-key-1',
    amount: 100,
    currency: CurrencyCodeEnum.PKR,
    paymentMethod: PaymentMethodEnum.WALLET,
    state: SubtransactionStateEnum.COMPLETED,
  },
};

const findByIdempKeyObject = {
  orderId: 'order-id',
  idempKey: 'idemp-key-2',
  amount: 100,
  currency: CurrencyCodeEnum.PKR,
  paymentMethod: PaymentMethodEnum.WALLET,
  state: SubtransactionStateEnum.COMPLETED,
};

describe('TransactionService-rollbackTransaction-1', () => {
  let transactionService: TransactionService;

  const mockDbWrapperService = {
    findByIdempKey: jest
      .fn(() => {
        return { ...findByIdempKeyObject, state: SubtransactionStateEnum.COMPLETED };
      })
      .mockReturnValueOnce(null)
      .mockReturnValueOnce({ ...findByIdempKeyObject, state: SubtransactionStateEnum.HOLD }),
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

  describe('SubtransactionStateEnum-COMPLETED', () => {
    const res = expect.any(Boolean);

    const putInDBOutput = {
      subTransaction: {
        orderId: 'order-id',
        idempKey: 'idemp-key-1',
        amount: 100,
        currency: CurrencyCodeEnum.PKR,
        paymentMethod: PaymentMethodEnum.WALLET,
        state: SubtransactionStateEnum.COMPLETED,
      } as SubtransactionEntity,
      isReleased: true,
    };

    const createTransactionOutput = {
      ...createTransactionOut,
    } as Record<keyof typeof PaymentMethodEnum, SubtransactionEntity>;

    const rollbackTransactionDto = new RollbackTransactionDto();
    rollbackTransactionDto.orderId = 'order-id';
    rollbackTransactionDto.retailerId = 'retailer-id';

    jest
      .spyOn(TransactionService.prototype, 'rollbackSubtransaction')
      .mockImplementation()
      .mockResolvedValue(putInDBOutput);

    jest
      .spyOn(TransactionService.prototype, 'createTransaction')
      .mockImplementation()
      .mockResolvedValue(createTransactionOutput);

    it('should return sub transaction entity', async () => {
      expect(await transactionService.rollbackTransaction(headersDto, rollbackTransactionDto, 'retailer-id')).toEqual(
        res
      );
    });
  });
});

describe('TransactionService-rollbackTransaction-2', () => {
  let transactionService: TransactionService;

  const mockDbWrapperService = {
    findByIdempKey: jest
      .fn(() => {
        return { ...findByIdempKeyObject, state: SubtransactionStateEnum.COMPLETED };
      })
      .mockReturnValueOnce(null),

    setSubtransactionState: jest.fn(() => {
      return findByIdempKeyObject;
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

  describe('SubtransactionStateEnum-COMPLETED', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });
    const res = expect.any(Boolean);

    const putInDBOutput = {
      subTransaction: {
        orderId: 'order-id',
        idempKey: 'idemp-key-1',
        amount: 100,
        currency: CurrencyCodeEnum.PKR,
        paymentMethod: PaymentMethodEnum.WALLET,
        state: SubtransactionStateEnum.COMPLETED,
      } as SubtransactionEntity,
      isReleased: true,
    };

    const rollbackTransactionDto = new RollbackTransactionDto();
    rollbackTransactionDto.orderId = 'order-id';
    rollbackTransactionDto.retailerId = 'retailer-id';

    const createTransactionOutput = {
      ...createTransactionOut,
    } as Record<keyof typeof PaymentMethodEnum, SubtransactionEntity>;

    jest
      .spyOn(TransactionService.prototype, 'rollbackSubtransaction')
      .mockImplementation()
      .mockResolvedValue(putInDBOutput);

    jest
      .spyOn(TransactionService.prototype, 'createTransaction')
      .mockImplementation()
      .mockResolvedValue(createTransactionOutput);

    it('should return sub transaction entity', async () => {
      expect(await transactionService.rollbackTransaction(headersDto, rollbackTransactionDto, 'retailer-id')).toEqual(
        res
      );
    });
  });
});
