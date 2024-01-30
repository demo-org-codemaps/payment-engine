import { Expose } from 'class-transformer';
import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from 'typeorm';

export abstract class BaseEntity {
  @Expose()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Expose()
  @Column({ update: false })
  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt;

  @Expose()
  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt;

  @Expose()
  @VersionColumn()
  version;
}
