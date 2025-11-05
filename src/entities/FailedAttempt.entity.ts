import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity()
@Index(["email", "ipAddress", "type"], { unique: true }) // Composite unique constraint
@Index(["email", "type"]) // Index for email-based queries
@Index(["ipAddress", "type"]) // Index for IP-based queries
export class FailedAttempt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  ipAddress: string;

  @Column({
    type: "enum",
    enum: ["login", "verification"],
  })
  type: "login" | "verification"; // Type of attempt

  @Column({ default: 1 })
  attempts: number;

  @Column({ nullable: true })
  lastAttempt: Date;

  @Column({ nullable: true })
  lockedUntil: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
