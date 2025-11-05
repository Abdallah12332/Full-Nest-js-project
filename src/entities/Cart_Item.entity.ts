import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Cart } from "./Cart.entity";
import { Product } from "./Product.entity";

// ================= CART ITEM =================
@Entity()
export class CartItem {
  @Index()
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "cartId" })
  cart: Cart;

  @ManyToOne(() => Product, (product) => product.cartItems, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "productId" })
  product: Product;

  @Column({ type: "int" })
  quantity: number;
}
