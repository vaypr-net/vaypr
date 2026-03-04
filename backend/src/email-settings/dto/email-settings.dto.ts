import { IsEmail, IsString, IsOptional, IsMongoId, MaxLength } from 'class-validator';

export class UpdateEmailSettingsDto {
  @IsEmail()
  @IsOptional()
  supportInboxEmail?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  supportInboxName?: string;

  @IsMongoId()
  @IsOptional()
  defaultSenderId?: string | null; // Can be explicitly null to clear default

  @IsEmail()
  @IsOptional()
  defaultReplyToEmail?: string | null;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  defaultReplyToName?: string | null;
}

export class EmailSettingsResponseDto {
  id: string;
  ownerId: string;
  supportInboxEmail: string;
  supportInboxName?: string;
  defaultSenderId?: string | null;
  defaultReplyToEmail?: string | null;
  defaultReplyToName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
