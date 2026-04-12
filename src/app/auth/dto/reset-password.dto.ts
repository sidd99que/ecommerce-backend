import { IsEmail, IsString, MinLength } from "class-validator/types/decorator/decorators";
import { Body } from "@nestjs/common";

// dto/reset-password.dto.ts
export class ResetPasswordDto {
  @IsEmail()
  email!: string;

  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}

