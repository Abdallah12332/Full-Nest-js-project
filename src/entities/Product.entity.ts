import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { Review } from "./Review.entity";
import { CartItem } from "./Cart_Item.entity";

@Entity()
export class Product {
  @Index()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ nullable: true })
  more_description?: string;

  @Column({ type: "decimal" })
  price: number;

  @Column({ type: "int" })
  stock: number;

  @Index()
  @Column({ nullable: true })
  categoryId?: string;

  @Column("simple-array")
  images: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Review, (review) => review.product, {
    cascade: true,
    onDelete: "CASCADE",
  })
  reviews: Review[];

  @OneToMany(() => CartItem, (cartItem) => cartItem.product, {
    cascade: true,
    onDelete: "CASCADE",
  })
  cartItems: CartItem[];
}
