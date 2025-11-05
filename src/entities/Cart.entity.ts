import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./User.entity";
import { CartItem } from "./Cart_Item.entity";

// ================= CART =================
@Entity()
export class Cart {
  @Index()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => User, (user) => user.cart, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @OneToMany(() => CartItem, (item) => item.cart, {
    cascade: true,
    onDelete: "CASCADE",
  })
  items: CartItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
