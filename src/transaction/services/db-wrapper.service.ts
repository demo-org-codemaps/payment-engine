import { Injectable } from '@nestjs/common';
import { SubtransactionStateEnum } from '../../shared';
import { Connection, In } from 'typeorm';
import { SubtransactionEntity } from '../entities';
import { SubtransactionRepository } from '../repositories';

@Injectable()
export class DbWrapperService {
  constructor(
    private readonly connection: Connection,
    private readonly subtransactionRepository: SubtransactionRepository
  ) {}

  async createSubtransaction(entity: Partial<SubtransactionEntity>): Promise<SubtransactionEntity> {
    const subtransaction: SubtransactionEntity = await this.connection.transaction(async transManager => {
      const { identifiers } = await transManager.insert(SubtransactionEntity, entity);
      return await transManager.findOne<SubtransactionEntity>(SubtransactionEntity, identifiers[0]['id']);
    });
    return subtransaction;
  }

  async setSubtransactionState(id: string, state: SubtransactionStateEnum): Promise<SubtransactionEntity> {
    const subtransactionEntity: SubtransactionEntity = await this.connection.transaction(async transManager => {
      await transManager.update(SubtransactionEntity, { id }, { state });
      return await transManager.findOneOrFail<SubtransactionEntity>(SubtransactionEntity, id);
    });
    return subtransactionEntity;
  }

  async setSubtransactionsState(ids: string[], state: SubtransactionStateEnum): Promise<boolean> {
    const res = await this.subtransactionRepository.update({ id: In(ids) }, { state });
    return res.affected == ids.length;
  }

  async rollbackSubtransaction(id: string): Promise<SubtransactionEntity> {
    const subtransactionEntity: SubtransactionEntity = await this.connection.transaction(async transManager => {
      const { idempKey } = await transManager.findOne<SubtransactionEntity>(SubtransactionEntity, id);
      const updatedIdempKey = `${idempKey}_${id}`;
      await transManager.update(
        SubtransactionEntity,
        { id },
        { state: SubtransactionStateEnum.ROLLBACKED, idempKey: updatedIdempKey }
      );
      return await transManager.findOneOrFail<SubtransactionEntity>(SubtransactionEntity, id);
    });
    return subtransactionEntity;
  }

  // Just to improve code readability and move intent directly to end state i.e. Rollback
  async cancelIntent(id: string): Promise<SubtransactionEntity> {
    return await this.rollbackSubtransaction(id);
  }

  async cancelSubtransaction(id: string): Promise<SubtransactionEntity> {
    const subtransactionEntity: SubtransactionEntity = await this.connection.transaction(async transManager => {
      const { idempKey } = await transManager.findOne<SubtransactionEntity>(SubtransactionEntity, id);
      await transManager.update(SubtransactionEntity, { id }, { state: SubtransactionStateEnum.CANCELLED, idempKey });
      return await transManager.findOneOrFail<SubtransactionEntity>(SubtransactionEntity, id);
    });
    return subtransactionEntity;
  }

  async findById(id: string): Promise<SubtransactionEntity> {
    const sunTransaction: SubtransactionEntity = await this.subtransactionRepository.findOne({ id });
    return sunTransaction;
  }

  async findByIdempKey(idempKey: string): Promise<SubtransactionEntity> {
    const sunTransaction: SubtransactionEntity = await this.subtransactionRepository.findOne({ idempKey });
    return sunTransaction;
  }

  async findAllByOrderId(orderId: string): Promise<SubtransactionEntity[]> {
    const sunTransactions: SubtransactionEntity[] = await this.subtransactionRepository.find({ orderId });
    return sunTransactions;
  }
}
