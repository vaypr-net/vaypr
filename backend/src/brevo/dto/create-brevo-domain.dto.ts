import { IsString, IsNotEmpty, IsLowercase, Matches } from 'class-validator';

export class CreateBrevoDomainDto {
  @IsString()
  @IsNotEmpty()
  @IsLowercase()
  @Matches(/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/, {
    message: 'Invalid domain format',
  })
  domain: string;
}
