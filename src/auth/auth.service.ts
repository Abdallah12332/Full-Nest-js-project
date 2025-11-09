import {
  BadRequestException,
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from "@nestjs/common";
import { User } from "../entities/User.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Cart } from "../entities/Cart.entity";
import { JwtService } from "@nestjs/jwt";
import { generation } from "./generation";
import { EmailService } from "./Mailer";
import { Verification } from "../entities/Verification.entity";
import { FailedAttempt } from "../entities/FailedAttempt.entity";
import { PasswordReset } from "../entities/PasswordReset.entity";
import * as bcrypt from "bcryptjs";
import * as crypto from "crypto";
import { GoogleProfile } from "./GoogleProfile";
import { JwtPayload } from "./JwtPayload";
import { ApiResponse } from "../common/dto/response.dto";
import { RefreshTokenBlacklist } from "../entities/BlackList.entity";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Cart)
    private readonly CartRepo: Repository<Cart>,
    @InjectRepository(Verification)
    private readonly VerficationRepo: Repository<Verification>,
    @InjectRepository(FailedAttempt)
    private readonly FailedAttemptRepo: Repository<FailedAttempt>,
    @InjectRepository(PasswordReset)
    private readonly PasswordResetRepo: Repository<PasswordReset>,
    @InjectRepository(RefreshTokenBlacklist)
    private readonly blacklistRepo: Repository<RefreshTokenBlacklist>,
    private readonly EmailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  // Rate limiting helper methods
  private async checkRateLimit(
    email: string,
    ipAddress: string,
    type: "login" | "verification",
  ): Promise<void> {
    // Check rate limit for this specific email+ip combination
    const attempt = await this.FailedAttemptRepo.findOne({
      where: { email, ipAddress, type },
    });

    if (attempt) {
      // Check if account is locked
      if (attempt.lockedUntil && new Date() < attempt.lockedUntil) {
        const remainingTime = Math.ceil(
          (attempt.lockedUntil.getTime() - Date.now()) / 60000,
        );
        throw new HttpException(
          `Account temporarily locked. Try again in ${remainingTime} minutes.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Check attempt count
      const maxAttempts = type === "login" ? 5 : 3;
      const lockDuration = type === "login" ? 30 : 15; // minutes

      if (attempt.attempts >= maxAttempts) {
        const lockUntil = new Date(Date.now() + lockDuration * 60 * 1000);
        // Update the specific email+ip record
        await this.FailedAttemptRepo.update(
          { email, ipAddress, type },
          { lockedUntil: lockUntil },
        );
        throw new HttpException(
          `Too many failed attempts. Account locked for ${lockDuration} minutes.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  private async recordFailedAttempt(
    email: string,
    ipAddress: string,
    type: "login" | "verification",
  ): Promise<void> {
    // Find existing attempt for this email+ip combination
    const attempt = await this.FailedAttemptRepo.findOne({
      where: { email, ipAddress, type },
    });

    // Update or create attempt record
    if (attempt) {
      await this.FailedAttemptRepo.update(
        { email, ipAddress, type },
        {
          attempts: attempt.attempts + 1,
          lastAttempt: new Date(),
        },
      );
    } else {
      const newAttempt = this.FailedAttemptRepo.create({
        email,
        ipAddress,
        type,
        attempts: 1,
        lastAttempt: new Date(),
      });
      await this.FailedAttemptRepo.save(newAttempt);
    }
  }

  private async clearFailedAttempts(
    email: string,
    ipAddress: string,
    type: "login" | "verification",
  ): Promise<void> {
    const attempt = await this.FailedAttemptRepo.findOne({
      where: { email, ipAddress, type },
    });

    if (attempt) {
      await this.FailedAttemptRepo.update(
        { email, ipAddress, type },
        {
          attempts: 0,
          lockedUntil: undefined,
          lastAttempt: new Date(),
        },
      );
    }
  }

  async register_half(email: string, ipAddress: string) {
    // Check rate limit for verification codes
    await this.checkRateLimit(email, ipAddress, "verification");

    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      throw new BadRequestException(
        "انت لديك حساب انتقل الي صفحه تسجيل الدخول (login page)",
      );
    }
    const ok = await this.VerficationRepo.findOne({ where: { email } });

    const { num, expiresAt } = generation();
    const dto = {
      code: num,
      expiresAt: expiresAt,
    };
    await this.EmailService.Mailer(email, dto);
    const Verfication = {
      email,
      code: num,
      expiresAt,
    };
    if (!ok) {
      const createable = this.VerficationRepo.create(Verfication);
      await this.VerficationRepo.save(createable);
    } else {
      await this.VerficationRepo.update(
        { email },
        { code: dto.code, expiresAt },
      );
    }

    return ApiResponse.success("Email sent!");
  }
  async register_full(email: string, code: string, ipAddress: string) {
    const ok = await this.VerficationRepo.findOne({ where: { email } });
    if (!ok) {
      throw new NotFoundException("Invalid email or code");
    }
    if (new Date() > ok.expiresAt) {
      throw new BadRequestException("Invalid email or code");
    }
    if (ok.code !== code) {
      // Record failed verification attempt
      await this.recordFailedAttempt(email, ipAddress, "verification");
      throw new BadRequestException("Invalid email or code");
    }

    // Clear failed attempts on successful verification
    await this.clearFailedAttempts(email, ipAddress, "verification");
    await this.VerficationRepo.delete({ email });

    const user = this.userRepository.create({
      email: email,
      provider: "local",
      isVerified: false,
      googleId: undefined,
      role: "user",
    });
    await this.userRepository.save(user);
    const cart = this.CartRepo.create({ user: user });
    await this.CartRepo.save(cart);
    return ApiResponse.success("Code verified successfully");
  }
  async register_complete(email: string, password: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException("Invalid email");
    }
    if (user.isVerified === true) {
      throw new BadRequestException("Invalid email");
    }

    const hashed_password = await bcrypt.hash(password, 10);

    const payload: JwtPayload = {
      sub: user.id,
      username: user.email,
      role: user.role,
    };
    const envrefresh = String(
      this.configService.get<string>("JWT_EXPIRES_REFRESHTOKEN"),
    );
    const refresh_Token = this.jwtService.sign(payload, {
      expiresIn: envrefresh,
      issuer: "Protofolio",
    });
    const hashed_refersh_Token = await bcrypt.hash(refresh_Token, 10);
    await this.userRepository.update(
      { email },
      {
        password: hashed_password,
        isVerified: true,
        refresh_Token: hashed_refersh_Token,
      },
    );
    const access_token = this.jwtService.sign(payload, {
      issuer: "Protofolio",
    });
    return { access_token: access_token, refresh_Token: refresh_Token };
  }

  async login(email?: string, password?: string, ipAddress?: string) {
    // Check rate limit for login attempts
    if (email && ipAddress) {
      await this.checkRateLimit(email, ipAddress, "login");
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      if (email && ipAddress)
        await this.recordFailedAttempt(email, ipAddress, "login");
      throw new NotFoundException("Invalid email or password");
    }
    const hashed_password = user.password;
    if (!hashed_password) {
      if (email && ipAddress)
        await this.recordFailedAttempt(email, ipAddress, "login");
      throw new NotFoundException("Invalid email or password");
    }
    if (!password) {
      if (email && ipAddress)
        await this.recordFailedAttempt(email, ipAddress, "login");
      throw new NotFoundException("Invalid email or password");
    }
    if (user.isVerified === false) {
      throw new UnauthorizedException("Invalid email or password");
    }
    const ok = await bcrypt.compare(password, hashed_password);
    if (!ok) {
      if (email && ipAddress)
        await this.recordFailedAttempt(email, ipAddress, "login");
      throw new BadRequestException("Invalid email or password");
    }

    // Clear failed attempts on successful login
    if (email && ipAddress)
      await this.clearFailedAttempts(email, ipAddress, "login");

    const payload: JwtPayload = {
      sub: user.id,
      username: user.email,
      role: user.role,
    };
    const envrefresh = String(
      this.configService.get<string>("JWT_EXPIRES_REFRESHTOKEN"),
    );
    const refresh_Token = this.jwtService.sign(payload, {
      expiresIn: envrefresh,
      issuer: "Protofolio",
    });
    const hashed_refersh_Token = await bcrypt.hash(refresh_Token, 10);
    await this.userRepository.update(
      { email: user.email },
      { refresh_Token: hashed_refersh_Token },
    );
    const login_token = this.jwtService.sign(payload, { issuer: "Protofolio" });
    return { access_token: login_token, refresh_Token: refresh_Token };
  }
  // Password reset methods
  async requestPasswordReset(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException("Invalid email");
    }

    // Check if user has a password set
    if (!user.password) {
      throw new BadRequestException("Invalid email");
    }
    if (user.isVerified === false) {
      throw new UnauthorizedException("Invalid email");
    }

    // Generate reset token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Delete any existing reset tokens for this email
    await this.PasswordResetRepo.delete({ email });

    // Create new reset token
    const passwordReset = this.PasswordResetRepo.create({
      email,
      token,
      expiresAt,
      used: false,
    });
    await this.PasswordResetRepo.save(passwordReset);

    // Send reset email
    const resetDto = {
      code: token,
      expiresAt: expiresAt,
    };
    await this.EmailService.sendPasswordResetEmail(email, resetDto);

    return ApiResponse.success("Password reset email sent!");
  }

  async confirmPasswordReset(
    email: string,
    token: string,
    newPassword: string,
  ) {
    const resetRecord = await this.PasswordResetRepo.findOne({
      where: { email, token },
    });

    if (!resetRecord) {
      throw new NotFoundException("Invalid email or token");
    }

    if (resetRecord.used) {
      throw new BadRequestException("Invalid email or token");
    }

    if (new Date() > resetRecord.expiresAt) {
      throw new BadRequestException("Invalid email or token");
    }

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException("Invalid email or token");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await this.userRepository.update({ email }, { password: hashedPassword });

    // Mark token as used
    await this.PasswordResetRepo.update({ email, token }, { used: true });

    return ApiResponse.success("Password reset successful!");
  }
  // تحسين دالة log_out
  async log_out(email: string, refresh_Token: string) {
    if (!refresh_Token) {
      throw new BadRequestException("Invalid email");
    }

    // البحث عن المستخدم
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException("Invalid email");
    }
    // التحقق من أن الـ refresh token يطابق المخزن
    const isValidToken = user.refresh_Token
      ? await bcrypt.compare(refresh_Token, user.refresh_Token)
      : false;
    if (!isValidToken) {
      throw new UnauthorizedException("Invalid email");
    }

    // إضافة الـ refresh token للقائمة السوداء
    await this.blacklistRepo.save({ token: refresh_Token });

    // مسح الـ refresh token من قاعدة البيانات
    await this.userRepository.update({ email }, { refresh_Token: null });

    return ApiResponse.success("Logged out successfully");
  }

  async validateGoogleUser(profile: GoogleProfile) {
    if (!profile.emails || profile.emails.length === 0) {
      throw new BadRequestException("Invalid email");
    }

    let user = await this.userRepository.findOne({
      where: { email: profile.emails[0].value },
    });

    if (!user) {
      user = this.userRepository.create({
        email: profile.emails[0].value,
        name: profile.displayName,
        Photo: profile.photos?.[0]?.value,
        googleId: profile.id,
        provider: "google",
        isVerified: true,
        role: "user",
      });
      await this.userRepository.save(user);

      const cart = this.CartRepo.create({ user });
      await this.CartRepo.save(cart);
    } else if (!user.googleId) {
      if (!user.isVerified) {
        throw new UnauthorizedException("Invalid email");
      }
      await this.userRepository.update(
        { id: user.id },
        {
          googleId: profile.id,
          provider: "google",
          isVerified: true,
          Photo: profile.photos?.[0]?.value,
          name: profile.displayName,
        },
      );
    }

    // إنشاء payload وJWT
    const payload: JwtPayload = {
      sub: user.id,
      username: user.email,
      role: user.role,
    };
    const token = this.jwtService.sign(payload, { issuer: "Protofolio" });

    const envrefresh = String(
      this.configService.get<string>("JWT_EXPIRES_REFRESHTOKEN"),
    );
    // إنشاء refresh token مشفر
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: envrefresh,
      issuer: "Protofolio",
    });
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(
      { email: user.email },
      { refresh_Token: hashedRefreshToken },
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        photo: user.Photo,
        role: user.role,
      },
      token,
      refresh_Token: refreshToken,
    };
  }
  async update_token(
    email: string,
    refreshToken: string,
  ): Promise<{ access_token: string }> {
    // التحقق من صحة التوكن أولاً

    try {
      this.jwtService.verify(refreshToken, {
        issuer: "Protofolio",
      });
    } catch {
      throw new UnauthorizedException("Invalid email");
    }

    // التحقق من القائمة السوداء - باستخدام التوكن الأصلي (غير المشفر)
    const isBlacklisted = await this.blacklistRepo.findOne({
      where: { token: refreshToken },
    });
    if (isBlacklisted) {
      throw new UnauthorizedException("Invalid email");
    }

    // البحث عن المستخدم
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException("Invalid email");
    }

    // التحقق من حالة المستخدم
    if (!user.isVerified) {
      throw new UnauthorizedException("Invalid email");
    }

    // التحقق من وجود refresh token مخزن
    if (!user.refresh_Token) {
      throw new UnauthorizedException("Invalid email");
    }

    // تحقق من تطابق refresh token مع المخزن في قاعدة البيانات
    const isMatch = await bcrypt.compare(refreshToken, user.refresh_Token);
    if (!isMatch) {
      throw new UnauthorizedException("Invalid email");
    }

    // إنشاء tokens جديدة
    const newPayload = { sub: user.id, username: user.email, role: user.role };

    const access_token = this.jwtService.sign(newPayload, {
      issuer: "Protofolio",
      expiresIn: "15m",
    });

    // إبطال الـ refresh token القديم
    await this.blacklistRepo.save({ token: refreshToken });

    return {
      access_token,
    };
  }
}
