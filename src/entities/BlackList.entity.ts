import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity()
@Index(["token"], { unique: true })
export class RefreshTokenBlacklist {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  token: string;

  @Column({ type: "uuid", nullable: true })
  userId: string;

  @CreateDateColumn({ type: "timestamp" })
  blacklistedAt: Date;
}
