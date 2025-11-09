/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from "@nestjs/testing";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import {
  RegisterHalfDto,
  RegisterFullDto,
  RegisterCompleteDto,
  LoginDto,
  PasswordResetRequestDto,
  PasswordResetConfirmDto,
} from "./Dto/main_auth.dto";
import { Request, Response } from "express";
import { NotFoundException } from "@nestjs/common";
import { GoogleProfile } from "./GoogleProfile";
import { ConfigService } from "@nestjs/config";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [{ ttl: 60, limit: 10 }],
        }),
      ],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register_half: jest.fn(),
            register_full: jest.fn(),
            register_complete: jest.fn(),
            login: jest.fn(),
            log_out: jest.fn(),
            requestPasswordReset: jest.fn(),
            confirmPasswordReset: jest.fn(),
            validateGoogleUser: jest.fn(),
            update_token: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("register_half", () => {
    it("should call authService.register_half with correct email and IP", async () => {
      const dto: RegisterHalfDto = { email: "test@example.com" };
      const req = { ip: "127.0.0.1", socket: {} } as Request;
      (authService.register_half as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await controller.register_half(dto, req);
      expect(authService.register_half).toHaveBeenCalledWith(
        "test@example.com",
        "127.0.0.1",
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe("register_full", () => {
    it("should call authService.register_full with correct params", async () => {
      const dto: RegisterFullDto = { email: "a@b.com", code: "123456" };
      const req = { ip: "1.1.1.1", socket: {} } as Request;
      (authService.register_full as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await controller.register_full(dto, req);
      expect(authService.register_full).toHaveBeenCalledWith(
        "a@b.com",
        "123456",
        "1.1.1.1",
      );
      expect(result).toEqual({ success: true });
    });
  });
  describe("register_complete", () => {
    let mockResponse: any;

    beforeEach(() => {
      mockResponse = {
        cookie: jest.fn(),
        json: jest.fn(), // أضف هذه
        status: jest.fn().mockReturnThis(), // وأضف هذه في حال كان في res.status()
      };
    });

    it("should call authService.register_complete with correct params and return success", async () => {
      const dto: RegisterCompleteDto = { email: "x@y.com", password: "pass" };
      (authService.register_complete as jest.Mock).mockResolvedValue({
        refresh_Token: "refresh-signed-token",
        access_token: "signed-token",
      });

      await controller.register_complete(dto, mockResponse);

      expect(authService.register_complete).toHaveBeenCalledWith(
        "x@y.com",
        "pass",
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-signed-token",
        expect.objectContaining({
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/update_token",
        }),
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "success",
          data: expect.objectContaining({
            access_token: "signed-token",
          }),
        }),
      );
    });

    it("should throw NotFoundException if refresh_Token is missing", async () => {
      const dto: RegisterCompleteDto = { email: "x@y.com", password: "pass" };
      (authService.register_complete as jest.Mock).mockResolvedValue({
        refresh_Token: undefined,
        access_token: "signed-token",
      });

      await expect(
        controller.register_complete(dto, mockResponse),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if access_token is missing", async () => {
      const dto: RegisterCompleteDto = { email: "x@y.com", password: "pass" };
      (authService.register_complete as jest.Mock).mockResolvedValue({
        refresh_Token: "refresh-signed-token",
        access_token: undefined,
      });

      await expect(
        controller.register_complete(dto, mockResponse),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("login", () => {
    it("should call authService.login, set cookie, and return access token", async () => {
      const dto: LoginDto = { email: "a@b.com", password: "123" };
      const req = {
        ip: "2.2.2.2",
        socket: { remoteAddress: "2.2.2.2" },
      } as unknown as Request;

      const res = {
        cookie: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      const mockResult = {
        access_token: "access-token-value",
        refresh_Token: "refresh-token-value",
      };

      (authService.login as jest.Mock).mockResolvedValue(mockResult);

      await controller.login(dto, req, res);

      // ✅ تحقق أن login اتنادى صح
      expect(authService.login).toHaveBeenCalledWith(
        "a@b.com",
        "123",
        "2.2.2.2",
      );
      // ✅ تحقق من إعداد الكوكي
      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-token-value",
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/update_token",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        },
      );

      // ✅ تحقق من استدعاء res.json بالرد الصحيح
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "success",
          data: { access_token: "access-token-value" },
        }),
      );
    });

    it("should throw NotFoundException if refresh_Token is missing", async () => {
      const dto: LoginDto = { email: "a@b.com", password: "123" };
      const req = {
        ip: "1.1.1.1",
        socket: { remoteAddress: "1.1.1.1" },
      } as unknown as Request;
      const res = {} as Response;

      (authService.login as jest.Mock).mockResolvedValue({
        access_token: "access-token-value",
        refresh_Token: undefined,
      });

      await expect(controller.login(dto, req, res)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException if access_token is missing", async () => {
      const dto: LoginDto = { email: "a@b.com", password: "123" };
      const req = {
        ip: "1.1.1.1",
        socket: { remoteAddress: "1.1.1.1" },
      } as unknown as Request;
      const res = {} as Response;

      (authService.login as jest.Mock).mockResolvedValue({
        access_token: undefined,
        refresh_Token: "refresh-token-value",
      });

      await expect(controller.login(dto, req, res)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("log_out", () => {
    it("should call authService.log_out and return success", async () => {
      const mockResponse = {
        success: true,
        message: "Logged out successfully",
      };
      (authService.log_out as jest.Mock).mockResolvedValue(mockResponse);

      const dto = {
        email: "test@example.com",
        refresh_token: "mock_refresh_token",
      };

      const result = await controller.log_out(dto);

      expect(authService.log_out).toHaveBeenCalledWith(
        dto.email,
        dto.refresh_token,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe("requestPasswordReset", () => {
    it("should call authService.requestPasswordReset with email", async () => {
      const dto: PasswordResetRequestDto = { email: "a@b.com" };
      (authService.requestPasswordReset as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await controller.requestPasswordReset(dto);
      expect(authService.requestPasswordReset).toHaveBeenCalledWith("a@b.com");
      expect(result).toEqual({ success: true });
    });
  });

  describe("confirmPasswordReset", () => {
    it("should call authService.confirmPasswordReset with correct params", async () => {
      const dto: PasswordResetConfirmDto = {
        email: "a@b.com",
        token: "token",
        newPassword: "newpass",
      };
      (authService.confirmPasswordReset as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await controller.confirmPasswordReset(dto);
      expect(authService.confirmPasswordReset).toHaveBeenCalledWith(
        "a@b.com",
        "token",
        "newpass",
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe("googleCallback", () => {
    it("should call authService.validateGoogleUser, set cookie, and return ApiResponse", async () => {
      const req = {
        user: {
          id: "1",
          emails: [{ value: "a@b.com" }],
          displayName: "Test User",
          photos: [{ value: "photo.jpg" }],
          provider: "google",
        },
      } as unknown as Request & { user: GoogleProfile };

      const res = {
        cookie: jest.fn(),
        json: jest.fn(),
      } as unknown as Response;

      const mockGoogleResponse = {
        refresh_Token: "refresh-token-value",
        token: "access-token-value",
        user: {
          id: "user-uuid",
          email: "a@b.com",
          name: "Test User",
        },
      };

      (authService.validateGoogleUser as jest.Mock).mockResolvedValue(
        mockGoogleResponse,
      );

      await controller.googleCallback(req, res);

      // ✅ التحقق من استدعاء validateGoogleUser بالقيم الصحيحة
      expect(authService.validateGoogleUser).toHaveBeenCalledWith({
        id: "1",
        emails: [{ value: "a@b.com" }],
        displayName: "Test User",
        photos: [{ value: "photo.jpg" }],
        provider: "google",
      });

      // ✅ تحقق من إعداد الكوكي
      expect(res.cookie).toHaveBeenCalledWith(
        "refreshToken",
        "refresh-token-value",
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/update_token",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        },
      );

      // ✅ تحقق من الرد النهائي
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "success",
          data: {
            user: mockGoogleResponse.user,
            access_token: "access-token-value",
          },
        }),
      );
    });

    it("should throw NotFoundException if refresh_Token is missing", async () => {
      const req = {
        user: {
          id: "1",
          emails: [{ value: "a@b.com" }],
          displayName: "Test User",
          photos: [{ value: "photo.jpg" }],
          provider: "google",
        },
      } as unknown as Request & { user: GoogleProfile };

      const res = {} as Response;

      (authService.validateGoogleUser as jest.Mock).mockResolvedValue({
        token: "access-token-value",
        refresh_Token: undefined,
        user: { id: "user-uuid" },
      });

      await expect(controller.googleCallback(req, res)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException if access token is missing", async () => {
      const req = {
        user: {
          id: "1",
          emails: [{ value: "a@b.com" }],
          displayName: "Test User",
          photos: [{ value: "photo.jpg" }],
          provider: "google",
        },
      } as unknown as Request & { user: GoogleProfile };

      const res = {} as Response;

      (authService.validateGoogleUser as jest.Mock).mockResolvedValue({
        token: undefined,
        refresh_Token: "refresh-token-value",
        user: { id: "user-uuid" },
      });

      await expect(controller.googleCallback(req, res)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw NotFoundException if user is missing", async () => {
      const req = {
        user: {
          id: "1",
          emails: [{ value: "a@b.com" }],
          displayName: "Test User",
          photos: [{ value: "photo.jpg" }],
          provider: "google",
        },
      } as unknown as Request & { user: GoogleProfile };

      const res = {} as Response;

      (authService.validateGoogleUser as jest.Mock).mockResolvedValue({
        token: "access-token-value",
        refresh_Token: "refresh-token-value",
        user: undefined,
      });

      await expect(controller.googleCallback(req, res)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("update_token", () => {
    it("should call authService.update_token with email and refresh_Token from cookie", async () => {
      const req = {
        cookies: { refreshToken: "cookie-token" },
      } as unknown as Request & { cookies: { refreshToken?: string } };

      (authService.update_token as jest.Mock).mockResolvedValue({
        access_token: "new-access-token",
      });

      const result = await controller.update_token("a@b.com", req);

      expect(authService.update_token).toHaveBeenCalledWith(
        "a@b.com",
        "cookie-token",
      );
      expect(result).toEqual(
        expect.objectContaining({
          success: true,
          message: "Token refreshed successfully",
          data: expect.objectContaining({
            access_token: "new-access-token",
          }),
        }),
      );
    });

    it("should throw NotFoundException if refresh_Token is missing", async () => {
      const req = {
        cookies: {},
      } as unknown as Request;

      await expect(controller.update_token("a@b.com", req)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
