import { IsEmail, IsString, IsEnum } from 'class-validator';
import { UserRole } from './enums/user-role.enum';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsString()
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsString()
  refreshToken?: string
}
