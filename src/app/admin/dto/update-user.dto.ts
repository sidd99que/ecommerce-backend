import { IsOptional, IsEmail, IsIn, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(['user', 'admin'])
  role?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
