import { DataSource } from "typeorm";
import { User } from "./entities/User.entity";
import { Product } from "./entities/Product.entity";
import { Cart } from "./entities/Cart.entity";
import { CartItem } from "./entities/Cart_Item.entity";
import { Order } from "./entities/Order.entity";
import { Review } from "./entities/Review.entity";
import { FailedAttempt } from "./entities/FailedAttempt.entity";
import { PasswordReset } from "./entities/PasswordReset.entity";
import { Verification } from "./entities/Verification.entity";
import { Log } from "./entities/Log.entity";
import { RefreshTokenBlacklist } from "./entities/BlackList.entity";

export const AppDataSource = new DataSource({
  type: "mariadb",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  entities: [
    User,
    Product,
    Cart,
    CartItem,
    Order,
    Review,
    Verification,
    FailedAttempt,
    PasswordReset,
    Log,
    RefreshTokenBlacklist,
  ],
  migrations: ["dist/migrations/*.js"],
  synchronize: false,
  extra: {
    connectionLimit: Number(process.env.DB_POOL_SIZE) || 10,
  },
});
