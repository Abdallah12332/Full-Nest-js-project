import {
  Body,
  Controller,
  Post,
  Req,
  Get,
  UseGuards,
  NotFoundException,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { AuthGuard } from "@nestjs/passport";
import {
  RegisterHalfDto,
  RegisterCompleteDto,
  RegisterFullDto,
  LoginDto,
  PasswordResetRequestDto,
  PasswordResetConfirmDto,
  LogOutDto,
} from "./Dto/main_auth.dto";
import { GoogleProfile } from "./GoogleProfile";
import { Cookies } from "./Cookies";
import { ThrottlerGuard } from "@nestjs/throttler";
import { ApiResponse } from "../common/dto/response.dto";
import { ConfigService } from "@nestjs/config";

@UseGuards(ThrottlerGuard)
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post("half-register")
  async register_half(@Body() dto: RegisterHalfDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const result = await this.authService.register_half(dto.email, ipAddress);
    return result;
  }
  @Post("full_register")
  async register_full(@Body() dto: RegisterFullDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const result = await this.authService.register_full(
      dto.email,
      dto.code,
      ipAddress,
    );
    return result;
  }
  @Post("complete_register")
  async register_complete(
    @Body() dto: RegisterCompleteDto,
    @Res() res: Response,
  ) {
    const result = await this.authService.register_complete(
      dto.email,
      dto.password,
    );
    const refreshToken = result.refresh_Token;
    if (!refreshToken) throw new NotFoundException("refresh_token not found");
    const access_token = result.access_token;
    if (!access_token) throw new NotFoundException("access token not found");
    const ismatch = this.configService.get("NODE_ENV") === "production";

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: ismatch,
      sameSite: "strict",
      path: "/update_token",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json(
      ApiResponse.success("success", {
        access_token: access_token,
      }),
    );
  }
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || "unknown";
    const result = await this.authService.login(
      dto.email,
      dto.password,
      ipAddress,
    );
    const refreshToken = result.refresh_Token;
    if (!refreshToken) throw new NotFoundException("refersh_token not found");
    const access_token = result.access_token;
    if (!access_token) throw new NotFoundException("not found access token");
    const ismatch = this.configService.get("NODE_ENV") === "production";
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: ismatch,
      sameSite: "strict",
      path: "/update_token",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json(
      ApiResponse.success("success", {
        access_token,
      }),
    );
  }

  // هنا التوكن هيتمسح بس في الفرونت اند اما في السيرفر مش عارف ايه الطريقه الآمنه الامسح بيها اي توكن
  @Post("log_out")
  log_out(@Body() dto: LogOutDto) {
    return this.authService.log_out(dto.email, dto.refresh_token);
  }

  @Post("password-reset-request")
  async requestPasswordReset(@Body() dto: PasswordResetRequestDto) {
    return await this.authService.requestPasswordReset(dto.email);
  }

  @Post("password-reset-confirm")
  async confirmPasswordReset(@Body() dto: PasswordResetConfirmDto) {
    return await this.authService.confirmPasswordReset(
      dto.email,
      dto.token,
      dto.newPassword,
    );
  }

  @Get("callback/google")
  @UseGuards(AuthGuard("google"))
  async googleCallback(
    @Req() req: Request & { user: GoogleProfile },
    @Res() res: Response,
  ) {
    const profile = {
      id: req.user.id,
      emails: req.user.emails,
      displayName: req.user.displayName,
      photos: req.user.photos,
      provider: req.user.provider,
    };

    const google = await this.authService.validateGoogleUser(profile);
    const refreshToken = google.refresh_Token;
    if (!refreshToken) throw new NotFoundException("not found refresh token");
    const access_token = google.token;
    if (!access_token) throw new NotFoundException("not found access token");
    const user = google.user;
    if (!user) throw new NotFoundException("user not found");
    const ismatch = this.configService.get("NODE_ENV") === "production";
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: ismatch,
      sameSite: "strict",
      path: "/update_token",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json(ApiResponse.success("success", { user, access_token }));
  }
  @Post("update_token")
  async update_token(
    @Body("email") email: string,
    @Req() req: Request,
  ): Promise<ApiResponse<{ access_token: string }>> {
    const cookies = req.cookies as Cookies;
    const refreshToken = cookies.refreshToken;

    if (!refreshToken) {
      throw new NotFoundException("no refresh Token");
    }
    const access_token = await this.authService.update_token(
      email,
      refreshToken,
    );
    return ApiResponse.success("Token refreshed successfully", {
      access_token: access_token.access_token,
    });
  }
  @Get("csrf")
  getCsrfToken(@Req() req: Request) {
    return { csrfToken: req.csrfToken?.() };
  }
}
