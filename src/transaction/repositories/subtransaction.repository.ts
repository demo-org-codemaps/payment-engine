import { EntityRepository, Repository } from 'typeorm';
import { SubtransactionEntity } from '../entities';

@EntityRepository(SubtransactionEntity)
export class SubtransactionRepository extends Repository<SubtransactionEntity> {}
