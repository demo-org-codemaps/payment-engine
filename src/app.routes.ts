import { Routes } from '@nestjs/core';
import { TransactionModule } from './transaction';

export const appRoutes: Routes = [
  {
    path: 'transaction',
    module: TransactionModule,
  },
];
