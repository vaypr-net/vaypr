import { IsString, IsEmail, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetupSuperAdminDto {
  @ApiProperty({ example: 'change-this-to-a-strong-random-secret' })
  @IsString()
  @IsNotEmpty()
  setupSecret: string;

  @ApiProperty({ example: 'admin@vaypr.net' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'StrongPassword123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Super Admin' })
  @IsString()
  @IsNotEmpty()
  fullName: string;
}
