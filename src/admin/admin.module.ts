import { Module } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminController } from "./admin.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../entities/User.entity";
import { Cart } from "../entities/Cart.entity";
import { Product } from "../entities/Product.entity";
import { Review } from "../entities/Review.entity";
import { CartItem } from "../entities/Cart_Item.entity";
import { LogModule } from "../log/log.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Cart, Product, Review, CartItem]),
    LogModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
