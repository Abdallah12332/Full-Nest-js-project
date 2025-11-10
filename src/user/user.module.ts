import { Module } from "@nestjs/common";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../entities/User.entity";
import { Review } from "../entities/Review.entity";
import { Product } from "../entities/Product.entity";
import { Cart } from "../entities/Cart.entity";
import { CartItem } from "../entities/Cart_Item.entity";
import { CachModule } from "../cach/cach.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Review, Product, Cart, CartItem]),
    CachModule,
  ],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
