import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from "typeorm";
import { User } from "./User.entity";

// ================= ORDER =================
@Entity()
export class Order {
  @Index()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.orders, { onDelete: "CASCADE" })
  user: User;

  @Column({ type: "decimal" })
  total: number;

  @Column({
    type: "enum",
    enum: ["pending", "completed", "cancelled"],
    default: "pending",
  })
  status: "pending" | "completed" | "cancelled";

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
