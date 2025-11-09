import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AdminModule } from "./admin/admin.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "./entities/User.entity";
import { Product } from "./entities/Product.entity";
import { Cart } from "./entities/Cart.entity";
import { CartItem } from "./entities/Cart_Item.entity";
import { Order } from "./entities/Order.entity";
import { Review } from "./entities/Review.entity";
import { FailedAttempt } from "./entities/FailedAttempt.entity";
import { PasswordReset } from "./entities/PasswordReset.entity";
import { AuthModule } from "./auth/auth.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Verification } from "./entities/Verification.entity";
import { UserModule } from "./user/user.module";
import * as Joi from "joi";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { LogModule } from "./log/log.module";
import { AllExceptionsFilter } from "./log/filters/all-exceptions.filter";
import { Log } from "./entities/Log.entity";
import { RefreshTokenBlacklist } from "./entities/BlackList.entity";
import { CsrfMiddleware } from "./csrf.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        GOOGLE_CLIENT_ID: Joi.string().required(),
        GOOGLE_CLIENT_SECRET: Joi.string().required(),
        GOOGLE_CALLBACK_URL: Joi.string().uri().required(),
        JWT_SECRET: Joi.string().required(),
        EMAIL: Joi.string().email().required(),
        PASSWORD: Joi.string().required(),
        DB_PASS: Joi.string().required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USER: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        DB_POOL_SIZE: Joi.number().required(),
        JWT_EXPIRES_ACCESSTOKEN: Joi.string().required(),
        JWT_EXPIRES_REFRESHTOKEN: Joi.string().required(),
        CORS: Joi.string().uri().required(),
        PORT: Joi.string().required(),
        NODE_ENV: Joi.string().required(),
      }),
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: "short",
          ttl: 60,
          limit: 5,
        },
        {
          name: "medium",
          ttl: 600,
          limit: 20,
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "mariadb",
        host: config.get<string>("DB_HOST"),
        port: config.get<number>("DB_PORT"),
        username: config.get<string>("DB_USER"),
        password: config.get<string>("DB_PASS"),
        database: config.get<string>("DB_NAME"),
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
        synchronize: false,
        extra: {
          connectionLimit: config.get<number>("DB_POOL_SIZE") || 10,
        },
      }),
    }),
    AdminModule,
    AuthModule,
    UserModule,
    LogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes(
      { path: "*", method: RequestMethod.POST },

      { path: "*", method: RequestMethod.PUT },

      { path: "*", method: RequestMethod.DELETE },

      { path: "*", method: RequestMethod.PATCH },
    );
  }
}
