// ================= USER =================
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  Index,
} from "typeorm";
import { Order } from "./Order.entity";
import { Cart } from "./Cart.entity";
import { Review } from "./Review.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  Photo: string;

  @Column({ nullable: true })
  name?: string;

  @Index()
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ type: "enum", enum: ["local", "google"] })
  provider: "local" | "google";

  @Column({ nullable: true })
  googleId?: string;

  @Column({ type: "enum", enum: ["user", "admin"], default: "user" })
  role: "user" | "admin";

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true, type: "text", default: null })
  refresh_Token?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Order, (order) => order.user, {
    cascade: true,
    onDelete: "CASCADE",
  })
  orders: Order[];

  @OneToOne(() => Cart, (cart) => cart.user, {
    cascade: true,
    onDelete: "CASCADE",
  })
  cart: Cart;

  @OneToMany(() => Review, (review) => review.user, {
    cascade: true,
    onDelete: "CASCADE",
  })
  reviews: Review[];
}
