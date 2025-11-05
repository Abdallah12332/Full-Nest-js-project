import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { JwtStrategy } from "./jwt.strategy";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Cart } from "../entities/Cart.entity";
import { User } from "../entities/User.entity";
import { EmailService } from "./Mailer";
import { Verification } from "../entities/Verification.entity";
import { FailedAttempt } from "../entities/FailedAttempt.entity";
import { PasswordReset } from "../entities/PasswordReset.entity";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { GoogleStrategy } from "./google.strategy";
import { RefreshTokenBlacklist } from "../entities/BlackList.entity";

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    TypeOrmModule.forFeature([
      User,
      Cart,
      Verification,
      FailedAttempt,
      PasswordReset,
      RefreshTokenBlacklist,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: config.get<string>("JWT_EXPIRES_ACCESSTOKEN"),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EmailService, GoogleStrategy],
  exports: [JwtModule],
})
export class AuthModule {}
