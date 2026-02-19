import { IsString, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class VerifyCodeDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(6, 6)
  @Matches(/^[0-9]{6}$/, { message: 'code must be 6 digits' })
  code: string;
}

export default VerifyCodeDto;
