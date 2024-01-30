import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionController } from './controllers/transaction.controller';
import { SubtransactionRepository } from './repositories/subtransaction.repository';
import { TransactionService, GrpcWrapperService, DbWrapperService, ApiWrapperService } from './services';
import { ClientProxyFactory } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { grpcConfig } from '../core';
import { PAYMENT_PACKAGE_NAME } from '../generated/src/protos/payment';
import { WALLET_PACKAGE_NAME } from '../../src/generated/src/protos/wallet';
import { HttpModule } from '@nestjs/axios';
import { AuthModule, AuthService } from '../auth';

@Module({
  imports: [TypeOrmModule.forFeature([SubtransactionRepository]), HttpModule, AuthModule],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    GrpcWrapperService,
    DbWrapperService,
    ApiWrapperService,
    AuthService,
    {
      provide: PAYMENT_PACKAGE_NAME,
      useFactory: (configService: ConfigService) =>
        ClientProxyFactory.create(grpcConfig(configService, PAYMENT_PACKAGE_NAME)),
      inject: [ConfigService],
    },
    {
      provide: WALLET_PACKAGE_NAME,
      useFactory: (configService: ConfigService) =>
        ClientProxyFactory.create(grpcConfig(configService, WALLET_PACKAGE_NAME)),
      inject: [ConfigService],
    },
  ],
  exports: [TransactionService],
})
export class TransactionModule {}
