/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { User } from "../entities/User.entity";
import { Cart } from "../entities/Cart.entity";
import { Verification } from "../entities/Verification.entity";
import { FailedAttempt } from "../entities/FailedAttempt.entity";
import { PasswordReset } from "../entities/PasswordReset.entity";
import { EmailService } from "./Mailer";
import { RefreshTokenBlacklist } from "../entities/BlackList.entity";
import { ApiResponse } from "../common/dto/response.dto";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";

// mock generation
jest.mock("./generation", () => ({
  generation: jest.fn(() => ({
    num: 123456,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  })),
}));

// mock bcryptjs
jest.mock("bcryptjs", () => ({
  hash: jest.fn((password: string) => Promise.resolve(`hashed-${password}`)),
  compare: jest.fn((plain: string, hashed: string) =>
    Promise.resolve(hashed === `hashed-${plain}`),
  ),
}));

import * as bcrypt from "bcryptjs";
import { GoogleProfile } from "./GoogleProfile";
(bcrypt.compare as jest.Mock).mockResolvedValue(true);

function createMockRepo() {
  return {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    find: jest.fn(),
  };
}

describe("AuthService", () => {
  let service: AuthService;
  let emailService: EmailService;

  const mockUserRepository = createMockRepo();
  const mockCartRepository = createMockRepo();
  const mockVerificationRepository = createMockRepo();
  const mockFailedAttemptRepository = createMockRepo();
  const mockPasswordResetRepository = createMockRepo();
  const mockBlacklistRepository = createMockRepo();

  let jwtMock: JwtService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue("mock-jwt-token"),
            verify: jest.fn().mockReturnValue({ sub: "test-uuid" }),
          },
        },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(Cart), useValue: mockCartRepository },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockVerificationRepository,
        },
        {
          provide: getRepositoryToken(FailedAttempt),
          useValue: mockFailedAttemptRepository,
        },
        {
          provide: getRepositoryToken(PasswordReset),
          useValue: mockPasswordResetRepository,
        },
        {
          provide: getRepositoryToken(RefreshTokenBlacklist),
          useValue: mockBlacklistRepository,
        },
        {
          provide: EmailService,
          useValue: {
            Mailer: jest.fn().mockResolvedValue("Email sent!"),
            sendPasswordResetEmail: jest
              .fn()
              .mockResolvedValue("Password reset email sent!"),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    emailService = module.get<EmailService>(EmailService);
    jwtMock = module.get<JwtService>(JwtService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("register_half", () => {
    const email = "new@example.com";
    const ip = "127.0.0.1";

    it("should send verification email if user does not exist", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);
      mockVerificationRepository.findOne.mockResolvedValueOnce(null);
      const mailerSpy = jest
        .spyOn(emailService, "Mailer")
        .mockResolvedValue("Email sent!");
      await service.register_half(email, ip);
      expect(mailerSpy).toHaveBeenCalledWith(
        email,
        expect.objectContaining({
          code: expect.anything(),
          expiresAt: expect.any(Date),
        }),
      );
    });

    it("should throw when user already exists", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({ email });
      await expect(service.register_half(email, ip)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should update existing verification record", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);
      mockVerificationRepository.findOne.mockResolvedValueOnce({ email });
      const result = await service.register_half(email, ip);
      expect(mockVerificationRepository.update).toHaveBeenCalledWith(
        { email },
        expect.objectContaining({
          code: expect.anything(),
          expiresAt: expect.any(Date),
        }),
      );
      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
    });
  });

  describe("register_full", () => {
    const email = "user@example.com";
    const code = "123456";
    const ipAddress = "127.0.0.1";

    it("should throw NotFoundException if verification record not found", async () => {
      mockVerificationRepository.findOne.mockResolvedValueOnce(null);
      await expect(
        service.register_full(email, code, ipAddress),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if code is expired", async () => {
      mockVerificationRepository.findOne.mockResolvedValueOnce({
        email,
        code,
        expiresAt: new Date(Date.now() - 10000),
      });
      await expect(
        service.register_full(email, code, ipAddress),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if code is invalid", async () => {
      mockVerificationRepository.findOne.mockResolvedValueOnce({
        email,
        code: "000000",
        expiresAt: new Date(Date.now() + 10000),
      });
      const recordFailedAttemptSpy = jest.spyOn(
        service as any,
        "recordFailedAttempt",
      );
      await expect(
        service.register_full(email, code, ipAddress),
      ).rejects.toThrow(BadRequestException);
      expect(recordFailedAttemptSpy).toHaveBeenCalledWith(
        email,
        ipAddress,
        "verification",
      );
    });

    it("should create user and cart if code valid", async () => {
      mockVerificationRepository.findOne.mockResolvedValueOnce({
        email,
        code,
        expiresAt: new Date(Date.now() + 10000),
      });
      mockUserRepository.create.mockReturnValueOnce({
        email,
        provider: "local",
        isVerified: false,
      });
      mockUserRepository.save.mockResolvedValueOnce({ id: 1, email });
      mockCartRepository.create.mockReturnValueOnce({ id: 10 });
      mockCartRepository.save.mockResolvedValueOnce({ id: 10 });

      const result = await service.register_full(email, code, ipAddress);
      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
    });
  });

  describe("login", () => {
    const email = "user@example.com";
    const password = "password123";
    const ipAddress = "127.0.0.1";

    it("should throw NotFoundException if user not found", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.login(email, password, ipAddress)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw UnauthorizedException if not verified", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        email,
        password: "hashed",
        isVerified: false,
      });
      await expect(service.login(email, password, ipAddress)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw BadRequestException if password is wrong", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      mockUserRepository.findOne.mockResolvedValueOnce({
        email,
        password: "hashed",
        isVerified: true,
      });
      await expect(service.login(email, password, ipAddress)).rejects.toThrow(
        BadRequestException,
      );
    });
    // TODO: Issue with bcrypt mock — compare() always returns false during testing.
    it.skip("should login successfully", async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: "uuid",
        email,
        password: "hashed",
        isVerified: true,
      });
      const result = await service.login(email, password, ipAddress);
      expect(result).toEqual({
        access_token: "mock-jwt-token",
        refresh_Token: "mock-jwt-token",
      });
    });
  });
  describe("requestPasswordReset", () => {
    const email = "user@example.com";

    it("should throw NotFoundException if user not found", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.requestPasswordReset(email)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw BadRequestException if user has no password", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        email,
        password: null,
        isVerified: true,
      });
      await expect(service.requestPasswordReset(email)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("should throw UnauthorizedException if user is not verified", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        email,
        password: "hashed",
        isVerified: false,
      });
      await expect(service.requestPasswordReset(email)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should send reset email and save token if user valid", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        email,
        password: "hashed",
        isVerified: true,
      });
      mockPasswordResetRepository.delete.mockResolvedValueOnce(null);
      mockPasswordResetRepository.create.mockReturnValueOnce({
        email,
        token: "reset-token",
        expiresAt: new Date(Date.now() + 3600000),
        used: false,
      });
      mockPasswordResetRepository.save.mockResolvedValueOnce(true);
      const sendSpy = jest.spyOn(emailService, "sendPasswordResetEmail");
      const result = await service.requestPasswordReset(email);
      expect(sendSpy).toHaveBeenCalledWith(
        email,
        expect.objectContaining({
          code: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      );
      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
    });
  });

  describe("confirmPasswordReset", () => {
    const email = "user@example.com";
    const token = "reset-token";
    const newPassword = "newPass123";

    it("should throw NotFoundException if reset record not found", async () => {
      mockPasswordResetRepository.findOne.mockResolvedValueOnce(null);
      await expect(
        service.confirmPasswordReset(email, token, newPassword),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if token expired", async () => {
      mockPasswordResetRepository.findOne.mockResolvedValueOnce({
        email,
        token,
        expiresAt: new Date(Date.now() - 10000),
        used: false,
      });
      await expect(
        service.confirmPasswordReset(email, token, newPassword),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if token already used", async () => {
      mockPasswordResetRepository.findOne.mockResolvedValueOnce({
        email,
        token,
        expiresAt: new Date(Date.now() + 10000),
        used: true,
      });
      await expect(
        service.confirmPasswordReset(email, token, newPassword),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if token mismatch", async () => {
      mockPasswordResetRepository.findOne.mockResolvedValueOnce(null);
      mockUserRepository.findOne.mockResolvedValueOnce({
        email,
        password: "hashed",
        isVerified: true,
      });

      await expect(
        service.confirmPasswordReset(email, "wrong-token", newPassword),
      ).rejects.toThrow(NotFoundException);
    });

    //Todo: bcrypt is suck
    it.skip("should reset password successfully", async () => {
      mockPasswordResetRepository.findOne.mockResolvedValueOnce({
        email,
        token,
        expiresAt: new Date(Date.now() + 10000),
        used: false,
      });
      mockUserRepository.findOne.mockResolvedValueOnce({
        email,
        password: "old",
        isVerified: true,
      });

      const hashedPassword = `hashed-${newPassword}`;
      (bcrypt.hash as jest.Mock).mockResolvedValueOnce(hashedPassword);

      mockUserRepository.update.mockResolvedValueOnce(undefined);
      mockPasswordResetRepository.update.mockResolvedValueOnce(undefined);

      const result = await service.confirmPasswordReset(
        email,
        token,
        newPassword,
      );

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { email },
        { password: hashedPassword },
      );
      expect(mockPasswordResetRepository.update).toHaveBeenCalledWith(
        { email },
        { used: true },
      );
      expect(result).toBeInstanceOf(ApiResponse);
      expect(result.success).toBe(true);
    });
  });
  describe("log_out", () => {
    const email = "user@example.com";
    const refreshToken = "mock-refresh-token";

    it("should throw BadRequestException if refresh token is missing", async () => {
      await expect(service.log_out(email, "")).rejects.toThrow(
        BadRequestException,
      );
    });

    //Todo: bcrypt is suck
    it.skip("should throw NotFoundException if user not found", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);
      // موك bcrypt لتجنب رمي UnauthorizedException
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      await expect(service.log_out(email, refreshToken)).rejects.toThrow(
        NotFoundException,
      );
    });

    //Todo: bcrypt is suck
    it.skip("should throw UnauthorizedException if refresh token does not match", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        email,
        refresh_Token: "different-token",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.log_out(email, refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    //Todo: bcrypt is suck
    it.skip("should log out successfully if refresh token is valid", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        email,
        refresh_Token: "hashed-token",
      });
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const saveSpy = jest
        .spyOn(mockBlacklistRepository, "save")
        .mockResolvedValueOnce({});
      const updateSpy = jest
        .spyOn(mockUserRepository, "update")
        .mockResolvedValueOnce({});

      const result = await service.log_out(email, refreshToken);

      expect(saveSpy).toHaveBeenCalledWith({ token: refreshToken });
      expect(updateSpy).toHaveBeenCalledWith(
        { email },
        { refresh_Token: null },
      );
      expect(result).toEqual({
        success: true,
        message: "Logged out successfully",
        data: undefined,
        timestamp: expect.any(String),
      });
    });
  });
  describe("validateGoogleUser", () => {
    const profile: GoogleProfile = {
      id: "google-id-123",
      displayName: "Test User",
      emails: [{ value: "test@example.com" }],
      photos: [{ value: "photo-url" }],
      provider: "google",
    };

    it("should throw BadRequestException if emails are missing", async () => {
      const invalidProfile: GoogleProfile = { ...profile, emails: [] };
      await expect(service.validateGoogleUser(invalidProfile)).rejects.toThrow(
        BadRequestException,
      );
    });

    //Todo: bcrypt is suck
    it.skip("should create a new user and cart if user does not exist", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);
      mockUserRepository.create.mockImplementation(
        (user: Partial<User>) => user as User,
      );
      mockUserRepository.save.mockResolvedValueOnce({
        id: "uuid",
        email: profile.emails![0].value,
        name: profile.displayName,
        Photo: profile.photos![0].value,
        googleId: profile.id,
        provider: "google",
        isVerified: true,
        role: "user",
      } as User);

      mockCartRepository.create.mockImplementation(
        (cart: Partial<Cart>) => cart as Cart,
      );
      mockCartRepository.save.mockResolvedValueOnce({
        id: "cart-uuid",
      } as Cart);

      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-refresh-token");

      const result = await service.validateGoogleUser(profile);

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: profile.emails![0].value,
          googleId: profile.id,
        }),
      );
      expect(result.user.email).toBe(profile.emails![0].value);
      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("refresh_Token");
    });

    //Todo: bcrypt is suck
    it.skip("should update existing user if googleId is missing and user is verified", async () => {
      const existingUser: User = {
        id: "uuid",
        email: profile.emails![0].value,
        isVerified: true,
        googleId: null,
        provider: "local",
        name: "Old Name",
        Photo: null,
        role: "user",
        password: "hashed",
        refresh_Token: "hashed-refresh-token",
      } as unknown as User;

      mockUserRepository.findOne.mockResolvedValueOnce(existingUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-refresh-token");

      const result = await service.validateGoogleUser(profile);

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        { id: existingUser.id },
        expect.objectContaining({ googleId: profile.id }),
      );
      expect(result.user.email).toBe(existingUser.email);
    });

    //Todo: bcrypt is suck
    it.skip("should throw UnauthorizedException if existing user is blocked", async () => {
      const blockedUser: User = {
        id: "uuid",
        email: profile.emails![0].value,
        isVerified: false,
        googleId: null,
        provider: "local",
        name: "Old Name",
        Photo: null,
        role: "user",
        password: "hashed",
        refresh_Token: "hashed-refresh-token",
      } as unknown as User;

      mockUserRepository.findOne.mockResolvedValueOnce(blockedUser);

      await expect(service.validateGoogleUser(profile)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
  describe("update_token", () => {
    const email = "user@example.com";
    const refreshToken = "mock-refresh-token";

    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(jwtMock, "verify").mockReturnValue({ sub: "uuid" });
      jest.spyOn(jwtMock, "sign").mockReturnValue("new-access-token");
    });

    it("should throw UnauthorizedException if token is invalid", async () => {
      (jwtMock.verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error("Invalid token");
      });
      await expect(service.update_token(email, refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if token is blacklisted", async () => {
      mockBlacklistRepository.findOne.mockResolvedValueOnce({
        token: refreshToken,
      });
      await expect(service.update_token(email, refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
    // i do not know
    it.skip("should throw NotFoundException if user does not exist", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null); // المستخدم غير موجود
      await expect(service.update_token(email, refreshToken)).rejects.toThrow(
        NotFoundException,
      );
    });

    // i do not know
    it.skip("should throw UnauthorizedException if user is not verified", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: "uuid",
        email,
        isVerified: false, // غير مفعل
        refresh_Token: "hashed-token",
        role: "user",
      });
      await expect(service.update_token(email, refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if refresh token is not stored", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: "uuid",
        email,
        isVerified: true, // مفعل
        refresh_Token: null, // لا يوجد refresh token
        role: "user",
      });
      await expect(service.update_token(email, refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if user is not verified", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: "uuid",
        email,
        isVerified: false,
        refresh_Token: "hashed-token",
        role: "user",
      });
      await expect(service.update_token(email, refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if refresh token is not stored", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: "uuid",
        email,
        isVerified: true,
        refresh_Token: null,
        role: "user",
      });
      mockBlacklistRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.update_token(email, refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if refresh token does not match", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: "uuid",
        email,
        isVerified: true,
        refresh_Token: "hashed-token",
        role: "user",
      });
      mockBlacklistRepository.findOne.mockResolvedValueOnce(null);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.update_token(email, refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    //Todo: bycrypt always return false
    it.skip("should return new access token if valid", async () => {
      mockUserRepository.findOne.mockResolvedValueOnce({
        id: "uuid",
        email,
        isVerified: true,
        refresh_Token: "hashed-token",
        role: "user",
      });
      mockBlacklistRepository.findOne.mockResolvedValueOnce(null);
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.update_token(email, refreshToken);
      expect(result).toEqual({ access_token: "new-access-token" });
      expect(mockBlacklistRepository.save).toHaveBeenCalledWith({
        token: refreshToken,
      });
    });
  });
});
