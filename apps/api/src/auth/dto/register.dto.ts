import { IsEmail, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @MinLength(2)
  name: string;

  @MinLength(6)
  password: string;
}
