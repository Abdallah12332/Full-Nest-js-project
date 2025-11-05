import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

// ================= HALF REGISTER =================
export class RegisterHalfDto {
  @ApiProperty({
    example: "test@example.com",
    description: "User email to start partial registration",
  })
  @IsEmail()
  email: string;
}

// ================= FULL REGISTER =================
export class RegisterFullDto {
  @ApiProperty({
    example: "test@example.com",
    description: "User email used for full registration step",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "123456",
    description: "Verification code sent to email",
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}

// ================= COMPLETE REGISTER =================
export class RegisterCompleteDto {
  @ApiProperty({
    example: "test@example.com",
    description: "User email for final registration step",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "StrongPass123!",
    description: "Password for the new account",
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

// ================= LOGIN =================
export class LoginDto {
  @ApiProperty({
    example: "user@example.com",
    description: "User email used for login",
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "StrongPass123!",
    description: "User password used for login",
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  password: string;
}

// ================= PASSWORD RESET REQUEST =================
export class PasswordResetRequestDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Email used to send password reset token",
  })
  @IsEmail()
  email: string;
}

// ================= PASSWORD RESET CONFIRM =================
export class PasswordResetConfirmDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Email associated with the reset token",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "abcdef123456",
    description: "Password reset token sent to user email",
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: "NewStrongPassword1!",
    description: "New password to set for the account",
  })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

// ================= LOGOUT =================
export class LogOutDto {
  @ApiProperty({
    example: "user@example.com",
    description: "Email of the user to log out",
  })
  @IsEmail()
  email: string;

  refresh_token: string;
}
