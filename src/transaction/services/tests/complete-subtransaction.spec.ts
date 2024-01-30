import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthService } from '../../../auth';
import { CurrencyCodeEnum, PaymentMethodEnum, SubtransactionStateEnum, HeadersDto, AppUtil } from '../../../shared';
import { MoneyDto } from '../../dtos';
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

describe('TransactionService-completeSubtransaction-1', () => {
  let transactionService: TransactionService;

  const mockDbWrapperService = {
    findByIdempKey: jest.fn(() => {
      return { ...findByIdempKeyObject, state: SubtransactionStateEnum.HOLD };
    }),

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

    chargePayment: jest.fn(() => {
      return 'charge-payment';
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

    it('should return sub transaction entity', async () => {
      expect(await transactionService.completeSubtransaction(headersDto, subtransactionEntity, true)).toEqual(
        undefined
      );
    });

    it('should return sub transaction entity', async () => {
      expect(await transactionService.completeSubtransaction(headersDto, subtransactionEntity, false)).toEqual(
        undefined
      );
    });
  });

  describe('SubtransactionStateEnum-COMPLETE_PROCESSING', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    const subtransactionEntity = new SubtransactionEntity();
    subtransactionEntity.amount = 45;
    subtransactionEntity.createdAt = 'created-at';
    subtransactionEntity.currency = CurrencyCodeEnum.PKR;
    subtransactionEntity.id = 'id';
    subtransactionEntity.idempKey = 'idemp-key';
    subtransactionEntity.orderId = 'order-id';
    subtransactionEntity.paymentMethod = PaymentMethodEnum.WALLET;
    subtransactionEntity.state = SubtransactionStateEnum.COMPLETE_PROCESSING;
    subtransactionEntity.updatedAt = 'updated-at';
    subtransactionEntity.version = 1;

    it('should return sub transaction entity', async () => {
      expect(await transactionService.completeSubtransaction(headersDto, subtransactionEntity, true)).toEqual(
        undefined
      );
    });

    it('should return sub transaction entity', async () => {
      expect(await transactionService.completeSubtransaction(headersDto, subtransactionEntity, false)).toEqual(
        undefined
      );
    });
  });
});
