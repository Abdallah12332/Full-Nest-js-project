// src/Entity/Log.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class Log {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  level: string; // info, error, warn

  @Column({ type: "longtext" })
  message: string;

  @Column({ nullable: true })
  context?: string;

  @CreateDateColumn()
  timestamp: Date;
}
